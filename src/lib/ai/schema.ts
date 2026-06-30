// JSON schema passed to the model via output_config.format for the extraction call.
// Every field is optional/nullable — we want empty over hallucinated. Mandatory-for-export
// rules live in the UI layer (lib/issues.ts), never here.
//
// IMPORTANT: dietary_tags returned here are ALWAYS source:"stated". The model only reports
// dietary/allergen markers visibly present on the menu (after reading the legend); it must never infer.
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
        "Dietary or allergen markers VISIBLY STATED on the menu only (e.g. a 'V', 'GF', '(vegan)', or numeric allergen code next to the item, matched against a legend elsewhere on the menu). Do not infer. Empty array if none are stated.",
      items: {
        type: "object",
        properties: {
          label: { type: "string", description: "e.g. 'Vegetarian', 'Gluten-free', 'Vegan', 'Contains egg', 'Contains gluten'." },
          evidence: {
            type: ["string", "null"],
            description:
              "What you saw and where, e.g. \"'V' marker next to item name; legend says V = Vegetarian\" or \"'(1. 13.)' after price; footer legend says 1 = Egg, 13 = Gluten\".",
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
    source_page_index: {
      type: ["integer", "null"],
      description:
        "1-based index of which input page/image this item was found on, matching the order the pages were attached (page 1 is the first image/document provided). Null only if a single page was provided.",
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
    "source_page_index",
  ],
  additionalProperties: false,
} as const;

export const EXTRACTION_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    legend: {
      type: ["string", "null"],
      description:
        "The dietary/allergen marker legend as printed on the menu, verbatim if found (e.g. 'V = Vegetarian, GF = Gluten-Free' or '1 Egg, 13 Gluten'). Null if no legend is present.",
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
  source_page_index: number | null;
};

export type ExtractionResponse = {
  legend: string | null;
  items: ExtractedItem[];
};

// Schema for the prompt-edit ("edit entire draft") call. Mirrors EXTRACTED_ITEM_SCHEMA's
// content fields but adds a nullable "id" so the model can carry item identity across
// edits (see EditDraftItem / edit_draft prompt). No has_photo/confidence — those are
// workflow metadata the model never sees or touches.
export const EDIT_DRAFT_ITEM_SCHEMA = {
  type: "object",
  properties: {
    id: {
      type: ["string", "null"],
      description: "Echo back the input id if this row still represents the same item. Null only for brand-new rows you created by splitting an existing one.",
    },
    name: { type: ["string", "null"] },
    section: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    price: {
      type: ["object", "null"],
      properties: {
        amount: { type: ["number", "null"] },
        currency: { type: ["string", "null"] },
      },
      required: ["amount", "currency"],
      additionalProperties: false,
    },
    variant_label: { type: ["string", "null"] },
    variant_group: { type: ["string", "null"] },
    dietary_tags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          source: { type: "string", enum: ["stated", "inferred"] },
          evidence: { type: ["string", "null"] },
        },
        required: ["label", "source", "evidence"],
        additionalProperties: false,
      },
    },
  },
  required: ["id", "name", "section", "description", "price", "variant_label", "variant_group", "dietary_tags"],
  additionalProperties: false,
} as const;

export const EDIT_DRAFT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    items: { type: "array", items: EDIT_DRAFT_ITEM_SCHEMA },
  },
  required: ["items"],
  additionalProperties: false,
} as const;

// Schema for the batched description call (create or enhance for many items at once).
export const BATCH_DESCRIPTION_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "Echo back the input item's id." },
          description: { type: "string" },
        },
        required: ["id", "description"],
        additionalProperties: false,
      },
    },
  },
  required: ["results"],
  additionalProperties: false,
} as const;

export const EXTRACTION_SYSTEM_PROMPT = `You are extracting structured menu data from a restaurant menu for a food-delivery catalog. You may be given a single page or multiple pages (images and/or PDFs) that together make up one menu, in reading order.

Follow this process:
1. First scan ALL pages, including small footer text, for a dietary/allergen-marker LEGEND (e.g. "V = Vegetarian, GF = Gluten-Free" or numbered allergen codes like "1 Egg, 13 Gluten") — it may appear on any page, not necessarily the first. Record it verbatim in "legend" if present, else null. The same legend applies across all pages unless a later page clearly defines its own.
2. Walk through every section and every item across all pages, top to bottom, left to right, in the order the pages were given. If a section started on one page clearly continues onto the next (same heading, or items obviously continuing the same list), treat it as ONE section, not two.
3. For each item, fill in only what is VISIBLY PRESENT on the menu. If a field is unclear, ambiguous, or absent, set it to null and lower "confidence" — never guess or invent a value.
4. Dietary/allergen tags: include a tag only if the item visibly carries a marker that matches the legend (e.g. "(1. 5. 13.)" after an item where the footer legend maps 1=Egg, 5=Dairy, 13=Gluten) or an unambiguous printed label like "(vegan)" next to the item. Use positive labels such as "Vegetarian", "Vegan", "Contains egg", "Contains dairy", or "Contains gluten". Record the exact evidence. If there is no legend and no per-item marker, return an empty dietary_tags array — absence of a marker is NEVER evidence the dish is free of that allergen/diet, so do not tag it either way. Never infer dietary properties from the dish name or ingredients you assume it has.
5. Variants: if a single dish is offered in multiple sizes/portions/configurations with different prices (e.g. "Margherita - Small $8 / Large $14", a Subway sandwich offered as "6 inch" / "Footlong", or tapas offered as "½ ración" / "ración"), emit ONE item row PER VARIANT, even if the variants are printed on different pages. Each row gets its own variant_label (e.g. "Small", "Footlong", "½ ración") and price, and all rows for that dish share the same variant_group (typically the base dish name). If a dish has only one price/size, leave variant_label and variant_group null.
6. Ignore decorative/branding tiles, headers, and images that are not actual menu items (e.g. a logo or a "Fresh Fit" banner).
7. Use the same process and judgment regardless of menu layout (clean grid, dense list, scattered photo-led layout, multilingual) — do not special-case any particular menu.
8. For every item, set "source_page_index" to the 1-based index of the page it physically appears on, matching the order the pages were attached (the first page/image/document you were given is 1, the second is 2, and so on). If only one page was given, this is always 1.

Return your result via the provided JSON schema only.`;
