"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { useRestaurantStore, ListScope } from "@/lib/store";
import { Item } from "@/lib/types";
import { BatchDescriptionResult } from "@/lib/ai/provider";

export function BulkEditAiModal({
  open,
  onClose,
  restaurantId,
  scope,
  items,
}: {
  open: boolean;
  onClose: () => void;
  restaurantId: string;
  scope: ListScope;
  items: Item[];
}) {
  const applyAiDescription = useRestaurantStore((s) => s.applyAiDescription);
  const selectedModel = useRestaurantStore((s) => s.selectedModel);

  const [descriptions, setDescriptions] = useState(true);
  const [mode, setMode] = useState<"empty" | "enhance">("empty");
  const [running, setRunning] = useState(false);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canRun = descriptions && !running;

  function closeAndReset() {
    if (running) return; // don't let a backdrop click/Escape orphan the in-flight request
    setAppliedCount(null);
    setError(null);
    onClose();
  }

  async function runBatch(batchMode: "create" | "enhance", batchItems: Item[]): Promise<BatchDescriptionResult[]> {
    if (batchItems.length === 0) return [];
    const res = await fetch("/api/describe-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: batchMode,
        model: selectedModel,
        items: batchItems.map((it) => ({ id: it.id, name: it.name, section: it.section, description: it.description })),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to generate descriptions.");
    return data.results as BatchDescriptionResult[];
  }

  async function runAi() {
    setError(null);
    setRunning(true);
    try {
      // "Only fill empty" -> a single create-batch. "Also enhance existing" -> items
      // with no description still get created, items with one get enhanced — at most
      // two LLM calls total for the whole run, regardless of menu size.
      const createItems = items.filter((it) => !it.description?.trim());
      const enhanceItems = mode === "enhance" ? items.filter((it) => it.description?.trim()) : [];

      const [createResults, enhanceResults] = await Promise.all([
        runBatch("create", createItems),
        runBatch("enhance", enhanceItems),
      ]);

      for (const result of [...createResults, ...enhanceResults]) {
        applyAiDescription(restaurantId, result.id, result.description, scope);
      }
      setAppliedCount(createResults.length + enhanceResults.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate descriptions.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Modal open={open} onClose={closeAndReset} title="Bulk edit with AI">
      <div className="space-y-4">
        <p className="text-sm text-neutral-500">
          Fill in or enhance a field across every item in this list at once. Each item still needs an explicit
          approve — AI-touched fields get an amber ring for review, not auto-accepted.
        </p>

        <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Fields to generate</p>
          <label className="flex items-center gap-1.5 text-sm text-neutral-700">
            <input type="checkbox" checked={descriptions} onChange={(e) => setDescriptions(e.target.checked)} />
            Descriptions
          </label>
          <label className="flex items-center gap-1.5 text-sm text-neutral-400">
            <input type="checkbox" checked={false} disabled />
            Dietary labels (coming soon)
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-700">Mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "empty" | "enhance")}
            className="rounded-md border border-neutral-200 px-2 py-1 text-sm focus:border-neutral-400 focus:outline-none"
          >
            <option value="empty">Only fill empty</option>
            <option value="enhance">Also enhance existing</option>
          </select>
        </div>

        <p className="text-xs text-neutral-400">
          Sends every item&apos;s name, section{mode === "enhance" ? ", and current description" : ""} to the AI in
          one or two batched requests (not one call per item).
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!canRun}
            onClick={runAi}
            className="flex items-center gap-1.5 rounded-md bg-[#0ea5e9] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0284c7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true">✦</span>
            {running ? "Running…" : "Run AI"}
          </button>
          {appliedCount != null && !error && (
            <span className="text-xs font-medium text-amber-700">
              Applied to {appliedCount} item{appliedCount === 1 ? "" : "s"} — check the amber-flagged fields below.
            </span>
          )}
          {error && <span className="text-xs font-medium text-red-600">{error}</span>}
        </div>
      </div>
    </Modal>
  );
}
