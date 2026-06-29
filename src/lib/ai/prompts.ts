import { EXTRACTION_SYSTEM_PROMPT } from "./schema";

export type PromptId = "extract_menu" | "generate_description" | "infer_dietary";

export type PromptDefinition = {
  id: PromptId;
  title: string;
  description: string;
  defaultPrompt: string;
  supportsCustomOverride: boolean;
};

export const DESCRIPTION_SYSTEM_PROMPT =
  "You write short, appetizing menu-item descriptions for a food delivery app. One or two sentences, no fluff, no emoji, no markdown formatting. If you genuinely cannot infer anything reasonable about the dish from its name alone, write a brief generic description rather than inventing specific ingredients you're not confident about.";

export const DIETARY_INFERENCE_SYSTEM_PROMPT =
  "You suggest plausible dietary tags for a menu item based ONLY on its name and description — you have no access to the actual menu, photo, or ingredient list, so these are inferences, not facts. Be conservative: only suggest a tag if the dish's identity strongly implies it (e.g. 'cheese tortellini' is not vegan, because cheese is dairy). Never suggest a 'free from X' style tag — only positive dietary categories you have reasonable evidence for (e.g. Vegetarian, Vegan, Contains nuts, Contains gluten). If genuinely unsure, return an empty list rather than guessing.";

export const PROMPT_DEFINITIONS: PromptDefinition[] = [
  {
    id: "extract_menu",
    title: "Menu extraction",
    description: "Used when menu images or PDFs are converted into structured item rows.",
    defaultPrompt: EXTRACTION_SYSTEM_PROMPT,
    supportsCustomOverride: true,
  },
  {
    id: "generate_description",
    title: "Create description",
    description: "Used when an item description is generated from the item name and section.",
    defaultPrompt: DESCRIPTION_SYSTEM_PROMPT,
    supportsCustomOverride: false,
  },
  {
    id: "infer_dietary",
    title: "Infer dietary labels",
    description: "Used when dietary suggestions are inferred from an item name and description.",
    defaultPrompt: DIETARY_INFERENCE_SYSTEM_PROMPT,
    supportsCustomOverride: false,
  },
];

export function getPromptDefinition(id: PromptId): PromptDefinition {
  return PROMPT_DEFINITIONS.find((definition) => definition.id === id) ?? PROMPT_DEFINITIONS[0];
}
