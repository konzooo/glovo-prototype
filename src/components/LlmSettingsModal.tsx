"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { MODEL_OPTIONS } from "@/lib/ai/models";
import { getPromptDefinition, PROMPT_DEFINITIONS, PromptId } from "@/lib/ai/prompts";
import { useRestaurantStore } from "@/lib/store";

export function LlmSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const selectedModel = useRestaurantStore((s) => s.selectedModel);
  const setSelectedModel = useRestaurantStore((s) => s.setSelectedModel);
  const promptOverrides = useRestaurantStore((s) => s.promptOverrides);
  const setPromptOverride = useRestaurantStore((s) => s.setPromptOverride);
  const resetPromptOverride = useRestaurantStore((s) => s.resetPromptOverride);
  const [selectedPromptId, setSelectedPromptId] = useState<PromptId>("extract_menu");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [editingPrompt, setEditingPrompt] = useState(false);

  const definition = getPromptDefinition(selectedPromptId);
  const override = promptOverrides[selectedPromptId];
  const customEnabled = definition.supportsCustomOverride && !!override?.enabled;
  const savedCustomPrompt = override?.text ?? "";
  const lockedCustomPrompt = savedCustomPrompt.trim() ? savedCustomPrompt : definition.defaultPrompt;

  function selectPrompt(id: PromptId) {
    const nextDefinition = getPromptDefinition(id);
    const nextSavedPrompt = promptOverrides[id]?.text ?? "";
    setSelectedPromptId(id);
    setDraftPrompt(nextSavedPrompt.trim() ? nextSavedPrompt : nextDefinition.defaultPrompt);
    setEditingPrompt(false);
  }

  function setCustomEnabled(enabled: boolean) {
    setPromptOverride(selectedPromptId, {
      enabled,
      text: savedCustomPrompt || definition.defaultPrompt,
    });
    if (enabled && !savedCustomPrompt.trim()) {
      setDraftPrompt(definition.defaultPrompt);
      setEditingPrompt(true);
    } else {
      setEditingPrompt(false);
    }
  }

  function saveCustomPrompt() {
    if (!draftPrompt.trim()) return;
    setPromptOverride(selectedPromptId, { enabled: true, text: draftPrompt });
    setEditingPrompt(false);
  }

  function resetCustomPrompt() {
    resetPromptOverride(selectedPromptId);
    setDraftPrompt(definition.defaultPrompt);
    setEditingPrompt(false);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="LLM settings"
      size="lg"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Close
        </button>
      }
    >
      <div className="max-h-[76vh] overflow-y-auto pr-1">
        <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500" htmlFor="llm-model">
            Active Model
          </label>
          <select
            id="llm-model"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
            className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-2.5 py-2 text-sm text-neutral-800 focus:border-neutral-500 focus:outline-none"
          >
            {MODEL_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-[210px_minmax(0,1fr)]">
          <div className="rounded-lg border border-neutral-200 bg-white p-2">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Prompts</p>
            <div className="mt-1 space-y-1">
              {PROMPT_DEFINITIONS.map((prompt) => {
                const selected = prompt.id === selectedPromptId;
                const custom = promptOverrides[prompt.id]?.enabled;
                return (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => selectPrompt(prompt.id)}
                    className={`w-full rounded-md px-2 py-2 text-left text-sm ${
                      selected ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    <span className="block font-medium">{prompt.title}</span>
                    {custom && <span className={selected ? "text-xs text-neutral-300" : "text-xs text-neutral-400"}>Custom active</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 rounded-lg border border-neutral-200 bg-white p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">{definition.title}</h3>
                <p className="mt-0.5 text-xs text-neutral-500">{definition.description}</p>
              </div>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                {customEnabled ? "Custom active" : "Default active"}
              </span>
            </div>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-neutral-500" htmlFor="default-prompt">
              Default system prompt
            </label>
            <textarea
              id="default-prompt"
              readOnly
              value={definition.defaultPrompt}
              className="mt-1.5 h-52 w-full resize-y rounded-md border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs leading-5 text-neutral-700 focus:outline-none"
            />

            {definition.supportsCustomOverride ? (
              <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-800">
                  <input
                    type="checkbox"
                    checked={customEnabled}
                    onChange={(e) => setCustomEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300"
                  />
                  Use custom prompt for future extractions
                </label>

                {customEnabled && editingPrompt ? (
                  <>
                    <textarea
                      value={draftPrompt}
                      onChange={(e) => setDraftPrompt(e.target.value)}
                      className="mt-3 h-52 w-full resize-y rounded-md border border-neutral-300 bg-white p-3 font-mono text-xs leading-5 text-neutral-800 focus:border-neutral-500 focus:outline-none"
                    />

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={saveCustomPrompt}
                        disabled={!draftPrompt.trim()}
                        className="rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:bg-neutral-300"
                      >
                        Save prompt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDraftPrompt(lockedCustomPrompt);
                          setEditingPrompt(false);
                        }}
                        className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraftPrompt(definition.defaultPrompt)}
                        className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Copy default
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <textarea
                      readOnly
                      value={customEnabled ? lockedCustomPrompt : ""}
                      placeholder="Enable custom prompt to create an editable copy of the default."
                      className="mt-3 h-52 w-full resize-y rounded-md border border-neutral-300 bg-white p-3 font-mono text-xs leading-5 text-neutral-700 focus:outline-none"
                    />

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDraftPrompt(lockedCustomPrompt);
                          setEditingPrompt(true);
                        }}
                        disabled={!customEnabled}
                        className="rounded-md bg-neutral-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-300"
                      >
                        Edit prompt
                      </button>
                      <button
                        type="button"
                        onClick={resetCustomPrompt}
                        disabled={!customEnabled && !savedCustomPrompt}
                        className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                      >
                        Reset
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="mt-3 rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                Custom overrides are not wired for this prompt yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}
