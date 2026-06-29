import Anthropic from "@anthropic-ai/sdk";
import { EXTRACTION_RESPONSE_SCHEMA, EXTRACTION_SYSTEM_PROMPT, ExtractionResponse } from "./schema";
import {
  AiProvider,
  DescriptionInput,
  DietaryInferenceInput,
  InferredDietaryTag,
  MenuFileInput,
} from "./provider";
import { DESCRIPTION_SYSTEM_PROMPT, DIETARY_INFERENCE_SYSTEM_PROMPT } from "./prompts";

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

    const fileBlock: Anthropic.Messages.ContentBlockParam =
      input.mediaType === "application/pdf"
        ? {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: input.base64Data },
          }
        : {
            type: "image",
            source: { type: "base64", media_type: input.mediaType, data: input.base64Data },
          };

    const response = await client.messages.create({
      model: this.model,
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system: input.systemPrompt?.trim() || EXTRACTION_SYSTEM_PROMPT,
      output_config: { format: { type: "json_schema", schema: EXTRACTION_RESPONSE_SCHEMA } },
      messages: [
        {
          role: "user",
          content: [fileBlock, { type: "text", text: "Extract this menu." }],
        },
      ],
    });

    const text = firstText(response.content);
    return JSON.parse(text) as ExtractionResponse;
  }

  async generateDescription(input: DescriptionInput): Promise<string> {
    const client = getClient();
    const response = await client.messages.create({
      model: this.model,
      max_tokens: 300,
      system: DESCRIPTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Write a short description for this menu item.\nName: ${input.name}${
            input.section ? `\nSection: ${input.section}` : ""
          }`,
        },
      ],
    });
    return firstText(response.content).trim();
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
