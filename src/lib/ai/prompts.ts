import { EXTRACTION_SYSTEM_PROMPT } from "./schema";

export type PromptId =
  | "extract_menu"
  | "description_create"
  | "description_enhance"
  | "infer_dietary"
  | "edit_draft";

export type PromptDefinition = {
  id: PromptId;
  title: string;
  description: string;
  defaultPrompt: string;
  supportsCustomOverride: boolean;
};

export const DESCRIPTION_CREATE_SYSTEM_PROMPT =
  "You write short, confident menu-item descriptions for a food delivery app, from just a dish name (and optionally its menu section). Keep it low-key and casual: one short sentence, no fluff, no emoji, no markdown formatting. Sound sure of yourself about the food even if you're inferring from the name alone — don't hedge or apologize for not having more detail. If you genuinely cannot infer anything reasonable about the dish from its name, write a brief generic sentence rather than inventing specific ingredients you're not confident about. Always write the description in the same language as the dish name and section you're given.";

export const DESCRIPTION_ENHANCE_SYSTEM_PROMPT =
  "You lightly polish an existing menu-item description for a food delivery app, making it a bit more suitable for an app like Glovo. Keep the author's original meaning and any specific details (ingredients, preparation) — just tighten the wording, fix tone/grammar, and trim fluff. One or two short sentences, no emoji, no markdown formatting. Do not pad it with invented details just to make it longer. Always write the polished description in the same language as the original description you were given.";

export const DIETARY_INFERENCE_SYSTEM_PROMPT =
  "You suggest plausible dietary tags for a menu item based ONLY on its name and description — you have no access to the actual menu, photo, or ingredient list, so these are inferences, not facts. Be conservative: only suggest a tag if the dish's identity strongly implies it (e.g. 'cheese tortellini' is not vegan, because cheese is dairy). Never suggest a 'free from X' style tag — only positive dietary categories you have reasonable evidence for (e.g. Vegetarian, Vegan, Contains nuts, Contains gluten). If genuinely unsure, return an empty list rather than guessing.";

export const EDIT_DRAFT_SYSTEM_PROMPT =
  "You restructure a restaurant's menu catalog based on a natural-language instruction from the person managing it. You will receive the current list of items as JSON and one instruction describing a structural or content change (e.g. changing currency, splitting size variants into their own sections, renaming sections). The user may also attach reference images; use them only as visual evidence for the requested edit, and do not re-extract or rewrite unrelated parts of the menu unless the instruction asks for it. Apply only the requested change; leave everything else exactly as it was. Never invent new dishes, prices, or items that aren't implied by the existing list or visibly supported by an attached reference image, unless the instruction explicitly asks you to add something. Keep each item's \"id\" unchanged whenever that row still represents the same conceptual item after your edit, even if you changed its section, name, or variant fields. If you split one row into multiple new rows (e.g. turning a variant into its own item), keep the original id on exactly one of the resulting rows and set id to null on any additional rows you create. Return the full updated list via the provided JSON schema only.";

export const PROMPT_DEFINITIONS: PromptDefinition[] = [
  {
    id: "extract_menu",
    title: "Menu extraction",
    description: "Used when menu images or PDFs are converted into structured item rows.",
    defaultPrompt: EXTRACTION_SYSTEM_PROMPT,
    supportsCustomOverride: true,
  },
  {
    id: "description_create",
    title: "Create description",
    description: "Used when an item has no description yet and one is generated from its name and section.",
    defaultPrompt: DESCRIPTION_CREATE_SYSTEM_PROMPT,
    supportsCustomOverride: false,
  },
  {
    id: "description_enhance",
    title: "Enhance description",
    description: "Used when an item already has a description and it's lightly polished for the app.",
    defaultPrompt: DESCRIPTION_ENHANCE_SYSTEM_PROMPT,
    supportsCustomOverride: false,
  },
  {
    id: "infer_dietary",
    title: "Infer dietary labels",
    description: "Used when dietary suggestions are inferred from an item name and description.",
    defaultPrompt: DIETARY_INFERENCE_SYSTEM_PROMPT,
    supportsCustomOverride: false,
  },
  {
    id: "edit_draft",
    title: "Prompt edit (entire menu)",
    description: "Used when the AI draft of the whole catalog is restructured from a free-text instruction.",
    defaultPrompt: EDIT_DRAFT_SYSTEM_PROMPT,
    supportsCustomOverride: false,
  },
];

export function getPromptDefinition(id: PromptId): PromptDefinition {
  return PROMPT_DEFINITIONS.find((definition) => definition.id === id) ?? PROMPT_DEFINITIONS[0];
}
