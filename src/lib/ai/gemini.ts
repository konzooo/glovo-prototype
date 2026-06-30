import { GoogleGenAI } from "@google/genai";
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

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local to use a Gemini model, switch to Claude, or use the offline sample/import path."
    );
  }
  return new GoogleGenAI({ apiKey });
}

export class GeminiProvider implements AiProvider {
  constructor(private model: string = "gemini-2.5-flash") {}

  async extractMenu(input: MenuFileInput): Promise<ExtractionResponse> {
    const ai = getClient();
    const fileParts = input.files.flatMap((file, index) =>
      input.files.length > 1
        ? [{ text: `Page ${index + 1}:` }, { inlineData: { mimeType: file.mediaType, data: file.base64Data } }]
        : [{ inlineData: { mimeType: file.mediaType, data: file.base64Data } }]
    );
    const response = await ai.models.generateContent({
      model: this.model,
      contents: [
        {
          role: "user",
          parts: [
            ...fileParts,
            { text: input.files.length > 1 ? "Extract this menu from all pages above." : "Extract this menu." },
          ],
        },
      ],
      config: {
        systemInstruction: input.systemPrompt?.trim() || EXTRACTION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: EXTRACTION_RESPONSE_SCHEMA,
      },
    });
    const text = response.text;
    if (!text) throw new Error("Model response contained no text.");
    return JSON.parse(text) as ExtractionResponse;
  }

  async generateDescription(input: DescriptionInput): Promise<string> {
    const ai = getClient();
    const defaultPrompt = input.mode === "enhance" ? DESCRIPTION_ENHANCE_SYSTEM_PROMPT : DESCRIPTION_CREATE_SYSTEM_PROMPT;
    const contents =
      input.mode === "enhance"
        ? `Enhance this menu item description.\nName: ${input.name}${
            input.section ? `\nSection: ${input.section}` : ""
          }\nCurrent description: ${input.existingDescription ?? ""}`
        : `Write a short description for this menu item.\nName: ${input.name}${
            input.section ? `\nSection: ${input.section}` : ""
          }`;
    const response = await ai.models.generateContent({
      model: this.model,
      contents,
      config: {
        systemInstruction: input.systemPrompt?.trim() || defaultPrompt,
      },
    });
    const text = response.text;
    if (!text) throw new Error("Model response contained no text.");
    return text.trim();
  }

  async generateDescriptionsBatch(input: BatchDescriptionInput): Promise<BatchDescriptionResult[]> {
    const ai = getClient();
    const defaultPrompt = input.mode === "enhance" ? DESCRIPTION_ENHANCE_SYSTEM_PROMPT : DESCRIPTION_CREATE_SYSTEM_PROMPT;
    const systemInstruction = `${input.systemPrompt?.trim() || defaultPrompt}\n\nYou will receive a JSON array of menu items. Return one result per item, matching each by its "id". ${
      input.mode === "enhance"
        ? "Each item includes its current description to enhance."
        : "Each item has no description yet — write one from its name and section."
    }`;
    const response = await ai.models.generateContent({
      model: this.model,
      contents: JSON.stringify(input.items),
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: BATCH_DESCRIPTION_RESPONSE_SCHEMA,
      },
    });
    const text = response.text;
    if (!text) throw new Error("Model response contained no text.");
    const parsed = JSON.parse(text) as { results: BatchDescriptionResult[] };
    return parsed.results;
  }

  async inferDietaryTags(input: DietaryInferenceInput): Promise<InferredDietaryTag[]> {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: this.model,
      contents: `Item name: ${input.name}\n${input.description ? `Description: ${input.description}\n` : ""}${
        input.section ? `Section: ${input.section}` : ""
      }`,
      config: {
        systemInstruction: DIETARY_INFERENCE_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: {
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
    });
    const text = response.text;
    if (!text) throw new Error("Model response contained no text.");
    const parsed = JSON.parse(text) as { tags: InferredDietaryTag[] };
    return parsed.tags;
  }

  async editDraft(input: EditDraftInput): Promise<EditDraftItem[]> {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: this.model,
      contents: [
        {
          role: "user",
          parts: [
            { text: `Instruction: ${input.instruction}\n\nCurrent items:\n${JSON.stringify(input.items)}` },
            ...(input.referenceImages ?? []).flatMap((file, index) => [
              { text: `Reference image ${index + 1}:` },
              { inlineData: { mimeType: file.mediaType, data: file.base64Data } },
            ]),
          ],
        },
      ],
      config: {
        systemInstruction: input.systemPrompt?.trim() || EDIT_DRAFT_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: EDIT_DRAFT_RESPONSE_SCHEMA,
      },
    });
    const text = response.text;
    if (!text) throw new Error("Model response contained no text.");
    const parsed = JSON.parse(text) as { items: EditDraftItem[] };
    return parsed.items;
  }
}
