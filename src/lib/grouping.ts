import { Item } from "./types";

// Orders items in menu (reading) order so the on-screen list scans against the menu image,
// while still keeping variants of the same dish (shared variant_group) next to each other.
// Items arrive in extraction order (top-to-bottom, left-to-right — see EXTRACTION_SYSTEM_PROMPT),
// and we preserve that order: each variant group is anchored at the position of its first
// variant (so siblings printed apart still cluster there), and standalone items keep their place.
export function sortItemsForDisplay(items: Item[]): Item[] {
  const order: string[] = [];
  const buckets = new Map<string, Item[]>();
  for (const item of items) {
    const group = (item.variant_group ?? "").trim();
    // Standalone items (no variant_group) bucket by their unique id so they never merge.
    const key = group ? `g:${group}` : `i:${item.id}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item);
    else {
      buckets.set(key, [item]);
      order.push(key);
    }
  }
  return order.flatMap((key) => buckets.get(key)!);
}

export const NO_SECTION_LABEL = "No section detected";

export type SectionGroup = {
  section: string | null;
  items: Item[];
};

// Buckets items by section, in the order each section first appears (so the original
// menu order is preserved, and a section added later — e.g. via "+ Add section" — lands
// at the end), with a trailing bucket (section: null) for items that have no detected section.
export function groupBySection(items: Item[]): SectionGroup[] {
  const bySection = new Map<string, Item[]>();
  const noSection: Item[] = [];

  for (const item of items) {
    if (!item.section) {
      noSection.push(item);
      continue;
    }
    const existing = bySection.get(item.section);
    if (existing) existing.push(item);
    else bySection.set(item.section, [item]);
  }

  const groups: SectionGroup[] = Array.from(bySection.keys()).map((section) => ({
    section,
    items: sortItemsForDisplay(bySection.get(section)!),
  }));

  if (noSection.length > 0) {
    groups.push({ section: null, items: sortItemsForDisplay(noSection) });
  }

  return groups;
}
