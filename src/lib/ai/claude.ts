import Anthropic from "@anthropic-ai/sdk";
import {
  BATCH_DESCRIPTION_RESPONSE_SCHEMA,
  EDIT_DRAFT_RESPONSE_SCHEMA,
  EXTRACTION_RESPONSE_SCHEMA,
  EXTRACTION_SYSTEM_PROMPT,
  ExtractionResponse,
} from "./schema";
import {
  AiProvider,
  BatchDescriptionInput,
  BatchDescriptionResult,
  DescriptionInput,
  DietaryInferenceInput,
  EditDraftInput,
  EditDraftItem,
  InferredDietaryTag,
  MenuFileInput,
} from "./provider";
import {
  DESCRIPTION_CREATE_SYSTEM_PROMPT,
  DESCRIPTION_ENHANCE_SYSTEM_PROMPT,
  DIETARY_INFERENCE_SYSTEM_PROMPT,
  EDIT_DRAFT_SYSTEM_PROMPT,
} from "./prompts";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local to enable live extraction, or use the offline sample/import path."
    );
  }
  return new Anthropic({ apiKey });
}

function firstText(content: Anthropic.ContentBlock[]): string {
  const block = content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!block) throw new Error("Model response contained no text block.");
  return block.text;
}

export class ClaudeProvider implements AiProvider {
  constructor(private model: string = "claude-opus-4-8") {}

  async extractMenu(input: MenuFileInput): Promise<ExtractionResponse> {
    const client = getClient();

    const fileBlocks: Anthropic.Messages.ContentBlockParam[] = input.files.flatMap((file, index) => {
      const block: Anthropic.Messages.ContentBlockParam =
        file.mediaType === "application/pdf"
          ? {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: file.base64Data },
            }
          : {
              type: "image",
              source: { type: "base64", media_type: file.mediaType, data: file.base64Data },
            };
      return input.files.length > 1 ? [{ type: "text" as const, text: `Page ${index + 1}:` }, block] : [block];
    });

    const response = await client.messages.create({
      model: this.model,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: input.systemPrompt?.trim() || EXTRACTION_SYSTEM_PROMPT,
      output_config: { format: { type: "json_schema", schema: EXTRACTION_RESPONSE_SCHEMA } },
      messages: [
        {
          role: "user",
          content: [
            ...fileBlocks,
            { type: "text", text: input.files.length > 1 ? "Extract this menu from all pages above." : "Extract this menu." },
          ],
        },
      ],
    });

    const text = firstText(response.content);
    return JSON.parse(text) as ExtractionResponse;
  }

  async generateDescription(input: DescriptionInput): Promise<string> {
    const client = getClient();
    const defaultPrompt = input.mode === "enhance" ? DESCRIPTION_ENHANCE_SYSTEM_PROMPT : DESCRIPTION_CREATE_SYSTEM_PROMPT;
    const userText =
      input.mode === "enhance"
        ? `Enhance this menu item description.\nName: ${input.name}${
            input.section ? `\nSection: ${input.section}` : ""
          }\nCurrent description: ${input.existingDescription ?? ""}`
        : `Write a short description for this menu item.\nName: ${input.name}${
            input.section ? `\nSection: ${input.section}` : ""
          }`;
    const response = await client.messages.create({
      model: this.model,
      max_tokens: 300,
      system: input.systemPrompt?.trim() || defaultPrompt,
      messages: [{ role: "user", content: userText }],
    });
    return firstText(response.content).trim();
  }

  async generateDescriptionsBatch(input: BatchDescriptionInput): Promise<BatchDescriptionResult[]> {
    const client = getClient();
    const defaultPrompt = input.mode === "enhance" ? DESCRIPTION_ENHANCE_SYSTEM_PROMPT : DESCRIPTION_CREATE_SYSTEM_PROMPT;
    const system = `${input.systemPrompt?.trim() || defaultPrompt}\n\nYou will receive a JSON array of menu items. Return one result per item, matching each by its "id". ${
      input.mode === "enhance"
        ? "Each item includes its current description to enhance."
        : "Each item has no description yet — write one from its name and section."
    }`;
    const response = await client.messages.create({
      model: this.model,
      max_tokens: 4000,
      system,
      output_config: { format: { type: "json_schema", schema: BATCH_DESCRIPTION_RESPONSE_SCHEMA } },
      messages: [{ role: "user", content: JSON.stringify(input.items) }],
    });
    const parsed = JSON.parse(firstText(response.content)) as { results: BatchDescriptionResult[] };
    return parsed.results;
  }

  async editDraft(input: EditDraftInput): Promise<EditDraftItem[]> {
    const client = getClient();
    const imageBlocks: Anthropic.Messages.ContentBlockParam[] = (input.referenceImages ?? []).flatMap((file, index) => [
      { type: "text" as const, text: `Reference image ${index + 1}:` },
      {
        type: "image" as const,
        source: { type: "base64" as const, media_type: file.mediaType, data: file.base64Data },
      },
    ]);
    const response = await client.messages.create({
      model: this.model,
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system: input.systemPrompt?.trim() || EDIT_DRAFT_SYSTEM_PROMPT,
      output_config: { format: { type: "json_schema", schema: EDIT_DRAFT_RESPONSE_SCHEMA } },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Instruction: ${input.instruction}\n\nCurrent items:\n${JSON.stringify(input.items)}`,
            },
            ...imageBlocks,
          ],
        },
      ],
    });
    const parsed = JSON.parse(firstText(response.content)) as { items: EditDraftItem[] };
    return parsed.items;
  }

  async inferDietaryTags(input: DietaryInferenceInput): Promise<InferredDietaryTag[]> {
    const client = getClient();
    const response = await client.messages.create({
      model: this.model,
      max_tokens: 500,
      system: DIETARY_INFERENCE_SYSTEM_PROMPT,
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              tags: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string" },
                    evidence: { type: "string", description: "Why you inferred this, in one sentence." },
                  },
                  required: ["label", "evidence"],
                  additionalProperties: false,
                },
              },
            },
            required: ["tags"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "user",
          content: `Item name: ${input.name}\n${input.description ? `Description: ${input.description}\n` : ""}${
            input.section ? `Section: ${input.section}` : ""
          }`,
        },
      ],
    });
    const parsed = JSON.parse(firstText(response.content)) as { tags: InferredDietaryTag[] };
    return parsed.tags;
  }
}
