"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRestaurantStore } from "@/lib/store";
import { getItemIssues, canApprove } from "@/lib/issues";
import { groupBySection, NO_SECTION_LABEL } from "@/lib/grouping";
import { exportCsv, exportJson, exportRestaurantState, downloadFile } from "@/lib/export";
import { FilterBar, DEFAULT_FILTERS, Filters } from "@/components/FilterBar";
import { BatchAiBar } from "@/components/BatchAiBar";
import { ItemCard } from "@/components/ItemCard";
import { Modal } from "@/components/Modal";
import { SourcePage } from "@/lib/types";

type PendingNavigation = { type: "href"; href: string } | { type: "browser-back" };
type SaveMessage = { text: string; tone: "success" | "error" };

const LOCAL_PROGRESS_BACKUP_KEY_PREFIX = "glovo-menu-progress-backup:";
const LOCAL_PROGRESS_BACKUP_META_KEY_PREFIX = "glovo-menu-progress-backup-meta:";

export default function ReviewScreen() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const restaurantId = params.id;

  const restaurant = useRestaurantStore((s) => s.restaurants.find((r) => r.id === restaurantId));
  const addManualItem = useRestaurantStore((s) => s.addManualItem);
  const setApproved = useRestaurantStore((s) => s.setApproved);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);
  const allowBrowserBackRef = useRef(false);
  const reviewPathRef = useRef<string | null>(null);
  const pushedBackGuardRef = useRef(false);

  const pages = useMemo(() => {
    if (!restaurant) return [];
    const set = new Set<string>();
    for (const item of restaurant.items) {
      if (item.sourcePageLabel) set.add(item.sourcePageLabel);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [restaurant]);

  const sections = useMemo(() => {
    if (!restaurant) return [];
    const set = new Set<string>();
    for (const item of restaurant.items) {
      if (item.section) set.add(item.section);
    }
    return Array.from(set).sort();
  }, [restaurant]);

  const sourcePagesByLabel = useMemo(() => {
    const map = new Map<string, SourcePage>();
    for (const page of restaurant?.sourcePages ?? []) {
      map.set(page.label, page);
    }
    return map;
  }, [restaurant]);

  const filteredItems = useMemo(() => {
    if (!restaurant) return [];
    const search = filters.search.trim().toLowerCase();
    return restaurant.items.filter((item) => {
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
  }, [restaurant, filters]);

  const sectionGroups = useMemo(() => groupBySection(filteredItems), [filteredItems]);

  const counts = useMemo(() => {
    if (!restaurant) return { total: 0, ready: 0, approved: 0 };
    const total = restaurant.items.length;
    const ready = restaurant.items.filter(canApprove).length;
    const approved = restaurant.items.filter((i) => i.approved).length;
    return { total, ready, approved };
  }, [restaurant]);

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

  function handleBulkApprove() {
    for (const item of filteredItems) {
      if (canApprove(item) && !item.approved) setApproved(restaurantValue.id, item.id, true);
    }
  }

  function handleExportCsv() {
    downloadFile(`${restaurantValue.name.replace(/\s+/g, "_")}_catalog.csv`, exportCsv(restaurantValue), "text/csv");
    setExportMenuOpen(false);
  }
  function handleExportJson() {
    downloadFile(`${restaurantValue.name.replace(/\s+/g, "_")}_catalog.json`, exportJson(restaurantValue), "application/json");
    setExportMenuOpen(false);
  }

  function showSaveMessage(message: SaveMessage) {
    setSaveMessage(message);
    window.setTimeout(() => setSaveMessage(null), 2500);
  }

  function saveProgressLocally(): boolean {
    try {
      const savedAt = new Date().toISOString();
      window.localStorage.setItem(
        `${LOCAL_PROGRESS_BACKUP_KEY_PREFIX}${restaurantValue.id}`,
        exportRestaurantState(restaurantValue)
      );
      window.localStorage.setItem(
        `${LOCAL_PROGRESS_BACKUP_META_KEY_PREFIX}${restaurantValue.id}`,
        JSON.stringify({ restaurantId: restaurantValue.id, restaurantName: restaurantValue.name, savedAt })
      );
      showSaveMessage({ text: "Progress saved locally", tone: "success" });
      return true;
    } catch {
      showSaveMessage({ text: "Could not save locally. Download a progress JSON instead.", tone: "error" });
      return false;
    }
  }

  function downloadProgressJson() {
    downloadFile(`${restaurantValue.name.replace(/\s+/g, "_")}_progress.json`, exportRestaurantState(restaurantValue), "application/json");
    setExportMenuOpen(false);
    showSaveMessage({ text: "Progress JSON downloaded", tone: "success" });
  }

  function handleSaveProgress() {
    saveProgressLocally();
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

  function saveProgressAndLeave() {
    if (!pendingNavigation) return;
    const navigation = pendingNavigation;
    if (!saveProgressLocally()) return;
    window.setTimeout(() => leaveReview(navigation), 0);
  }

  function handleAddItem(section: string | null) {
    const menuId = restaurantValue.menus[0]?.id;
    if (!menuId) return;
    addManualItem(restaurantValue.id, menuId, section);
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/" className="text-xs text-neutral-400 hover:text-neutral-700">
            ← All restaurants
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-neutral-900">{restaurantValue.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {counts.total} items · {counts.ready} ready · {counts.approved} approved
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSaveProgress}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Save progress
          </button>
          {saveMessage && (
            <span className={`text-xs font-medium ${saveMessage.tone === "success" ? "text-green-700" : "text-red-600"}`}>
              {saveMessage.text}
            </span>
          )}
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

      <div className="mt-4">
        <BatchAiBar />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <FilterBar pages={pages} sections={sections} filters={filters} onChange={setFilters} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          Showing {filteredItems.length} of {counts.total} items
        </p>
        <button type="button" onClick={handleBulkApprove} className="text-sm font-medium text-neutral-700 hover:text-neutral-900">
          Approve all ready
        </button>
      </div>

      <div className="mt-4 space-y-6">
        {restaurantValue.items.length === 0 && (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-400">
            <p>No items yet.</p>
            <button
              type="button"
              onClick={() => handleAddItem(null)}
              className="mt-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              + Add item
            </button>
          </div>
        )}
        {restaurantValue.items.length > 0 && sectionGroups.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-400">
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
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleAddItem(group.section)}
              className="mt-2 text-xs font-medium text-neutral-500 hover:text-neutral-900"
            >
              + Add item
            </button>
          </div>
        ))}
      </div>

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
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Leave
            </button>
            <button
              type="button"
              onClick={saveProgressAndLeave}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Save locally & leave
            </button>
          </>
        }
      >
        Your edits are stored locally in this browser as you work. Save now to create a local backup before leaving this review.
      </Modal>
    </main>
  );
}
