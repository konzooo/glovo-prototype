"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { Item, ISSUE_LABELS, SourcePage } from "@/lib/types";
import { useRestaurantStore, ListScope } from "@/lib/store";
import { getItemIssues, getBlockingIssues, canApprove } from "@/lib/issues";
import { Badge } from "./Badge";
import { MoveToSectionModal } from "./MoveToSectionModal";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { ComingSoonModal } from "./ComingSoonModal";
import { Modal } from "./Modal";

function AiTextButton({
  onClick,
  title,
  children,
  className = "",
  disabled = false,
}: {
  onClick: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold italic text-[#0ea5e9] hover:text-[#0284c7] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <span aria-hidden="true" className="text-[11px]">
        ✦
      </span>
      {children}
    </button>
  );
}

const fieldBorder = (missing: boolean, aiDraft = false) =>
  missing
    ? "border-red-300 ring-1 ring-red-200"
    : aiDraft
      ? "border-amber-300 ring-1 ring-amber-200"
      : "border-neutral-200 focus:border-neutral-400";

function AddImageIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      <rect x="6" y="7" width="15" height="12" rx="2" />
      <circle cx="16.5" cy="11" r="1.3" />
      <path d="m7.5 17 4.2-4.2a1.3 1.3 0 0 1 1.8 0L17.5 17" />
      <path d="M4 4v6" />
      <path d="M1 7h6" />
    </svg>
  );
}

function PhotoModal({
  open,
  onClose,
  onPhoto,
}: {
  open: boolean;
  onClose: () => void;
  onPhoto: (photoUrl: string) => void;
}) {
  const [tab, setTab] = useState<"upload" | "generate">("upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => dropRef.current?.focus(), 0);
  }, [open]);

  function closeModal() {
    setTab("upload");
    onClose();
  }

  function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onPhoto(reader.result);
        closeModal();
      }
    };
    reader.readAsDataURL(file);
  }

  function handleFiles(files: FileList | File[]) {
    handleFile(Array.from(files).find((file) => file.type.startsWith("image/")));
  }

  return (
    <Modal open={open} onClose={closeModal} title="Add item image">
      <div className="mb-3 grid grid-cols-2 rounded-md bg-neutral-100 p-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`rounded px-2 py-1.5 ${tab === "upload" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900"}`}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={() => setTab("generate")}
          className={`rounded px-2 py-1.5 ${
            tab === "generate" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          Generate with AI
        </button>
      </div>

      {tab === "upload" ? (
        <div
          ref={dropRef}
          tabIndex={0}
          onPaste={(e) => {
            handleFiles(e.clipboardData.files);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
        >
          <AddImageIcon className="mx-auto h-8 w-8 text-neutral-300" />
          <p className="mt-3 text-sm font-medium text-neutral-700">Drop or paste an image</p>
          <p className="mt-1 text-xs text-neutral-400">PNG, JPG, WebP or GIF</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Upload image
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-8 text-center">
          <span className="text-lg text-[#0ea5e9]">✦</span>
          <p className="mt-2 text-sm font-medium text-neutral-700">Generate with AI</p>
          <p className="mt-1 text-xs text-neutral-400">Coming soon.</p>
        </div>
      )}
    </Modal>
  );
}

function SourceMenuPreview({
  pageLabel,
  fileName,
  previewUrl,
}: {
  pageLabel: string | null | undefined;
  fileName: string | null | undefined;
  previewUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const label = [pageLabel, fileName].filter(Boolean).join(" · ");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-8 w-7 shrink-0 overflow-hidden rounded border border-neutral-200 bg-white shadow-sm hover:border-sky-300"
        title={label ? `View source menu: ${label}` : "View source menu"}
        aria-label={label ? `View source menu ${label}` : "View source menu"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Menu source"
        size="lg"
        footer={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Close
          </button>
        }
      >
        {label && <p className="mb-3 text-xs text-neutral-400">{label}</p>}
        <div className="max-h-[70vh] overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={label || "Source menu"} className="mx-auto max-h-[65vh] w-auto max-w-full rounded bg-white object-contain" />
        </div>
      </Modal>
    </>
  );
}

export function ItemCard({
  restaurantId,
  item,
  sections,
  sourcePage,
  scope,
  locked = false,
}: {
  restaurantId: string;
  item: Item;
  sections: string[];
  sourcePage?: SourcePage | null;
  scope: ListScope;
  // True while a whole-list AI operation (e.g. prompt edit) on this scope is in flight —
  // disables editing here so concurrent changes can't be silently lost when it replaces the list.
  locked?: boolean;
}) {
  const updateItem = useRestaurantStore((s) => s.updateItem);
  const removeItem = useRestaurantStore((s) => s.removeItem);
  const setApproved = useRestaurantStore((s) => s.setApproved);
  const moveItemToSection = useRestaurantStore((s) => s.moveItemToSection);
  const setItemPhoto = useRestaurantStore((s) => s.setItemPhoto);
  const addInferredDietaryTag = useRestaurantStore((s) => s.addInferredDietaryTag);
  const removeDietaryTag = useRestaurantStore((s) => s.removeDietaryTag);
  const applyAiDescription = useRestaurantStore((s) => s.applyAiDescription);
  const selectedModel = useRestaurantStore((s) => s.selectedModel);

  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [kebabOpen, setKebabOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dietAiOpen, setDietAiOpen] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [descAiLoading, setDescAiLoading] = useState(false);
  const [descAiError, setDescAiError] = useState<string | null>(null);

  const kebabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!kebabOpen) return;
    function onClick(e: MouseEvent) {
      if (kebabOpen && kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
        setKebabOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [kebabOpen]);

  const approvable = canApprove(item);
  const blockingIssues = getBlockingIssues(item);
  const blockingLabels = blockingIssues.map((i) => ISSUE_LABELS[i]);
  // Informational issues (e.g. missing description) still show as a note even once
  // the item is approvable — they just don't block the Approve button.
  const noteIssues = getItemIssues(item).filter((i) => i !== "dietary_inferred");
  const missingNote = noteIssues
    .map((issue) => {
      switch (issue) {
        case "missing_name":
          return "title missing";
        case "missing_price":
          return "price missing";
        case "missing_description":
          return "description missing";
        default:
          return null;
      }
    })
    .filter(Boolean)
    .join(" · ");

  function addManualTag() {
    if (!newTagLabel.trim()) return;
    addInferredDietaryTag(
      restaurantId,
      item.id,
      {
        label: newTagLabel.trim(),
        source: "stated",
        evidence: "Added by reviewer",
      },
      scope
    );
    setNewTagLabel("");
  }

  async function handleDescriptionAi() {
    const mode = item.description?.trim() ? "enhance" : "create";
    setDescAiError(null);
    setDescAiLoading(true);
    try {
      const res = await fetch("/api/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name ?? "",
          section: item.section,
          mode,
          existingDescription: item.description,
          model: selectedModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate description.");
      applyAiDescription(restaurantId, item.id, data.description, scope);
    } catch (err) {
      setDescAiError(err instanceof Error ? err.message : "Failed to generate description.");
    } finally {
      setDescAiLoading(false);
    }
  }

  return (
    <div
      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-stretch gap-3 rounded-md border border-neutral-200 bg-white px-3 py-3 ${
        locked ? "pointer-events-none opacity-60" : ""
      }`}
      aria-disabled={locked || undefined}
    >
      {/* Thumbnail */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setPhotoModalOpen(true)}
          className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 text-neutral-300 hover:border-sky-200 hover:bg-sky-50 hover:text-[#0ea5e9]"
          aria-label="Add item image"
        >
          {item.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <AddImageIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="grid w-full max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <div className="flex min-w-0 flex-wrap items-start gap-2">
            {/* Name + variant */}
            <div className="flex min-w-[220px] flex-1 items-center gap-1.5">
              <input
                type="text"
                value={item.name ?? ""}
                onChange={(e) => updateItem(restaurantId, item.id, { name: e.target.value }, scope)}
                placeholder="Item name"
                title={item.confidence != null ? `${Math.round(item.confidence * 100)}% extraction confidence` : undefined}
                className={`w-full min-w-0 rounded-md border px-2 py-1 text-sm font-semibold text-neutral-900 focus:outline-none ${fieldBorder(
                  !item.name?.trim()
                )}`}
              />
              {item.variant_group && (
                <input
                  type="text"
                  value={item.variant_label ?? ""}
                  onChange={(e) => updateItem(restaurantId, item.id, { variant_label: e.target.value || null }, scope)}
                  placeholder="Variant"
                  className="w-20 shrink-0 rounded-md border border-neutral-200 px-1.5 py-1 text-xs text-neutral-600 focus:border-neutral-400 focus:outline-none"
                />
              )}
            </div>

            {/* Price */}
            <div
              className={`flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-1 ${
                item.price?.amount == null ? "border-red-300 ring-1 ring-red-200" : "border-neutral-200"
              }`}
            >
              <input
                type="number"
                step="0.01"
                value={item.price?.amount ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  updateItem(
                    restaurantId,
                    item.id,
                    { price: raw === "" ? null : { amount: Number(raw), currency: item.price?.currency ?? "EUR" } },
                    scope
                  );
                }}
                placeholder="0.00"
                className="w-14 text-right text-sm focus:outline-none"
              />
              <input
                type="text"
                value={item.price?.currency ?? ""}
                onChange={(e) =>
                  updateItem(
                    restaurantId,
                    item.id,
                    { price: { amount: item.price?.amount ?? null, currency: e.target.value || null } },
                    scope
                  )
                }
                placeholder="EUR"
                className="w-10 text-xs text-neutral-500 focus:outline-none"
              />
            </div>

            {/* Dietary tags */}
            <div className="flex min-w-[176px] flex-1 flex-wrap items-center gap-1">
              <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                Dietary tags
              </span>
              {item.dietary_tags.map((tag, i) => (
                <span
                  key={`${tag.label}-${i}`}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    tag.source === "stated" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                  }`}
                  title={tag.evidence ?? undefined}
                >
                  {tag.label}
                  <button
                    type="button"
                    onClick={() => removeDietaryTag(restaurantId, item.id, i, scope)}
                    className="opacity-60 hover:opacity-100"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={newTagLabel}
                onChange={(e) => setNewTagLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addManualTag();
                  }
                }}
                placeholder="+ add tag"
                className="w-16 rounded-full border border-dashed border-neutral-300 px-2 py-0.5 text-[11px] focus:border-neutral-400 focus:outline-none"
              />
              {sourcePage?.previewUrl ? (
                <SourceMenuPreview
                  pageLabel={sourcePage.label}
                  fileName={sourcePage.fileName ?? item.sourceFileName}
                  previewUrl={sourcePage.previewUrl}
                />
              ) : item.sourcePageLabel ? (
                <span
                  className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500"
                  title={item.sourceFileName ?? undefined}
                >
                  {item.sourcePageLabel}
                </span>
              ) : null}
            </div>
          </div>
          <AiTextButton onClick={() => setDietAiOpen(true)} title="AI dietary suggestions" className="mr-2 justify-self-end pt-1.5">
            Infer tags with AI
          </AiTextButton>
        </div>

        {/* Description */}
        <div className="relative w-full max-w-5xl">
          <textarea
            value={item.description ?? ""}
            onChange={(e) =>
              updateItem(restaurantId, item.id, { description: e.target.value, description_is_ai_draft: false }, scope)
            }
            placeholder="Description"
            rows={2}
            disabled={descAiLoading}
            className={`min-h-14 w-full resize-none rounded-md border px-2 py-1.5 pr-32 text-xs leading-5 focus:outline-none ${fieldBorder(
              !item.description?.trim(),
              item.description_is_ai_draft
            )}`}
          />
          <AiTextButton
            onClick={handleDescriptionAi}
            disabled={descAiLoading}
            title={`Sends the item name${item.section ? " and section" : ""}${
              item.description?.trim() ? " plus the current description" : ""
            } to the AI to ${item.description?.trim() ? "enhance" : "write"} a description.`}
            className="absolute bottom-2 right-2"
          >
            {descAiLoading ? "Generating…" : item.description?.trim() ? "Enhance with AI" : "Create with AI"}
          </AiTextButton>
          {descAiError && <p className="mt-1 text-xs text-red-600">{descAiError}</p>}
        </div>
      </div>

      <div className="relative flex min-w-20 shrink-0 flex-col items-end justify-between gap-2" ref={kebabRef}>
        <button
          type="button"
          onClick={() => setKebabOpen((v) => !v)}
          className="rounded-md px-1.5 py-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          ⋯
        </button>
        {kebabOpen && (
          <div className="absolute right-0 top-7 z-10 mt-1 w-36 rounded-md border border-neutral-200 bg-white p-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setKebabOpen(false);
                setMoveOpen(true);
              }}
              className="block w-full rounded px-2 py-1.5 text-left text-xs text-neutral-700 hover:bg-neutral-50"
            >
              Move to section
            </button>
            <button
              type="button"
              onClick={() => {
                setKebabOpen(false);
                setDeleteOpen(true);
              }}
              className="block w-full rounded px-2 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}

        {item.approved ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge tone="green">Approved</Badge>
            <button
              type="button"
              onClick={() => setApproved(restaurantId, item.id, false, scope)}
              className="text-xs text-neutral-400 hover:underline"
            >
              Undo
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 flex-col items-end gap-1">
            {missingNote && (
              <span className="max-w-24 text-right text-[10px] font-medium leading-tight text-red-500">{missingNote}</span>
            )}
            <button
              type="button"
              onClick={() => setApproved(restaurantId, item.id, true, scope)}
              disabled={!approvable}
              title={!approvable ? `Missing: ${blockingLabels.join(", ")}` : undefined}
              className="rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              Approve
            </button>
          </div>
        )}
      </div>

      <MoveToSectionModal
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        sections={sections}
        currentSection={item.section}
        onConfirm={(section) => moveItemToSection(restaurantId, item.id, section, scope)}
      />
      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        itemName={item.name ?? ""}
        onConfirm={() => removeItem(restaurantId, item.id, scope)}
      />
      <ComingSoonModal
        open={dietAiOpen}
        onClose={() => setDietAiOpen(false)}
        title="AI dietary suggestions"
        description="Suggest dietary labels for this item with AI, for you to confirm or discard. Coming soon."
      />
      <PhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onPhoto={(photoUrl) => setItemPhoto(restaurantId, item.id, photoUrl, scope)}
      />
    </div>
  );
}
