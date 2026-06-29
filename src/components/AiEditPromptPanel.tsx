"use client";

import { useState } from "react";

export function AiEditPromptPanel({
  prompts,
  onGenerate,
  isGenerating = false,
  error = null,
  warning = null,
}: {
  prompts: string[];
  onGenerate: (prompt: string) => void;
  isGenerating?: boolean;
  error?: string | null;
  warning?: string | null;
}) {
  const [draftPrompt, setDraftPrompt] = useState("");

  return (
    <div className="border-b border-sky-200 bg-sky-50 p-4">
      <p className="text-sm font-semibold text-sky-900">
        <span className="mr-1 rounded bg-sky-100 px-1 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-600">
          Experimental
        </span>
        Edit the entire doc using natural language
      </p>

      {prompts.length > 0 && (
        <ul className="mt-2 space-y-1">
          {prompts.map((p, i) => (
            <li key={i} className="text-xs text-sky-700">
              <span className="font-medium">#{i + 1}</span> {p}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex items-end gap-2">
        <textarea
          value={draftPrompt}
          onChange={(e) => setDraftPrompt(e.target.value)}
          rows={2}
          disabled={isGenerating}
          placeholder="e.g. Split the 15cm/30cm sub variants into their own sections…"
          className="flex-1 resize-none rounded-md border border-sky-200 bg-white px-3 py-2 text-sm focus:border-sky-400 focus:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          disabled={!draftPrompt.trim() || isGenerating}
          onClick={() => {
            onGenerate(draftPrompt.trim());
            setDraftPrompt("");
          }}
          className="shrink-0 rounded-md bg-[#0ea5e9] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0284c7] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? "Working…" : "Send"}
        </button>
      </div>

      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
      {!error && warning && <p className="mt-1.5 text-xs font-medium text-amber-700">{warning}</p>}

      <p className="mt-1.5 text-xs text-sky-600">
        This sends your whole current list (as JSON) plus this instruction to the AI and replaces this draft with
        its reply. Your original extraction stays untouched, and if something goes wrong this draft is left as-is.
      </p>
    </div>
  );
}
