"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRestaurantStore, ListScope } from "@/lib/store";
import { getItemIssues, canApprove } from "@/lib/issues";
import { groupBySection, NO_SECTION_LABEL } from "@/lib/grouping";
import { exportCsv, exportJson, exportRestaurantState, downloadFile } from "@/lib/export";
import { FilterBar, DEFAULT_FILTERS, Filters } from "@/components/FilterBar";
import { ItemCard } from "@/components/ItemCard";
import { Modal } from "@/components/Modal";
import { BulkEditAiModal } from "@/components/BulkEditAiModal";
import { AiEditPromptPanel } from "@/components/AiEditPromptPanel";
import { Item, SourcePage } from "@/lib/types";

type PendingNavigation = { type: "href"; href: string } | { type: "browser-back" };
type SaveMessage = { text: string; tone: "success" | "error" };

function tabClass(active: boolean, variant: "neutral" | "blue" | "dashed" = "neutral") {
  return [
    "rounded-t-md border px-3 py-1.5 text-sm font-medium",
    active && variant === "blue"
      ? "border-sky-200 border-b-sky-50 bg-sky-50 text-sky-900"
      : active
        ? "border-neutral-200 border-b-white bg-white text-neutral-900"
        : "border-transparent text-neutral-500 hover:text-neutral-900",
    variant === "dashed" && !active ? "border-dashed border-neutral-300" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function FieldLegend() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="ml-auto w-fit rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between gap-3 text-sm text-neutral-700"
      >
        <span className="underline">Instructions</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${collapsed ? "" : "rotate-180"}`}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {!collapsed && (
        <div className="mt-2 flex flex-wrap items-start gap-6">
          <ol className="list-decimal space-y-0.5 pl-5 text-sm text-neutral-700">
            <li>Check all the menu items</li>
            <li>
              Fill manually or <span className="text-[#0ea5e9]">using AI</span>
            </li>
            <li>
              Check <span className="text-amber-500">AI generated fields</span>
            </li>
            <li>Approve all items and export</li>
          </ol>
          <div className="flex flex-col items-end gap-1 text-xs text-neutral-500">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-4 shrink-0 border-2 border-red-400 bg-white" aria-hidden="true" />
              missing
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-4 shrink-0 border-2 border-amber-400 bg-white" aria-hidden="true" />
              AI generated, needs approval
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewScreen() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const restaurantId = params.id;

  const restaurant = useRestaurantStore((s) => s.restaurants.find((r) => r.id === restaurantId));
  const addManualItem = useRestaurantStore((s) => s.addManualItem);
  const createAiDraft = useRestaurantStore((s) => s.createAiDraft);
  const applyAiPromptResult = useRestaurantStore((s) => s.applyAiPromptResult);
  const discardAiDraft = useRestaurantStore((s) => s.discardAiDraft);
  const selectedModel = useRestaurantStore((s) => s.selectedModel);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);
  const [requestedView, setActiveView] = useState<ListScope>("items");
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [deleteDraftOpen, setDeleteDraftOpen] = useState(false);
  const [aiEditLoading, setAiEditLoading] = useState(false);
  const [aiEditError, setAiEditError] = useState<string | null>(null);
  const [aiEditWarning, setAiEditWarning] = useState<string | null>(null);
  const allowBrowserBackRef = useRef(false);
  const reviewPathRef = useRef<string | null>(null);
  const pushedBackGuardRef = useRef(false);

  // Falls back to "items" if a draft was discarded/promoted while it was active.
  const activeView: ListScope = requestedView === "draft" && restaurant?.aiDraft ? "draft" : "items";
  // While a prompt-edit call is in flight it will replace this whole list on success, so
  // editing is locked here to avoid concurrent changes being silently overwritten.
  const listLocked = activeView === "draft" && aiEditLoading;

  const activeItems: Item[] = useMemo(() => {
    if (!restaurant) return [];
    return activeView === "draft" && restaurant.aiDraft ? restaurant.aiDraft.items : restaurant.items;
  }, [restaurant, activeView]);

  const pages = useMemo(() => {
    const set = new Set<string>();
    for (const item of activeItems) {
      if (item.sourcePageLabel) set.add(item.sourcePageLabel);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [activeItems]);

  const sections = useMemo(() => {
    const set = new Set<string>();
    for (const item of activeItems) {
      if (item.section) set.add(item.section);
    }
    return Array.from(set).sort();
  }, [activeItems]);

  const sourcePagesByLabel = useMemo(() => {
    const map = new Map<string, SourcePage>();
    for (const page of restaurant?.sourcePages ?? []) {
      map.set(page.label, page);
    }
    return map;
  }, [restaurant]);

  const filteredItems = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return activeItems.filter((item) => {
      if (filters.pageLabel !== "all" && item.sourcePageLabel !== filters.pageLabel) return false;
      if (filters.section !== "all" && item.section !== filters.section) return false;
      if (filters.approval === "approved" && !item.approved) return false;
      if (filters.approval === "unapproved" && item.approved) return false;
      if (filters.issue !== "all" && !getItemIssues(item).includes(filters.issue)) return false;
      if (search) {
        const haystack = `${item.name ?? ""} ${item.description ?? ""}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }, [activeItems, filters]);

  const sectionGroups = useMemo(() => groupBySection(filteredItems), [filteredItems]);

  const counts = useMemo(() => {
    const total = activeItems.length;
    const ready = activeItems.filter(canApprove).length;
    const approved = activeItems.filter((i) => i.approved).length;
    return { total, ready, approved };
  }, [activeItems]);

  useEffect(() => {
    if (!restaurant) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [restaurant]);

  useEffect(() => {
    if (!restaurant) return;
    reviewPathRef.current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (!pushedBackGuardRef.current) {
      window.history.pushState({ ...(window.history.state ?? {}), reviewGuard: restaurantId }, "", reviewPathRef.current);
      pushedBackGuardRef.current = true;
    }

    function onPopState() {
      if (allowBrowserBackRef.current) {
        allowBrowserBackRef.current = false;
        return;
      }
      const reviewPath = reviewPathRef.current;
      if (reviewPath) window.history.pushState(window.history.state, "", reviewPath);
      setPendingNavigation({ type: "browser-back" });
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [restaurant, restaurantId]);

  useEffect(() => {
    if (!restaurant) return;
    function onDocumentClick(e: globalThis.MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const next = `${url.pathname}${url.search}${url.hash}`;
      if (next === current) return;

      e.preventDefault();
      setPendingNavigation({ type: "href", href: next });
    }

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [restaurant]);

  if (!restaurant) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <p className="text-sm text-neutral-500">
          Restaurant not found.{" "}
          <Link href="/" className="underline">
            Back to restaurants
          </Link>
          .
        </p>
      </main>
    );
  }

  const restaurantValue = restaurant;

  function handleExportCsv() {
    const label = activeView === "draft" ? "ai_edit" : "catalog";
    downloadFile(
      `${restaurantValue.name.replace(/\s+/g, "_")}_${label}.csv`,
      exportCsv({ ...restaurantValue, items: activeItems }),
      "text/csv"
    );
    setExportMenuOpen(false);
  }
  function handleExportJson() {
    const label = activeView === "draft" ? "ai_edit" : "catalog";
    downloadFile(
      `${restaurantValue.name.replace(/\s+/g, "_")}_${label}.json`,
      exportJson({ ...restaurantValue, items: activeItems }),
      "application/json"
    );
    setExportMenuOpen(false);
  }

  function showSaveMessage(message: SaveMessage) {
    setSaveMessage(message);
    window.setTimeout(() => setSaveMessage(null), 2500);
  }

  function downloadProgressJson() {
    downloadFile(`${restaurantValue.name.replace(/\s+/g, "_")}_progress.json`, exportRestaurantState(restaurantValue), "application/json");
    setExportMenuOpen(false);
    showSaveMessage({ text: "Progress JSON downloaded", tone: "success" });
  }

  function leaveReview(navigation: PendingNavigation) {
    setPendingNavigation(null);
    if (navigation.type === "href") {
      router.push(navigation.href);
      return;
    }
    allowBrowserBackRef.current = true;
    const reviewPath = reviewPathRef.current;
    window.history.go(-2);
    window.setTimeout(() => {
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (reviewPath && currentPath === reviewPath) router.push("/");
    }, 250);
  }

  function handleAddItem(section: string | null) {
    const menuId = restaurantValue.menus[0]?.id;
    if (!menuId) return;
    addManualItem(restaurantValue.id, menuId, section, activeView);
  }

  async function handleAiEditGenerate(prompt: string) {
    if (!restaurantValue.aiDraft) return;
    // Drop focus from whatever's being edited so a still-focused field can't keep
    // accepting keystrokes once the list below it is locked for the duration of the call.
    (document.activeElement as HTMLElement | null)?.blur();
    setAiEditError(null);
    setAiEditWarning(null);
    setAiEditLoading(true);
    const sentCount = restaurantValue.aiDraft.items.length;
    try {
      const res = await fetch("/api/edit-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          items: restaurantValue.aiDraft.items.map((it) => ({
            id: it.id,
            name: it.name,
            section: it.section,
            description: it.description,
            price: it.price,
            variant_label: it.variant_label,
            variant_group: it.variant_group,
            dietary_tags: it.dietary_tags,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to edit the draft.");
      applyAiPromptResult(restaurantValue.id, prompt, data.items);
      const receivedCount = Array.isArray(data.items) ? data.items.length : 0;
      const delta = Math.abs(receivedCount - sentCount);
      if (sentCount > 0 && delta / sentCount > 0.15) {
        setAiEditWarning(
          `Heads up: item count went from ${sentCount} to ${receivedCount} — double-check nothing was dropped or duplicated before approving.`
        );
      }
    } catch (err) {
      setAiEditError(err instanceof Error ? err.message : "Failed to edit the draft.");
    } finally {
      setAiEditLoading(false);
    }
  }

  function handleAddSection() {
    const name = newSectionName.trim();
    if (!name) return;
    handleAddItem(name);
    setNewSectionName("");
    setAddSectionOpen(false);
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <Link href="/" className="text-xs text-neutral-400 hover:text-neutral-700">
        ← All restaurants
      </Link>
      <div className="mt-2 flex">
        <FieldLegend />
      </div>

      <div className="mt-2 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 p-4">
          <h1 className="text-xl font-semibold text-neutral-900">{restaurantValue.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {saveMessage && (
              <span className={`text-xs font-medium ${saveMessage.tone === "success" ? "text-green-700" : "text-red-600"}`}>
                {saveMessage.text}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-neutral-200 bg-neutral-50 px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveView("items")}
            className={tabClass(activeView === "items")}
          >
            Original extraction
          </button>
          {restaurantValue.aiDraft ? (
            <button
              type="button"
              onClick={() => setActiveView("draft")}
              className={tabClass(activeView === "draft", "blue") + " flex items-center gap-2"}
            >
              AI draft
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDraftOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    e.preventDefault();
                    setDeleteDraftOpen(true);
                  }
                }}
                className={`rounded-full px-1 ${
                  activeView === "draft" ? "text-sky-400 hover:bg-sky-100 hover:text-sky-700" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                }`}
                aria-label="Delete this draft"
              >
                ×
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                createAiDraft(restaurantValue.id);
                setActiveView("draft");
              }}
              className={tabClass(false, "dashed")}
            >
              + Create duplicate for free AI edit
            </button>
          )}
        </div>

        {activeView === "draft" && restaurantValue.aiDraft && (
          <AiEditPromptPanel
            prompts={restaurantValue.aiDraft.prompts}
            onGenerate={handleAiEditGenerate}
            isGenerating={aiEditLoading}
            error={aiEditError}
            warning={aiEditWarning}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-2">
          <p className="text-sm text-neutral-500">
            {counts.total} items · {counts.ready} ready · {counts.approved} approved
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBulkEditOpen(true)}
              disabled={listLocked}
              className="flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-[#0284c7] hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden="true">✦</span>
              Bulk edit with AI
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportMenuOpen((v) => !v)}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
              >
                Export ▾
              </button>
              {exportMenuOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 w-52 rounded-md border border-neutral-200 bg-white p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="block w-full rounded px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="block w-full rounded px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    Export JSON
                  </button>
                  <button
                    type="button"
                    onClick={downloadProgressJson}
                    className="block w-full rounded px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    Download progress JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-b border-neutral-200 p-3">
          <FilterBar pages={pages} sections={sections} filters={filters} onChange={setFilters} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2">
          <p className="text-sm text-neutral-500">
            Showing {filteredItems.length} of {counts.total} items
          </p>
        </div>

        <div className="space-y-6 p-4">
          {activeItems.length === 0 && (
            <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400">
              <p>No items yet.</p>
              <button
                type="button"
                onClick={() => handleAddItem(null)}
                disabled={listLocked}
                className="mt-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Add item
              </button>
            </div>
          )}
          {activeItems.length > 0 && sectionGroups.length === 0 && (
            <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400">
              No items match these filters.
            </p>
          )}
          {sectionGroups.map((group) => (
            <div key={group.section ?? "__none__"}>
              <h2 className="mb-2 border-b border-neutral-200 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {group.section ?? NO_SECTION_LABEL}
              </h2>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <ItemCard
                    key={item.id}
                    restaurantId={restaurantValue.id}
                    item={item}
                    sections={sections}
                    sourcePage={item.sourcePageLabel ? sourcePagesByLabel.get(item.sourcePageLabel) : null}
                    scope={activeView}
                    locked={listLocked}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleAddItem(group.section)}
                disabled={listLocked}
                className="mt-2 text-xs font-medium text-neutral-500 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Add item
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setAddSectionOpen(true)}
            disabled={listLocked}
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Add section
          </button>
        </div>
      </div>

      <Modal
        open={addSectionOpen}
        onClose={() => setAddSectionOpen(false)}
        title="Add section"
        footer={
          <>
            <button
              type="button"
              onClick={() => setAddSectionOpen(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddSection}
              disabled={!newSectionName.trim()}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add section
            </button>
          </>
        }
      >
        <input
          type="text"
          autoFocus
          value={newSectionName}
          onChange={(e) => setNewSectionName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddSection();
          }}
          placeholder="e.g. Drinks"
          className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </Modal>

      <Modal
        open={deleteDraftOpen}
        onClose={() => setDeleteDraftOpen(false)}
        title="Delete this draft?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteDraftOpen(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Stay
            </button>
            <button
              type="button"
              onClick={() => {
                discardAiDraft(restaurantValue.id);
                setDeleteDraftOpen(false);
              }}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Confirm
            </button>
          </>
        }
      >
        You can always create a new draft from your original extraction.
      </Modal>

      <BulkEditAiModal
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        restaurantId={restaurantValue.id}
        scope={activeView}
        items={activeItems}
      />

      <Modal
        open={pendingNavigation != null}
        onClose={() => setPendingNavigation(null)}
        title="Leave review?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPendingNavigation(null)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Stay
            </button>
            <button
              type="button"
              onClick={() => pendingNavigation && leaveReview(pendingNavigation)}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Leave
            </button>
          </>
        }
      >
        Your edits are saved automatically in this browser as you work.
      </Modal>
    </main>
  );
}
