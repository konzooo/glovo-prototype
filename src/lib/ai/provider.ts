import { ExtractionResponse } from "./schema";

export type MenuFile = {
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif" | "application/pdf";
  base64Data: string;
};

// All pages are sent to the model in a single call (rather than one call per page) so it
// can dedupe sections/variants split across a page break, and so we pay for one extraction
// pass instead of N. Order matters: it's the page order shown to the model, and
// ExtractedItem.source_page_index refers back into this array (1-based).
export type MenuFileInput = {
  files: MenuFile[];
  systemPrompt?: string;
};

export type DescriptionMode = "create" | "enhance";

export type DescriptionInput = {
  mode: DescriptionMode;
  name: string;
  section?: string | null;
  existingDescription?: string | null;
  systemPrompt?: string;
};

export type BatchDescriptionItem = {
  id: string;
  name: string | null;
  section?: string | null;
  description?: string | null;
};

export type BatchDescriptionInput = {
  mode: DescriptionMode;
  items: BatchDescriptionItem[];
  systemPrompt?: string;
};

export type BatchDescriptionResult = {
  id: string;
  description: string;
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

// Editable subset of Item sent to/from the prompt-edit call. `id` is nullable so the
// model can mint new rows (e.g. splitting a variant into its own item) — null ids get
// fresh app-side metadata, matched ids carry over photo/approval/confidence state.
export type EditDraftItem = {
  id: string | null;
  name: string | null;
  section: string | null;
  description: string | null;
  price: { amount: number | null; currency: string | null } | null;
  variant_label: string | null;
  variant_group: string | null;
  dietary_tags: { label: string; source: "stated" | "inferred"; evidence: string | null }[];
};

export type EditDraftInput = {
  items: EditDraftItem[];
  instruction: string;
  systemPrompt?: string;
};

// Thin abstraction so we can A/B Claude vs. another vision model later without touching
// callers. Only Claude is implemented for this prototype; see gemini.ts for the stub.
export interface AiProvider {
  extractMenu(input: MenuFileInput): Promise<ExtractionResponse>;
  generateDescription(input: DescriptionInput): Promise<string>;
  generateDescriptionsBatch(input: BatchDescriptionInput): Promise<BatchDescriptionResult[]>;
  inferDietaryTags(input: DietaryInferenceInput): Promise<InferredDietaryTag[]>;
  editDraft(input: EditDraftInput): Promise<EditDraftItem[]>;
}
