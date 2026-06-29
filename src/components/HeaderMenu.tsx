"use client";

import { useEffect, useRef, useState } from "react";
import { useRestaurantStore } from "@/lib/store";
import { MODEL_OPTIONS } from "@/lib/ai/models";
import { LlmSettingsModal } from "@/components/LlmSettingsModal";

export function HeaderMenu() {
  const selectedModel = useRestaurantStore((s) => s.selectedModel);
  const setSelectedModel = useRestaurantStore((s) => s.setSelectedModel);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          className="rounded-md px-2 py-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          ☰
        </button>
        {open && (
          <div className="absolute right-0 top-full z-20 mt-1 w-60 rounded-md border border-neutral-200 bg-white p-2 shadow-lg">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Active Model</p>
            {MODEL_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setSelectedModel(option.id);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
              >
                {option.label}
                {selectedModel === option.id && <span className="text-neutral-900">✓</span>}
              </button>
            ))}
            <div className="my-1 border-t border-neutral-100" />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSettingsOpen(true);
              }}
              className="w-full rounded px-2 py-1.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              LLM settings
            </button>
          </div>
        )}
      </div>
      <LlmSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
