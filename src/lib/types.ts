export type DietarySource = "stated" | "inferred";

export type DietaryTag = {
  label: string; // e.g. "Vegetarian", "Gluten-free"
  source: DietarySource;
  evidence: string | null; // where on the menu this was found / why inferred
};

export type Price = {
  amount: number | null;
  currency: string | null;
};

// One row per dish/variant. Size/portion variants (Small/Large, 1/2 ración,
// 6"/Footlong) are flattened into separate items that share a variant_group.
export type Item = {
  id: string;
  menuId: string; // logical menu/batch this item belongs to
  sourcePageLabel?: string | null; // e.g. "Page 1" from the ordered upload list
  sourceFileName?: string | null;
  name: string | null;
  section: string | null;
  description: string | null;
  price: Price | null;
  variant_label: string | null;
  variant_group: string | null;
  dietary_tags: DietaryTag[];
  has_photo: boolean | null;
  photoUrl: string | null; // local data URL from a manual thumbnail upload
  confidence: number | null;
  // workflow fields, not from the model
  description_is_ai_draft: boolean;
  approved: boolean;
};

export type Menu = {
  id: string;
  name: string; // logical menu label, e.g. "Main menu" — UI/filter only, never exported
  fileName: string;
};

export type SourcePage = {
  label: string;
  fileName: string | null;
  previewUrl: string | null;
  mimeType: string | null;
};

// A working copy of the catalog produced by free-text "edit the whole doc" prompts,
// kept separate from `items` until the reviewer discards or promotes it. `prompts`
// is the running history of requests applied to this draft so far (chat-like).
export type AiDraft = {
  prompts: string[];
  items: Item[];
};

export type Restaurant = {
  id: string;
  name: string;
  menus: Menu[];
  sourcePages?: SourcePage[];
  items: Item[];
  aiDraft?: AiDraft | null;
};

export type IssueType =
  | "missing_name"
  | "missing_price"
  | "missing_description"
  | "missing_image"
  | "dietary_inferred";

export const ISSUE_LABELS: Record<IssueType, string> = {
  missing_name: "Missing name",
  missing_price: "Missing price",
  missing_description: "Missing description",
  missing_image: "Missing image",
  dietary_inferred: "Dietary inferred",
};
