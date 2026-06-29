import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Item, Menu, Restaurant, DietaryTag, SourcePage } from "./types";
import { makeId } from "./id";
import { ExtractedItem } from "./ai/schema";
import { SAMPLE_RESTAURANTS } from "./sample-data";
import { ModelId, DEFAULT_MODEL_ID } from "./ai/models";
import { PromptId } from "./ai/prompts";

type PromptOverride = {
  enabled: boolean;
  text: string;
};

type RestaurantState = {
  restaurants: Restaurant[];
  hasSeededMocks: boolean;
  ensureMocksSeeded: () => void;
  selectedModel: ModelId;
  setSelectedModel: (id: ModelId) => void;
  promptOverrides: Partial<Record<PromptId, PromptOverride>>;
  setPromptOverride: (id: PromptId, patch: Partial<PromptOverride>) => void;
  resetPromptOverride: (id: PromptId) => void;
  createRestaurant: (name: string) => string;
  importRestaurant: (restaurant: Restaurant) => string;
  addMenu: (restaurantId: string, name: string, fileName: string) => Menu;
  addExtractedItems: (
    restaurantId: string,
    menuId: string,
    extracted: ExtractedItem[],
    source?: { pageLabel?: string | null; fileName?: string | null; previewUrl?: string | null; mimeType?: string | null }
  ) => void;
  updateItem: (restaurantId: string, itemId: string, patch: Partial<Item>) => void;
  addManualItem: (restaurantId: string, menuId: string, section: string | null) => void;
  removeItem: (restaurantId: string, itemId: string) => void;
  moveItemToSection: (restaurantId: string, itemId: string, section: string | null) => void;
  setItemPhoto: (restaurantId: string, itemId: string, photoUrl: string | null) => void;
  setApproved: (restaurantId: string, itemId: string, approved: boolean) => void;
  applyAiDescription: (restaurantId: string, itemId: string, description: string) => void;
  acceptAiDescription: (restaurantId: string, itemId: string) => void;
  addInferredDietaryTag: (restaurantId: string, itemId: string, tag: DietaryTag) => void;
  removeDietaryTag: (restaurantId: string, itemId: string, index: number) => void;
};

function updateRestaurant(
  restaurants: Restaurant[],
  restaurantId: string,
  fn: (r: Restaurant) => Restaurant
): Restaurant[] {
  return restaurants.map((r) => (r.id === restaurantId ? fn(r) : r));
}

function updateItemIn(restaurant: Restaurant, itemId: string, fn: (it: Item) => Item): Restaurant {
  return { ...restaurant, items: restaurant.items.map((it) => (it.id === itemId ? fn(it) : it)) };
}

export const useRestaurantStore = create<RestaurantState>()(
  persist(
    (set, get) => ({
      restaurants: [],
      hasSeededMocks: false,
      selectedModel: DEFAULT_MODEL_ID,
      setSelectedModel: (id) => set({ selectedModel: id }),
      promptOverrides: {},
      setPromptOverride: (id, patch) =>
        set((state) => ({
          promptOverrides: {
            ...state.promptOverrides,
            [id]: { enabled: false, text: "", ...state.promptOverrides[id], ...patch },
          },
        })),
      resetPromptOverride: (id) =>
        set((state) => {
          const next = { ...state.promptOverrides };
          delete next[id];
          return { promptOverrides: next };
        }),

      ensureMocksSeeded: () => {
        const existingIds = new Set(get().restaurants.map((restaurant) => restaurant.id));
        const missingMocks = SAMPLE_RESTAURANTS.filter((restaurant) => !existingIds.has(restaurant.id));
        if (get().hasSeededMocks && missingMocks.length === 0) return;
        set((state) => ({
          restaurants: [...missingMocks, ...state.restaurants],
          hasSeededMocks: true,
        }));
      },

      createRestaurant: (name) => {
        const id = makeId("restaurant");
        const restaurant: Restaurant = { id, name, menus: [], sourcePages: [], items: [] };
        set((state) => ({ restaurants: [...state.restaurants, restaurant] }));
        return id;
      },

      importRestaurant: (restaurant) => {
        const id = makeId("restaurant");
        const withFreshId: Restaurant = { ...restaurant, id };
        set((state) => ({ restaurants: [...state.restaurants, withFreshId] }));
        return id;
      },

      addMenu: (restaurantId, name, fileName) => {
        const menu: Menu = { id: makeId("menu"), name, fileName };
        set((state) => ({
          restaurants: updateRestaurant(state.restaurants, restaurantId, (r) => ({
            ...r,
            menus: [...r.menus, menu],
          })),
        }));
        return menu;
      },

      addExtractedItems: (restaurantId, menuId, extracted, source) => {
        const sourcePage: SourcePage | null = source?.pageLabel
          ? {
              label: source.pageLabel,
              fileName: source.fileName ?? null,
              previewUrl: source.previewUrl ?? null,
              mimeType: source.mimeType ?? null,
            }
          : null;
        const items: Item[] = extracted.map((e) => ({
          id: makeId("item"),
          menuId,
          sourcePageLabel: source?.pageLabel ?? null,
          sourceFileName: source?.fileName ?? null,
          name: e.name,
          section: e.section,
          description: e.description,
          price: e.price,
          variant_label: e.variant_label,
          variant_group: e.variant_group,
          dietary_tags: e.dietary_tags.map((t) => ({
            label: t.label,
            source: "stated" as const,
            evidence: t.evidence,
          })),
          has_photo: e.has_photo,
          photoUrl: null,
          confidence: e.confidence,
          description_is_ai_draft: false,
          approved: false,
        }));
        set((state) => ({
          restaurants: updateRestaurant(state.restaurants, restaurantId, (r) => ({
            ...r,
            sourcePages: sourcePage
              ? [...(r.sourcePages ?? []).filter((page) => page.label !== sourcePage.label), sourcePage]
              : r.sourcePages,
            items: [...r.items, ...items],
          })),
        }));
      },

      updateItem: (restaurantId, itemId, patch) =>
        set((state) => ({
          restaurants: updateRestaurant(state.restaurants, restaurantId, (r) =>
            updateItemIn(r, itemId, (it) => ({ ...it, ...patch }))
          ),
        })),

      addManualItem: (restaurantId, menuId, section) =>
        set((state) => {
          const item: Item = {
            id: makeId("item"),
            menuId,
            sourcePageLabel: null,
            sourceFileName: null,
            sourcePreviewUrl: null,
            sourceMimeType: null,
            name: "",
            section,
            description: null,
            price: null,
            variant_label: null,
            variant_group: null,
            dietary_tags: [],
            has_photo: null,
            photoUrl: null,
            confidence: null,
            description_is_ai_draft: false,
            approved: false,
          };
          return {
            restaurants: updateRestaurant(state.restaurants, restaurantId, (r) => ({
              ...r,
              items: [...r.items, item],
            })),
          };
        }),

      removeItem: (restaurantId, itemId) =>
        set((state) => ({
          restaurants: updateRestaurant(state.restaurants, restaurantId, (r) => ({
            ...r,
            items: r.items.filter((it) => it.id !== itemId),
          })),
        })),

      moveItemToSection: (restaurantId, itemId, section) => get().updateItem(restaurantId, itemId, { section }),

      setItemPhoto: (restaurantId, itemId, photoUrl) =>
        get().updateItem(restaurantId, itemId, { photoUrl, has_photo: photoUrl != null ? true : null }),

      setApproved: (restaurantId, itemId, approved) => get().updateItem(restaurantId, itemId, { approved }),

      applyAiDescription: (restaurantId, itemId, description) =>
        get().updateItem(restaurantId, itemId, { description, description_is_ai_draft: true }),

      acceptAiDescription: (restaurantId, itemId) =>
        get().updateItem(restaurantId, itemId, { description_is_ai_draft: false }),

      addInferredDietaryTag: (restaurantId, itemId, tag) =>
        set((state) => ({
          restaurants: updateRestaurant(state.restaurants, restaurantId, (r) =>
            updateItemIn(r, itemId, (it) => ({ ...it, dietary_tags: [...it.dietary_tags, tag] }))
          ),
        })),

      removeDietaryTag: (restaurantId, itemId, index) =>
        set((state) => ({
          restaurants: updateRestaurant(state.restaurants, restaurantId, (r) =>
            updateItemIn(r, itemId, (it) => ({
              ...it,
              dietary_tags: it.dietary_tags.filter((_, i) => i !== index),
            }))
          ),
        })),
    }),
    { name: "glovo-menu-onboarding-v2" }
  )
);
