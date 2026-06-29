import { AiProvider } from "./provider";
import { ClaudeProvider } from "./claude";
import { GeminiProvider } from "./gemini";
import { ModelId, getModelOption } from "./models";

export function getAiProvider(modelId?: ModelId | string | null): AiProvider {
  const option = getModelOption(modelId);
  if (option.provider === "gemini") return new GeminiProvider(option.id);
  return new ClaudeProvider(option.id);
}

export * from "./provider";
export * from "./schema";
export * from "./models";
