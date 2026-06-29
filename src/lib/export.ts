import { Item, Restaurant } from "./types";

// Export shape: flat catalog of approved items. menu name is excluded — it's UI/filter
// metadata only, not part of the final catalog. section IS included.
export type ExportRow = {
  name: string | null;
  section: string | null;
  description: string | null;
  price_amount: number | null;
  price_currency: string | null;
  variant_label: string | null;
  variant_group: string | null;
  dietary_tags: string; // "Vegetarian (stated); Gluten-free (inferred)"
  has_photo: boolean | null;
};

export function toExportRows(items: Item[]): ExportRow[] {
  return items
    .filter((it) => it.approved)
    .map((it) => ({
      name: it.name,
      section: it.section,
      description: it.description,
      price_amount: it.price?.amount ?? null,
      price_currency: it.price?.currency ?? null,
      variant_label: it.variant_label,
      variant_group: it.variant_group,
      dietary_tags: it.dietary_tags.map((t) => `${t.label} (${t.source})`).join("; "),
      has_photo: it.has_photo,
    }));
}

export function exportJson(restaurant: Restaurant): string {
  return JSON.stringify(
    { restaurant: restaurant.name, items: toExportRows(restaurant.items) },
    null,
    2
  );
}

export function exportCsv(restaurant: Restaurant): string {
  const rows = toExportRows(restaurant.items);
  const headers: (keyof ExportRow)[] = [
    "name",
    "section",
    "description",
    "price_amount",
    "price_currency",
    "variant_label",
    "variant_group",
    "dietary_tags",
    "has_photo",
  ];
  const escape = (val: unknown) => {
    if (val == null) return "";
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Full-state export (for the "Import JSON" offline path — includes everything, not just
// approved rows, so a reviewer can round-trip the whole working state).
export function exportRestaurantState(restaurant: Restaurant): string {
  return JSON.stringify(restaurant, null, 2);
}

export function parseRestaurantState(text: string): Restaurant {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.items) || !Array.isArray(parsed.menus)) {
    throw new Error("Invalid restaurant JSON: expected { name, menus[], items[] }");
  }
  return parsed as Restaurant;
}
