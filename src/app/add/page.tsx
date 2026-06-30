"use client";

import { useRouter } from "next/navigation";
import { type ClipboardEvent, type DragEvent, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/Modal";
import { useRestaurantStore } from "@/lib/store";
import { parseRestaurantState } from "@/lib/export";
import { makeId } from "@/lib/id";
import { ExtractionResponse } from "@/lib/ai/schema";
import { SAMPLE_EXTRACTION } from "@/lib/sample-extraction";
import { getModelOption } from "@/lib/ai/models";
import { estimateExtractionMs, hasTimingHistory, recordExtractionDuration } from "@/lib/extraction-timing";

type PendingFile = {
  id: string;
  file: File;
  objectUrl: string;
  status: "idle" | "uploading" | "done" | "error";
  error?: string;
};

const ALLOWED_FILE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"]);

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AddRestaurantScreen() {
  const router = useRouter();
  const createRestaurant = useRestaurantStore((s) => s.createRestaurant);
  const importRestaurant = useRestaurantStore((s) => s.importRestaurant);
  const addMenu = useRestaurantStore((s) => s.addMenu);
  const addExtractedItems = useRestaurantStore((s) => s.addExtractedItems);
  const selectedModel = useRestaurantStore((s) => s.selectedModel);
  const extractionPromptOverride = useRestaurantStore((s) => s.promptOverrides.extract_menu);

  const [restaurantName, setRestaurantName] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [estimatedExtractMs, setEstimatedExtractMs] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [dragOverFileId, setDragOverFileId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<"before" | "after" | null>(null);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;
    return () => {
      for (const url of objectUrls) {
        URL.revokeObjectURL(url);
      }
      objectUrls.clear();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Climbs toward a near-complete state over a deliberately padded estimate —
  // there's no real progress signal from the (non-streaming) extract API, so this is an
  // honest-feeling approximation rather than a measurement. The caller snaps it to 100 on
  // actual completion.
  function progressForElapsed(elapsedMs: number, estimatedMs: number): number {
    const paddedEstimate = Math.max(estimatedMs * 1.25, 1);
    const ratio = Math.min(1, elapsedMs / paddedEstimate);
    return Math.min(88, 88 * ratio);
  }

  function addFiles(selected: FileList | File[]) {
    const selectedFiles = Array.from(selected);
    const supportedFiles = selectedFiles.filter((file) => ALLOWED_FILE_TYPES.has(file.type));
    if (supportedFiles.length < selectedFiles.length) {
      setGlobalError("Some files were skipped. Use PNG, JPEG, WEBP, GIF, or PDF.");
    } else {
      setGlobalError(null);
    }
    if (supportedFiles.length === 0) return;
    const next: PendingFile[] = supportedFiles.map((file) => {
      const objectUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(objectUrl);
      return {
        id: makeId("file"),
        file,
        objectUrl,
        status: "idle",
      };
    });
    setFiles((prev) => [...prev, ...next]);
  }

  function handleFilesSelected(selected: FileList | null) {
    if (!selected) return;
    addFiles(selected);
  }

  function removeFile(id: string) {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.objectUrl);
        objectUrlsRef.current.delete(file.objectUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
    setPreviewFileId((current) => (current === id ? null : current));
  }

  function moveFileToPosition(draggedId: string, targetId: string, position: "before" | "after") {
    if (draggedId === targetId) return;
    setFiles((prev) => {
      const dragged = prev.find((f) => f.id === draggedId);
      if (!dragged) return prev;
      const withoutDragged = prev.filter((f) => f.id !== draggedId);
      const targetIndex = withoutDragged.findIndex((f) => f.id === targetId);
      if (targetIndex < 0) return prev;
      const insertIndex = position === "after" ? targetIndex + 1 : targetIndex;
      const next = [...withoutDragged.slice(0, insertIndex), dragged, ...withoutDragged.slice(insertIndex)];
      if (next.every((file, index) => file.id === prev[index]?.id)) return prev;
      return next;
    });
  }

  function handleUploadDrop(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    if (isExtracting || e.dataTransfer.files.length === 0) return;
    addFiles(e.dataTransfer.files);
  }

  function handlePaste(e: ClipboardEvent<HTMLElement>) {
    if (isExtracting || e.clipboardData.files.length === 0) return;
    e.preventDefault();
    addFiles(e.clipboardData.files);
  }

  function handleReorderDrop(e: DragEvent<HTMLElement>, targetId: string) {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain") || draggedFileId;
    if (!draggedId || isExtracting) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const position = e.clientY > rect.top + rect.height / 2 ? "after" : "before";
    moveFileToPosition(draggedId, targetId, position);
    setDraggedFileId(null);
    setDragOverFileId(null);
    setDragOverPosition(null);
  }

  function handleReorderPreview(e: DragEvent<HTMLElement>, targetId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const draggedId = draggedFileId || e.dataTransfer.getData("text/plain");
    if (!draggedId || draggedId === targetId || isExtracting) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const position = e.clientY > rect.top + rect.height / 2 ? "after" : "before";
    setDragOverFileId(targetId);
    setDragOverPosition(position);
    moveFileToPosition(draggedId, targetId, position);
  }

  // This is stored locally as a review-screen thumbnail only — the original `file` (full
  // resolution) is what gets sent to /api/extract, so downscaling here doesn't affect
  // extraction quality, just how much space the saved preview takes up.
  const PREVIEW_MAX_DIMENSION = 700;
  const PREVIEW_JPEG_QUALITY = 0.6;

  function readSourcePreview(file: File): Promise<string | null> {
    if (!file.type.startsWith("image/")) return Promise.resolve(null);
    return new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, PREVIEW_MAX_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        URL.revokeObjectURL(objectUrl);
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", PREVIEW_JPEG_QUALITY));
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });
  }

  const canExtract = restaurantName.trim().length > 0 && files.length > 0;
  const previewFile = files.find((f) => f.id === previewFileId) ?? null;

  async function handleExtract() {
    if (!canExtract) return;
    setGlobalError(null);
    setIsExtracting(true);
    const restaurantId = createRestaurant(restaurantName.trim());
    const menu = addMenu(restaurantId, "Main menu", files.map((f) => f.file.name).join(", "));
    const customExtractionPrompt =
      extractionPromptOverride?.enabled && extractionPromptOverride.text.trim()
        ? extractionPromptOverride.text.trim()
        : null;

    setFiles((prev) => prev.map((f) => ({ ...f, status: "uploading" })));

    const pageCount = files.length;
    const estimatedMs = estimateExtractionMs(selectedModel, pageCount);
    setEstimatedExtractMs(estimatedMs);
    setExtractProgress(0);
    const startedAt = Date.now();
    progressIntervalRef.current = setInterval(() => {
      setExtractProgress(progressForElapsed(Date.now() - startedAt, estimatedMs));
    }, 100);

    let anySucceeded = false;
    try {
      const pageMeta = await Promise.all(
        files.map(async (pending) => ({
          pending,
          previewUrl: await readSourcePreview(pending.file),
        }))
      );

      const formData = new FormData();
      for (const { pending } of pageMeta) formData.append("file", pending.file);
      formData.append("model", selectedModel);
      if (customExtractionPrompt) formData.append("systemPrompt", customExtractionPrompt);

      const res = await fetch("/api/extract", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || `Extraction failed (${res.status})`);
      }
      const result = json as ExtractionResponse;

      // Items come back tagged with source_page_index (1-based, matching upload order),
      // so we can still attribute each item to its source page/photo for the review UI
      // even though all pages were extracted in one model call.
      for (const [index, { pending, previewUrl }] of pageMeta.entries()) {
        const pageNumber = index + 1;
        const itemsForPage = result.items.filter((item) =>
          pageMeta.length === 1 ? true : (item.source_page_index ?? 1) === pageNumber
        );
        if (itemsForPage.length === 0) continue;
        addExtractedItems(restaurantId, menu.id, itemsForPage, {
          pageLabel: `Page ${pageNumber}`,
          fileName: pending.file.name,
          previewUrl,
          mimeType: pending.file.type || null,
        });
      }
      anySucceeded = result.items.length > 0;
      setFiles((prev) => prev.map((f) => ({ ...f, status: "done" })));
      if (anySucceeded) recordExtractionDuration(selectedModel, pageCount, Date.now() - startedAt);
      setExtractProgress(100);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error.";
      setFiles((prev) => prev.map((f) => ({ ...f, status: "error", error: message })));
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsExtracting(false);
    if (anySucceeded) {
      router.push(`/review/${restaurantId}`);
    } else {
      setGlobalError(
        "Extraction failed. The restaurant was still saved (with no items yet) — check the error below, or find it in the restaurant list to try again."
      );
    }
  }

  function handleImportClick() {
    importInputRef.current?.click();
  }

  async function handleImportFile(file: File | undefined) {
    if (!file) return;
    try {
      const text = await file.text();
      const restaurant = parseRestaurantState(text);
      const id = importRestaurant(restaurant);
      router.push(`/review/${id}`);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Could not read that JSON file.");
    }
  }

  function handleUseSampleMenu() {
    const id = createRestaurant(restaurantName.trim() || "Sample Pizzeria (test)");
    const menu = addMenu(id, "Main menu", "sample-pizzeria-menu.json");
    addExtractedItems(id, menu.id, SAMPLE_EXTRACTION.items, {
      pageLabel: "Page 1",
      fileName: "sample-pizzeria-menu.json",
    });
    router.push(`/review/${id}`);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900">Onboard a new restaurant</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Upload the menu pages as images or PDFs. We&apos;ll extract dishes, prices, sections and dietary
        info, then hand you a review list to fix anything that&apos;s wrong before exporting the catalog.
      </p>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6">
        <label className="block text-sm font-medium text-neutral-700">Restaurant name</label>
        <input
          type="text"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          placeholder="e.g. Tapas & Co."
          className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />

        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-neutral-700">Menu pages</label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExtracting}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              + Add files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          <div
            tabIndex={0}
            onPaste={handlePaste}
            onDrop={handleUploadDrop}
            onDragOver={(e) => e.preventDefault()}
            className="mt-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center focus:border-neutral-500 focus:bg-white focus:outline-none"
          >
            <p className="text-sm font-medium text-neutral-700">Drop menu images or PDFs here</p>
            <p className="mt-1 text-xs text-neutral-500">You can also paste copied images or use the Add files button.</p>
            <p className="mt-3 text-xs text-neutral-400">PNG, JPEG, WEBP, GIF, or PDF.</p>
          </div>

          {files.length === 0 && <p className="mt-3 text-sm text-neutral-400">No pages added yet.</p>}

          {files.length > 0 && (
            <p className="mt-3 text-xs text-neutral-500">
              Arrange pages in reading order for best section detection, especially when a section continues across pages.
            </p>
          )}

          <ul className="mt-3 space-y-2">
            {files.map((f, index) => (
              <li
                key={f.id}
                draggable={!isExtracting && f.status === "idle"}
                onDragStart={(e) => {
                  setDraggedFileId(f.id);
                  e.dataTransfer.setData("text/plain", f.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnter={() => {
                  if (draggedFileId && draggedFileId !== f.id) setDragOverFileId(f.id);
                }}
                onDragOver={(e) => handleReorderPreview(e, f.id)}
                onDrop={(e) => handleReorderDrop(e, f.id)}
                onDragEnd={() => {
                  setDraggedFileId(null);
                  setDragOverFileId(null);
                  setDragOverPosition(null);
                }}
                className={`rounded-md border bg-white p-3 shadow-sm transition-[border-color,box-shadow,background-color,opacity] duration-150 ${
                  draggedFileId === f.id
                    ? "border-neutral-800 bg-neutral-50 opacity-75 shadow-md"
                    : dragOverFileId === f.id
                      ? `border-neutral-700 shadow-sm ${
                          dragOverPosition === "after"
                            ? "shadow-[inset_0_-2px_0_#404040]"
                            : "shadow-[inset_0_2px_0_#404040]"
                        }`
                      : "border-neutral-300 hover:border-neutral-500"
                } ${!isExtracting && f.status === "idle" ? "cursor-grab active:cursor-grabbing" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {f.status === "idle" && (
                      <span
                        className="grid h-9 w-6 shrink-0 place-items-center rounded hover:bg-neutral-100"
                        title="Drag to reorder"
                        aria-hidden="true"
                      >
                        <span className="grid grid-cols-2 gap-[3px]">
                          {[0, 1, 2, 3, 4, 5].map((dot) => (
                            <span key={dot} className="h-1 w-1 rounded-full bg-neutral-500" />
                          ))}
                        </span>
                      </span>
                    )}
                    <span className="flex h-9 w-16 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-neutral-100 text-xs font-semibold text-neutral-700">
                      Page {index + 1}
                    </span>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setPreviewFileId(f.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setPreviewFileId(f.id);
                        }
                      }}
                      className="group flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-300 bg-neutral-100 shadow-sm focus:border-neutral-700 focus:outline-none"
                      aria-label={`Preview ${f.file.name}`}
                      title="Click to preview"
                    >
                      {f.file.type.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.objectUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-105" draggable={false} />
                      ) : (
                        <iframe
                          src={`${f.objectUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                          title={`${f.file.name} thumbnail`}
                          className="pointer-events-none h-full w-full bg-white"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-800">{f.file.name}</p>
                      <p className="text-xs text-neutral-400">
                        {f.file.type || "Unknown type"} · {formatFileSize(f.file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {f.status === "uploading" && <span className="text-xs text-neutral-400">Extracting…</span>}
                    {f.status === "done" && <span className="text-xs text-green-600">Done</span>}
                    {f.status === "error" && <span className="text-xs text-red-600">Failed</span>}
                    {f.status === "idle" && (
                      <>
                        <span className="hidden text-xs italic text-neutral-600 sm:inline">Drag to reorder</span>
                        <button type="button" onClick={() => removeFile(f.id)} className="text-xs font-medium text-red-600 hover:text-red-700">
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {f.status === "error" && f.error && <p className="mt-1.5 text-xs text-red-600">{f.error}</p>}
              </li>
            ))}
          </ul>
        </div>

        {globalError && <p className="mt-4 text-sm text-red-600">{globalError}</p>}

        <button
          type="button"
          disabled={!canExtract || isExtracting}
          onClick={handleExtract}
          className="mt-6 w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {isExtracting ? "Extracting menu…" : "Extract menu"}
        </button>

        {isExtracting ? (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-neutral-900 transition-[width] duration-150 ease-out"
                style={{ width: `${extractProgress}%` }}
              />
            </div>
            <p className="mt-1.5 text-center text-xs text-neutral-400">
              {hasTimingHistory(selectedModel)
                ? `Usually takes about ${Math.round(estimatedExtractMs / 1000)}s for ${files.length} page${files.length === 1 ? "" : "s"} with ${getModelOption(selectedModel).label}.`
                : `First run with ${getModelOption(selectedModel).label} — estimating ~${Math.round(estimatedExtractMs / 1000)}s.`}
              {extractProgress >= 88 ? " Still extracting; final response can take a little longer." : ""}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-center text-xs text-neutral-400">
            Using {getModelOption(selectedModel).label} — change it from the ☰ menu, top right.
          </p>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6">
        <h2 className="text-sm font-semibold text-neutral-700">Testing without API key?</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Use a sample menu to test the upload → extract → review flow without calling the LLM — it&apos;s a
          previously-extracted menu, kept as a fixed JSON. Or import a previously exported restaurant JSON file to
          pick up where you left off.
        </p>
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={handleUseSampleMenu}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Use sample menu
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Import JSON
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              handleImportFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </section>

      <Modal
        open={previewFile != null}
        onClose={() => setPreviewFileId(null)}
        title={previewFile ? previewFile.file.name : "Preview"}
        size="lg"
        footer={
          <button
            type="button"
            onClick={() => setPreviewFileId(null)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Close
          </button>
        }
      >
        {previewFile && (
          <div className="overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
            {previewFile.file.type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewFile.objectUrl} alt={previewFile.file.name} className="mx-auto max-h-[70vh] w-auto max-w-full object-contain" />
            ) : (
              <iframe
                src={previewFile.objectUrl}
                title={previewFile.file.name}
                className="h-[70vh] w-full bg-white"
              />
            )}
          </div>
        )}
      </Modal>
    </main>
  );
}
