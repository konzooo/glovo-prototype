"use client";

import { useRef, useState } from "react";

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_REFERENCE_IMAGES = 4;

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AiEditPromptPanel({
  prompts,
  onGenerate,
  isGenerating = false,
  error = null,
  warning = null,
}: {
  prompts: string[];
  onGenerate: (prompt: string, referenceImages: File[]) => void;
  isGenerating?: boolean;
  error?: string | null;
  warning?: string | null;
}) {
  const [draftPrompt, setDraftPrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  function addReferenceImages(fileList: FileList | null) {
    if (!fileList) return;
    const selectedFiles = Array.from(fileList);
    const supportedFiles = selectedFiles.filter((file) => ALLOWED_IMAGE_TYPES.has(file.type));
    const availableSlots = Math.max(0, MAX_REFERENCE_IMAGES - referenceImages.length);
    const nextFiles = supportedFiles.slice(0, availableSlots);

    setReferenceImages((current) => [...current, ...nextFiles]);
    if (supportedFiles.length < selectedFiles.length) {
      setAttachmentError("Some files were skipped. Use PNG, JPEG, WEBP, or GIF.");
    } else if (supportedFiles.length > availableSlots) {
      setAttachmentError(`Attach at most ${MAX_REFERENCE_IMAGES} reference images.`);
    } else {
      setAttachmentError(null);
    }
  }

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
        <div className="min-w-0 flex-1">
          <textarea
            value={draftPrompt}
            onChange={(e) => setDraftPrompt(e.target.value)}
            rows={2}
            disabled={isGenerating}
            placeholder="e.g. Split the 15cm/30cm sub variants into their own sections…"
            className="w-full resize-none rounded-md border border-sky-200 bg-white px-3 py-2 text-sm focus:border-sky-400 focus:outline-none disabled:opacity-60"
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isGenerating || referenceImages.length >= MAX_REFERENCE_IMAGES}
              className="rounded-md border border-sky-200 bg-white px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Attach image
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                addReferenceImages(e.target.files);
                e.target.value = "";
              }}
            />
            {referenceImages.map((file, index) => (
              <span
                key={`${file.name}-${file.lastModified}-${index}`}
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-sky-700"
              >
                <span className="max-w-40 truncate">
                  {file.name} · {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setReferenceImages((current) => current.filter((_, i) => i !== index))}
                  className="font-semibold text-sky-400 hover:text-red-500 disabled:opacity-50"
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          disabled={!draftPrompt.trim() || isGenerating}
          onClick={() => {
            onGenerate(draftPrompt.trim(), referenceImages);
            setDraftPrompt("");
            setReferenceImages([]);
            setAttachmentError(null);
          }}
          className="shrink-0 rounded-md bg-[#0ea5e9] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0284c7] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? "Working…" : "Send"}
        </button>
      </div>

      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
      {!error && attachmentError && <p className="mt-1.5 text-xs font-medium text-red-600">{attachmentError}</p>}
      {!error && warning && <p className="mt-1.5 text-xs font-medium text-amber-700">{warning}</p>}

      <p className="mt-1.5 text-xs text-sky-600">
        This sends your whole current list (as JSON), this instruction, and any attached reference images to the AI
        and replaces this draft with its reply. Your original extraction stays untouched, and if something goes wrong
        this draft is left as-is.
      </p>
    </div>
  );
}
