// JSON schema passed to the model via output_config.format for the extraction call.
// Every field is optional/nullable — we want empty over hallucinated. Mandatory-for-export
// rules live in the UI layer (lib/issues.ts), never here.
//
// IMPORTANT: dietary_tags returned here are ALWAYS source:"stated". The model only reports
// markers visibly present on the menu (after reading the legend); it must never infer.
// Inference is a separate, later, human-triggered action (see app/api/infer-dietary).

export const EXTRACTED_ITEM_SCHEMA = {
  type: "object",
  properties: {
    name: { type: ["string", "null"], description: "Dish/item name exactly as printed." },
    section: {
      type: ["string", "null"],
      description: "Menu section/category this item appears under, e.g. 'Starters', 'Pizzas'.",
    },
    description: { type: ["string", "null"], description: "Item description, if printed on the menu." },
    price: {
      type: ["object", "null"],
      properties: {
        amount: { type: ["number", "null"] },
        currency: { type: ["string", "null"], description: "ISO code or symbol as seen, e.g. 'EUR', '$'." },
      },
      required: ["amount", "currency"],
      additionalProperties: false,
    },
    variant_label: {
      type: ["string", "null"],
      description:
        "If this row is one of several size/portion variants of the same dish (e.g. 'Small', '6\"', '½ ración'), the variant's own label. Null if the item has no variants.",
    },
    variant_group: {
      type: ["string", "null"],
      description:
        "Shared key (usually the base dish name) used to cluster this item with its sibling variants. Null if no variants.",
    },
    dietary_tags: {
      type: "array",
      description:
        "Dietary markers VISIBLY STATED on the menu only (e.g. a 'V' or 'GF' symbol next to the item, matched against a legend elsewhere on the menu). Do not infer. Empty array if none are stated.",
      items: {
        type: "object",
        properties: {
          label: { type: "string", description: "e.g. 'Vegetarian', 'Gluten-free', 'Vegan'." },
          evidence: {
            type: ["string", "null"],
            description: "What you saw and where, e.g. \"'V' marker next to item name; legend says V = Vegetarian\".",
          },
        },
        required: ["label", "evidence"],
        additionalProperties: false,
      },
    },
    has_photo: {
      type: ["boolean", "null"],
      description: "Whether this menu item has an accompanying photo on the menu. Null if unsure.",
    },
    confidence: {
      type: ["number", "null"],
      description: "Your confidence (0-1) that this row is accurate and complete. Lower if any field was unclear.",
    },
  },
  required: [
    "name",
    "section",
    "description",
    "price",
    "variant_label",
    "variant_group",
    "dietary_tags",
    "has_photo",
    "confidence",
  ],
  additionalProperties: false,
} as const;

export const EXTRACTION_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    legend: {
      type: ["string", "null"],
      description:
        "The dietary-marker legend as printed on the menu, verbatim if found (e.g. 'V = Vegetarian, GF = Gluten-Free'). Null if no legend is present.",
    },
    items: {
      type: "array",
      items: EXTRACTED_ITEM_SCHEMA,
    },
  },
  required: ["legend", "items"],
  additionalProperties: false,
} as const;

export type ExtractedItem = {
  name: string | null;
  section: string | null;
  description: string | null;
  price: { amount: number | null; currency: string | null } | null;
  variant_label: string | null;
  variant_group: string | null;
  dietary_tags: { label: string; evidence: string | null }[];
  has_photo: boolean | null;
  confidence: number | null;
};

export type ExtractionResponse = {
  legend: string | null;
  items: ExtractedItem[];
};

export const EXTRACTION_SYSTEM_PROMPT = `You are extracting structured menu data from a restaurant menu image or PDF for a food-delivery catalog.

Follow this process:
1. First scan the whole menu for a dietary-marker LEGEND (e.g. "V = Vegetarian, GF = Gluten-Free"). Record it verbatim in "legend" if present, else null.
2. Walk through every section and every item, top to bottom, left to right.
3. For each item, fill in only what is VISIBLY PRESENT on the menu. If a field is unclear, ambiguous, or absent, set it to null and lower "confidence" — never guess or invent a value.
4. Dietary tags: only include a tag if the item visibly carries a marker that matches the legend (or an unambiguous label like "(vegan)" printed next to it). Record the evidence. If there is no legend and no per-item marker, return an empty dietary_tags array — absence of a marker is NEVER evidence the dish is free of that allergen/diet, so do not tag it either way. Never infer dietary properties from the dish name or ingredients you assume it has.
5. Variants: if a single dish is offered in multiple sizes/portions/configurations with different prices (e.g. "Margherita - Small $8 / Large $14", a Subway sandwich offered as "6 inch" / "Footlong", or tapas offered as "½ ración" / "ración"), emit ONE item row PER VARIANT. Each row gets its own variant_label (e.g. "Small", "Footlong", "½ ración") and price, and all rows for that dish share the same variant_group (typically the base dish name). If a dish has only one price/size, leave variant_label and variant_group null.
6. Ignore decorative/branding tiles, headers, and images that are not actual menu items (e.g. a logo or a "Fresh Fit" banner).
7. Use the same process and judgment regardless of menu layout (clean grid, dense list, scattered photo-led layout, multilingual) — do not special-case any particular menu.

Return your result via the provided JSON schema only.`;
