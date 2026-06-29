// Tracks how long real extraction calls actually took, per model, so the "estimated
// time" shown during extraction gets more accurate the more this model has been used —
// instead of staying a guessed flat number forever.

const STORAGE_KEY = "glovo-menu-extraction-timings-v1";
const MAX_SAMPLES_PER_MODEL = 20;
const DEFAULT_SECONDS_PER_PAGE = 7;
const MIN_ESTIMATE_MS = 5000;

type TimingSample = { pages: number; durationMs: number };
type TimingStore = Record<string, TimingSample[]>;

function readStore(): TimingStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TimingStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: TimingStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // best-effort — losing timing history isn't worth surfacing an error for
  }
}

export function recordExtractionDuration(modelId: string, pages: number, durationMs: number) {
  if (pages <= 0 || durationMs <= 0) return;
  const store = readStore();
  const samples = [...(store[modelId] ?? []), { pages, durationMs }].slice(-MAX_SAMPLES_PER_MODEL);
  store[modelId] = samples;
  writeStore(store);
}

export function hasTimingHistory(modelId: string): boolean {
  return (readStore()[modelId]?.length ?? 0) > 0;
}

// Average seconds-per-page from this model's past runs, falling back to a flat
// assumption until enough real extractions have been recorded.
export function estimateExtractionMs(modelId: string, pages: number): number {
  const samples = readStore()[modelId] ?? [];
  const perPageMs =
    samples.length > 0
      ? samples.reduce((sum, s) => sum + s.durationMs / s.pages, 0) / samples.length
      : DEFAULT_SECONDS_PER_PAGE * 1000;
  return Math.max(MIN_ESTIMATE_MS, Math.round(perPageMs * Math.max(1, pages)));
}
