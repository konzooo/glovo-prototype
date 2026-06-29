import { Item } from "./types";

// Sorts so variants of the same dish (shared variant_group) sit next to each other.
export function sortItemsForDisplay(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    const ak = (a.variant_group ?? a.name ?? "").trim();
    const bk = (b.variant_group ?? b.name ?? "").trim();
    const aIsUnnamed = ak.length === 0;
    const bIsUnnamed = bk.length === 0;
    if (aIsUnnamed !== bIsUnnamed) return aIsUnnamed ? 1 : -1;
    if (aIsUnnamed && bIsUnnamed) return 0;
    if (ak !== bk) return ak.localeCompare(bk);
    return (a.variant_label ?? "").localeCompare(b.variant_label ?? "");
  });
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
