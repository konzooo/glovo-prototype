import { ExtractionResponse } from "./schema";

export type MenuFileInput = {
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif" | "application/pdf";
  base64Data: string;
  systemPrompt?: string;
};

export type DescriptionInput = {
  name: string;
  section?: string | null;
};

export type DietaryInferenceInput = {
  name: string;
  description?: string | null;
  section?: string | null;
};

export type InferredDietaryTag = {
  label: string;
  evidence: string; // model's stated rationale for the inference
};

// Thin abstraction so we can A/B Claude vs. another vision model later without touching
// callers. Only Claude is implemented for this prototype; see gemini.ts for the stub.
export interface AiProvider {
  extractMenu(input: MenuFileInput): Promise<ExtractionResponse>;
  generateDescription(input: DescriptionInput): Promise<string>;
  inferDietaryTags(input: DietaryInferenceInput): Promise<InferredDietaryTag[]>;
}
