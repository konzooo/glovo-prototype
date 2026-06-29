import { GoogleGenAI } from "@google/genai";
import { EXTRACTION_RESPONSE_SCHEMA, EXTRACTION_SYSTEM_PROMPT, ExtractionResponse } from "./schema";
import { AiProvider, DescriptionInput, DietaryInferenceInput, InferredDietaryTag, MenuFileInput } from "./provider";
import { DESCRIPTION_SYSTEM_PROMPT, DIETARY_INFERENCE_SYSTEM_PROMPT } from "./prompts";

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
    const response = await ai.models.generateContent({
      model: this.model,
      contents: [
        {
          role: "user",
          parts: [{ text: "Extract this menu." }, { inlineData: { mimeType: input.mediaType, data: input.base64Data } }],
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
    const response = await ai.models.generateContent({
      model: this.model,
      contents: `Write a short description for this menu item.\nName: ${input.name}${
        input.section ? `\nSection: ${input.section}` : ""
      }`,
      config: {
        systemInstruction: DESCRIPTION_SYSTEM_PROMPT,
      },
    });
    const text = response.text;
    if (!text) throw new Error("Model response contained no text.");
    return text.trim();
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
}
