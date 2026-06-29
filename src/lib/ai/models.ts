export type ModelId = "claude-opus-4-8" | "claude-sonnet-4-6" | "gemini-2.5-flash";

export type ModelOption = {
  id: ModelId;
  label: string;
  provider: "claude" | "gemini";
};

export const MODEL_OPTIONS: ModelOption[] = [
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", provider: "claude" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "claude" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "gemini" },
];

export const DEFAULT_MODEL_ID: ModelId = "gemini-2.5-flash";

export function getModelOption(id: ModelId | string | undefined | null): ModelOption {
  return MODEL_OPTIONS.find((m) => m.id === id) ?? MODEL_OPTIONS.find((m) => m.id === DEFAULT_MODEL_ID)!;
}
