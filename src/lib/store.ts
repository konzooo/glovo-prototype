import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Item, Menu, Restaurant, DietaryTag, SourcePage } from "./types";
import { makeId } from "./id";
import { ExtractedItem } from "./ai/schema";
import { EditDraftItem } from "./ai/provider";
import { SAMPLE_RESTAURANTS } from "./sample-data";
import { ModelId, DEFAULT_MODEL_ID } from "./ai/models";
import { PromptId } from "./ai/prompts";

type PromptOverride = {
  enabled: boolean;
  text: string;
};

// Item-mutating actions target either the live catalog ("items") or the
// working copy produced by a prompt edit ("draft"), kept in restaurant.aiDraft.
export type ListScope = "items" | "draft";

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
  updateItem: (restaurantId: string, itemId: string, patch: Partial<Item>, scope?: ListScope) => void;
  addManualItem: (restaurantId: string, menuId: string, section: string | null, scope?: ListScope) => void;
  removeItem: (restaurantId: string, itemId: string, scope?: ListScope) => void;
  moveItemToSection: (restaurantId: string, itemId: string, section: string | null, scope?: ListScope) => void;
  setItemPhoto: (restaurantId: string, itemId: string, photoUrl: string | null, scope?: ListScope) => void;
  setApproved: (restaurantId: string, itemId: string, approved: boolean, scope?: ListScope) => void;
  applyAiDescription: (restaurantId: string, itemId: string, description: string, scope?: ListScope) => void;
  acceptAiDescription: (restaurantId: string, itemId: string, scope?: ListScope) => void;
  addInferredDietaryTag: (restaurantId: string, itemId: string, tag: DietaryTag, scope?: ListScope) => void;
  removeDietaryTag: (restaurantId: string, itemId: string, index: number, scope?: ListScope) => void;
  createAiDraft: (restaurantId: string) => void;
  applyAiPromptResult: (restaurantId: string, prompt: string, resultItems: EditDraftItem[]) => void;
  discardAiDraft: (restaurantId: string) => void;
};

function updateRestaurant(
  restaurants: Restaurant[],
  restaurantId: string,
  fn: (r: Restaurant) => Restaurant
): Restaurant[] {
  return restaurants.map((r) => (r.id === restaurantId ? fn(r) : r));
}

function getScopedItems(restaurant: Restaurant, scope: ListScope): Item[] {
  return scope === "draft" ? restaurant.aiDraft?.items ?? [] : restaurant.items;
}

function withScopedItems(restaurant: Restaurant, scope: ListScope, items: Item[]): Restaurant {
  if (scope === "draft") {
    return restaurant.aiDraft ? { ...restaurant, aiDraft: { ...restaurant.aiDraft, items } } : restaurant;
  }
  return { ...restaurant, items };
}

function updateItemIn(restaurant: Restaurant, scope: ListScope, itemId: string, fn: (it: Item) => Item): Restaurant {
  return withScopedItems(
    restaurant,
    scope,
    getScopedItems(restaurant, scope).map((it) => (it.id === itemId ? fn(it) : it))
  );
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

      updateItem: (restaurantId, itemId, patch, scope = "items") =>
        set((state) => ({
          restaurants: updateRestaurant(state.restaurants, restaurantId, (r) =>
            updateItemIn(r, scope, itemId, (it) => ({ ...it, ...patch }))
          ),
        })),

      addManualItem: (restaurantId, menuId, section, scope = "items") =>
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
            restaurants: updateRestaurant(state.restaurants, restaurantId, (r) =>
              withScopedItems(r, scope, [...getScopedItems(r, scope), item])
            ),
          };
        }),

      removeItem: (restaurantId, itemId, scope = "items") =>
        set((state) => ({
          restaurants: updateRestaurant(state.restaurants, restaurantId, (r) =>
            withScopedItems(r, scope, getScopedItems(r, scope).filter((it) => it.id !== itemId))
          ),
        })),

      moveItemToSection: (restaurantId, itemId, section, scope = "items") =>
        get().updateItem(restaurantId, itemId, { section }, scope),

      setItemPhoto: (restaurantId, itemId, photoUrl, scope = "items") =>
        get().updateItem(restaurantId, itemId, { photoUrl, has_photo: photoUrl != null ? true : null }, scope),

      setApproved: (restaurantId, itemId, approved, scope = "items") =>
        get().updateItem(restaurantId, itemId, { approved }, scope),

      // Resets "approved" — an AI-touched field needs a human look again before it can ship.
      applyAiDescription: (restaurantId, itemId, description, scope = "items") =>
        get().updateItem(restaurantId, itemId, { description, description_is_ai_draft: true, approved: false }, scope),

      acceptAiDescription: (restaurantId, itemId, scope = "items") =>
        get().updateItem(restaurantId, itemId, { description_is_ai_draft: false }, scope),

      addInferredDietaryTag: (restaurantId, itemId, tag, scope = "items") =>
        set((state) => ({
          restaurants: updateRestaurant(state.restaurants, restaurantId, (r) =>
            updateItemIn(r, scope, itemId, (it) => ({ ...it, dietary_tags: [...it.dietary_tags, tag] }))
          ),
        })),

      removeDietaryTag: (restaurantId, itemId, index, scope = "items") =>
        set((state) => ({
          restaurants: updateRestaurant(state.restaurants, restaurantId, (r) =>
            updateItemIn(r, scope, itemId, (it) => ({
              ...it,
              dietary_tags: it.dietary_tags.filter((_, i) => i !== index),
            }))
          ),
        })),

      createAiDraft: (restaurantId) =>
        set((state) => ({
          restaurants: updateRestaurant(state.restaurants, restaurantId, (r) =>
            r.aiDraft
              ? r
              : {
                  ...r,
                  aiDraft: {
                    prompts: [],
                    items: r.items.map((it) => ({ ...it, dietary_tags: [...it.dietary_tags] })),
                  },
                }
          ),
        })),

      // Every item in the result comes back unapproved: a structural edit can shift an
      // item's meaning (new section, merged variant, etc.) even when its own fields
      // look unchanged, so the whole draft needs a fresh human look before re-approving.
      applyAiPromptResult: (restaurantId, prompt, resultItems) =>
        set((state) => ({
          restaurants: updateRestaurant(state.restaurants, restaurantId, (r) => {
            const prevItems = r.aiDraft?.items ?? r.items;
            const prevById = new Map(prevItems.map((it) => [it.id, it]));
            const fallbackMenuId = r.menus[0]?.id ?? prevItems[0]?.menuId ?? "";
            const items: Item[] = resultItems.map((res) => {
              const prev = res.id ? prevById.get(res.id) : undefined;
              return {
                id: prev?.id ?? makeId("item"),
                menuId: prev?.menuId ?? fallbackMenuId,
                sourcePageLabel: prev?.sourcePageLabel ?? null,
                sourceFileName: prev?.sourceFileName ?? null,
                sourcePreviewUrl: prev?.sourcePreviewUrl ?? null,
                sourceMimeType: prev?.sourceMimeType ?? null,
                name: res.name,
                section: res.section,
                description: res.description,
                price: res.price,
                variant_label: res.variant_label,
                variant_group: res.variant_group,
                dietary_tags: res.dietary_tags,
                has_photo: prev?.has_photo ?? null,
                photoUrl: prev?.photoUrl ?? null,
                confidence: prev?.confidence ?? null,
                description_is_ai_draft: prev?.description_is_ai_draft ?? false,
                approved: false,
              };
            });
            return {
              ...r,
              aiDraft: {
                prompts: [...(r.aiDraft?.prompts ?? []), prompt],
                items,
              },
            };
          }),
        })),

      discardAiDraft: (restaurantId) =>
        set((state) => ({
          restaurants: updateRestaurant(state.restaurants, restaurantId, (r) => ({ ...r, aiDraft: null })),
        })),
    }),
    { name: "glovo-menu-onboarding-v2" }
  )
);
