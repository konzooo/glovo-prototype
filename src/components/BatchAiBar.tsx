"use client";

import { useState } from "react";
import { ComingSoonModal } from "./ComingSoonModal";

export function BatchAiBar() {
  const [descriptions, setDescriptions] = useState(true);
  const [dietary, setDietary] = useState(false);
  const [mode, setMode] = useState<"empty" | "enhance">("empty");
  const [open, setOpen] = useState(false);

  const canRun = descriptions || dietary;
  const summary = [descriptions ? "descriptions" : null, dietary ? "dietary labels" : null]
    .filter(Boolean)
    .join(" and ");

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-neutral-200 bg-white p-3">
      <span className="text-sm font-medium text-neutral-700">Batch AI</span>
      <label className="flex items-center gap-1.5 text-sm text-neutral-600">
        <input type="checkbox" checked={descriptions} onChange={(e) => setDescriptions(e.target.checked)} />
        Descriptions
      </label>
      <label className="flex items-center gap-1.5 text-sm text-neutral-600">
        <input type="checkbox" checked={dietary} onChange={(e) => setDietary(e.target.checked)} />
        Dietary labels
      </label>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as "empty" | "enhance")}
        className="rounded-md border border-neutral-200 px-2 py-1 text-sm focus:border-neutral-400 focus:outline-none"
      >
        <option value="empty">Only fill empty</option>
        <option value="enhance">Also enhance existing</option>
      </select>
      <button
        type="button"
        disabled={!canRun}
        onClick={() => setOpen(true)}
        className="ml-auto flex items-center gap-1.5 rounded-md bg-[#0ea5e9] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0284c7] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span aria-hidden="true">✦</span>
        Run AI
      </button>
      {open && (
        <ComingSoonModal
          open={open}
          onClose={() => setOpen(false)}
          title="Batch AI — coming soon"
          description={`This will eventually generate ${summary || "the selected fields"} for ${
            mode === "empty" ? "items that are currently empty" : "all matching items, enhancing existing ones too"
          }. Not implemented yet.`}
        />
      )}
    </div>
  );
}
