import { ExtractionResponse } from "./ai/schema";

export type OfflineSampleMenu = {
  id: string;
  restaurantName: string;
  description: string;
  imageUrl: string;
  fileName: string;
  menuName: string;
  extraction: ExtractionResponse;
};

export const OFFLINE_SAMPLE_MENUS: OfflineSampleMenu[] = [
  {
    "id": "subway",
    "restaurantName": "Subway Fresh Fit Subs",
    "description": "Variant-heavy sandwich menu with 6-inch and footlong prices.",
    "imageUrl": "/samples/subway-menu.png",
    "fileName": "subway-menu.png",
    "menuName": "Fresh Fit Subs",
    "extraction": {
      "legend": null,
      "items": [
        {
          "name": "ROTISSERIE-STYLE CHICKEN",
          "section": "6\" SUBWAY FRESH FIT SUBS",
          "description": "NEW! 350/690 cal RAISED WITHOUT ANTIBIOTICS",
          "price": {
            "amount": 4.75,
            "currency": " $"
          },
          "variant_label": "6\"",
          "variant_group": "Rotisserie-Style Chicken",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "ROTISSERIE-STYLE CHICKEN",
          "section": "6\" SUBWAY FRESH FIT SUBS",
          "description": "NEW! 350/690 cal RAISED WITHOUT ANTIBIOTICS",
          "price": {
            "amount": 7.75,
            "currency": " $"
          },
          "variant_label": "FOOTLONG",
          "variant_group": "Rotisserie-Style Chicken",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "CARVED TURKEY",
          "section": "6\" SUBWAY FRESH FIT SUBS",
          "description": "NEW! 330/670 cal",
          "price": {
            "amount": 4.75,
            "currency": " $"
          },
          "variant_label": "6\"",
          "variant_group": "Carved Turkey",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "CARVED TURKEY",
          "section": "6\" SUBWAY FRESH FIT SUBS",
          "description": "NEW! 330/670 cal",
          "price": {
            "amount": 7.75,
            "currency": " $"
          },
          "variant_label": "FOOTLONG",
          "variant_group": "Carved Turkey",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "ROAST BEEF",
          "section": "6\" SUBWAY FRESH FIT SUBS",
          "description": "320/630 cal",
          "price": {
            "amount": 4.75,
            "currency": " $"
          },
          "variant_label": "6\"",
          "variant_group": "Roast Beef",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "ROAST BEEF",
          "section": "6\" SUBWAY FRESH FIT SUBS",
          "description": "320/630 cal",
          "price": {
            "amount": 7.75,
            "currency": " $"
          },
          "variant_label": "FOOTLONG",
          "variant_group": "Roast Beef",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "SUBWAY CLUB*",
          "section": "6\" SUBWAY FRESH FIT SUBS",
          "description": "310/630 cal",
          "price": {
            "amount": 4.25,
            "currency": " $"
          },
          "variant_label": "6\"",
          "variant_group": "Subway Club",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "SUBWAY CLUB*",
          "section": "6\" SUBWAY FRESH FIT SUBS",
          "description": "310/630 cal",
          "price": {
            "amount": 6.75,
            "currency": " $"
          },
          "variant_label": "FOOTLONG",
          "variant_group": "Subway Club",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "OVEN ROASTED CHICKEN",
          "section": "6\" SUBWAY FRESH FIT SUBS",
          "description": "320/640 cal",
          "price": {
            "amount": 4.25,
            "currency": " $"
          },
          "variant_label": "6\"",
          "variant_group": "Oven Roasted Chicken",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "OVEN ROASTED CHICKEN",
          "section": "6\" SUBWAY FRESH FIT SUBS",
          "description": "320/640 cal",
          "price": {
            "amount": 6.75,
            "currency": " $"
          },
          "variant_label": "FOOTLONG",
          "variant_group": "Oven Roasted Chicken",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "TURKEY BREAST",
          "section": "6\" SUBWAY FRESH FIT SUBS",
          "description": "280/560 cal",
          "price": {
            "amount": 4.25,
            "currency": " $"
          },
          "variant_label": "6\"",
          "variant_group": "Turkey Breast",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "TURKEY BREAST",
          "section": "6\" SUBWAY FRESH FIT SUBS",
          "description": "280/560 cal",
          "price": {
            "amount": 6.75,
            "currency": " $"
          },
          "variant_label": "FOOTLONG",
          "variant_group": "Turkey Breast",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "BLACK FOREST HAM",
          "section": "6\" SUBWAY FRESH FIT SUBS",
          "description": "290/570 cal",
          "price": {
            "amount": 3.75,
            "currency": " $"
          },
          "variant_label": "6\"",
          "variant_group": "Black Forest Ham",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "BLACK FOREST HAM",
          "section": "6\" SUBWAY FRESH FIT SUBS",
          "description": "290/570 cal",
          "price": {
            "amount": 5.5,
            "currency": " $"
          },
          "variant_label": "FOOTLONG",
          "variant_group": "Black Forest Ham",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "VEGGIE DELITE*",
          "section": "6\" SUBWAY FRESH FIT SUBS",
          "description": "230/460 cal",
          "price": {
            "amount": 3.75,
            "currency": " $"
          },
          "variant_label": "6\"",
          "variant_group": "Veggie Delite",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "VEGGIE DELITE*",
          "section": "6\" SUBWAY FRESH FIT SUBS",
          "description": "230/460 cal",
          "price": {
            "amount": 5.5,
            "currency": " $"
          },
          "variant_label": "FOOTLONG",
          "variant_group": "Veggie Delite",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        }
      ]
    }
  },
  {
    "id": "tapas",
    "restaurantName": "Tapas del Mar",
    "description": "Dense Spanish tapas menu with symbol-based dietary/allergen markers.",
    "imageUrl": "/samples/tapas-menu.png",
    "fileName": "tapas-menu.png",
    "menuName": "Main menu",
    "extraction": {
      "legend": "★ Platos estrella ● Vegano ● Contiene Gluten -",
      "items": [
        {
          "name": "Plato de Jamón Ibérico",
          "section": "EMBUTIDOS",
          "description": null,
          "price": {
            "amount": 16.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": "Plato de Jamón Ibérico",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 0.9,
          "source_page_index": 1
        },
        {
          "name": "Plato de Jamón Ibérico",
          "section": "EMBUTIDOS",
          "description": null,
          "price": {
            "amount": 11.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": "Plato de Jamón Ibérico",
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 0.9,
          "source_page_index": 1
        },
        {
          "name": "Plato de Jamón + Queso curado",
          "section": "EMBUTIDOS",
          "description": null,
          "price": {
            "amount": 15.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Plato de Jamón del país",
          "section": "EMBUTIDOS",
          "description": null,
          "price": {
            "amount": 8.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Plato de Fuet",
          "section": "EMBUTIDOS",
          "description": null,
          "price": {
            "amount": 5.85,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Plato de Queso de Oveja",
          "section": "EMBUTIDOS",
          "description": null,
          "price": {
            "amount": 9.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Plato de Queso Semicurado",
          "section": "EMBUTIDOS",
          "description": null,
          "price": {
            "amount": 6.85,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Pan con tomate",
          "section": "EMBUTIDOS",
          "description": null,
          "price": {
            "amount": 3.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Contains gluten",
              "evidence": "Orange dot marker next to item name; legend says ● Contiene Gluten -"
            }
          ],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Sepia a la plancha",
          "section": "TAPAS del mar",
          "description": null,
          "price": {
            "amount": 10.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Chipirones a la andaluza",
          "section": "TAPAS del mar",
          "description": null,
          "price": {
            "amount": 10.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Gambas a la plancha",
          "section": "TAPAS del mar",
          "description": null,
          "price": {
            "amount": 17.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Contains gluten",
              "evidence": "Orange dot marker next to item name; legend says ● Contiene Gluten -"
            }
          ],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Buñuelos de bacalao",
          "section": "TAPAS del mar",
          "description": null,
          "price": {
            "amount": 8.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Contains gluten",
              "evidence": "Orange dot marker next to item name; legend says ● Contiene Gluten -"
            }
          ],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Berberechos",
          "section": "TAPAS del mar",
          "description": null,
          "price": {
            "amount": 6.85,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Mejillones frescos al vapor",
          "section": "TAPAS del mar",
          "description": null,
          "price": {
            "amount": 10.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Anchoas del norte",
          "section": "TAPAS del mar",
          "description": null,
          "price": {
            "amount": 6.85,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Boquerones en vinagre",
          "section": "TAPAS del mar",
          "description": null,
          "price": {
            "amount": 6.85,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Langostinos rebozados",
          "section": "TAPAS del mar",
          "description": null,
          "price": {
            "amount": 10.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Contains gluten",
              "evidence": "Orange dot marker next to item name; legend says ● Contiene Gluten -"
            }
          ],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Calamares a la romana",
          "section": "TAPAS del mar",
          "description": null,
          "price": {
            "amount": 7.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Contains gluten",
              "evidence": "Orange dot marker next to item name; legend says ● Contiene Gluten -"
            }
          ],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Chocos a la andaluza",
          "section": "TAPAS del mar",
          "description": null,
          "price": {
            "amount": 9.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Pechuga de pollo con patatas fritas",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 12.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Hamburguesa con patatas fritas",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 11.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Escalopa de pollo con patatas fritas",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 13.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Bistec de ternera a la plancha",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 13.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Churrasco de ternera con patatas fritas",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 15.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Entrecot de ternera a la plancha",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 17.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Salchichas del país con patatas fritas",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 12.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Beicon huevo y patatas fritas",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 11.85,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Butifarra de payés con patatas fritas",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 12.25,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Lomo de cerdo con patatas fritas",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 12.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Frankfurt con huevo y patatas fritas",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 11.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Nuggets de pollo con patatas fritas",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 12.75,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Croquetas de cocido con patatas fritas",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 12.25,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Contains gluten",
              "evidence": "Orange dot marker next to item name; legend says ● Contiene Gluten -"
            }
          ],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Librito de lomo con patatas fritas",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 12.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "San jacobos con patatas fritas",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 11.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Contains gluten",
              "evidence": "Orange dot marker next to item name; legend says ● Contiene Gluten -"
            }
          ],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Alitas de pollo con patatas fritas",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 12.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Fingers de pollo con patatas fritas",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 12.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Contains gluten",
              "evidence": "Orange dot marker next to item name; legend says ● Contiene Gluten -"
            }
          ],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Calamares a la romana con ensalada",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 13.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Buñuelos de bacalao con ensalada",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 12.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Contains gluten",
              "evidence": "Orange dot marker next to item name; legend says ● Contiene Gluten -"
            }
          ],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Chocos a la andaluza con ensalada",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 13.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Sepia a la plancha con ensalada",
          "section": "PLATOS COMBINADOS",
          "description": null,
          "price": {
            "amount": 15.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Ensaladilla rusa casera",
          "section": "TAPAS para empezar",
          "description": null,
          "price": {
            "amount": 5.85,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Huevos estrellados con jamón",
          "section": "TAPAS para empezar",
          "description": null,
          "price": {
            "amount": 10.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Patatas bravas caseras",
          "section": "TAPAS para empezar",
          "description": null,
          "price": {
            "amount": 6.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Croquetas de cocido",
          "section": "TAPAS para empezar",
          "description": null,
          "price": {
            "amount": 6.45,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Contains gluten",
              "evidence": "Orange dot marker next to item name; legend says ● Contiene Gluten -"
            }
          ],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Croquetas de jamón ibérico",
          "section": "TAPAS para empezar",
          "description": null,
          "price": {
            "amount": 6.45,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Contains gluten",
              "evidence": "Orange dot marker next to item name; legend says ● Contiene Gluten -"
            }
          ],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Patatas fritas caseras",
          "section": "TAPAS para empezar",
          "description": null,
          "price": {
            "amount": 5.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Vegan",
              "evidence": "Green dot marker next to item name; legend says ● Vegano"
            }
          ],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Tortilla de patatas",
          "section": "TAPAS para empezar",
          "description": null,
          "price": {
            "amount": 5.55,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Tortilla de alcachofas",
          "section": "TAPAS para empezar",
          "description": null,
          "price": {
            "amount": 5.55,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Pimientos del padrón",
          "section": "TAPAS para empezar",
          "description": null,
          "price": {
            "amount": 5.55,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Vegan",
              "evidence": "Green dot marker next to item name; legend says ● Vegano"
            }
          ],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Champiñones al ajillo",
          "section": "TAPAS para empezar",
          "description": null,
          "price": {
            "amount": 6.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Vegan",
              "evidence": "Green dot marker next to item name; legend says ● Vegano"
            }
          ],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Jalapeños rellenos de queso",
          "section": "TAPAS para empezar",
          "description": null,
          "price": {
            "amount": 6.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Contains gluten",
              "evidence": "Orange dot marker next to item name; legend says ● Contiene Gluten -"
            }
          ],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Fingers de Mozzarella",
          "section": "TAPAS para empezar",
          "description": null,
          "price": {
            "amount": 7.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Contains gluten",
              "evidence": "Orange dot marker next to item name; legend says ● Contiene Gluten -"
            }
          ],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Queso Camembert rebozado",
          "section": "TAPAS para empezar",
          "description": null,
          "price": {
            "amount": 5.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Contains gluten",
              "evidence": "Orange dot marker next to item name; legend says ● Contiene Gluten -"
            }
          ],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Salchichas del país",
          "section": "TAPAS",
          "description": null,
          "price": {
            "amount": 7.85,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Contains gluten",
              "evidence": "Orange dot marker next to item name; legend says ● Contiene Gluten -"
            }
          ],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Oreja a la gallega",
          "section": "TAPAS",
          "description": null,
          "price": {
            "amount": 6.85,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Lacón a la gallega",
          "section": "TAPAS",
          "description": null,
          "price": {
            "amount": 9.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Choricitos al vino blanco",
          "section": "TAPAS",
          "description": null,
          "price": {
            "amount": 6.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": false,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Nuggets de pollo",
          "section": "TAPAS",
          "description": null,
          "price": {
            "amount": 8.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        },
        {
          "name": "Fingers o Alitas de pollo",
          "section": "TAPAS",
          "description": null,
          "price": {
            "amount": 8.95,
            "currency": "€"
          },
          "variant_label": null,
          "variant_group": null,
          "dietary_tags": [
            {
              "label": "Contains gluten",
              "evidence": "Orange dot marker next to item name; legend says ● Contiene Gluten -"
            }
          ],
          "has_photo": true,
          "confidence": 1,
          "source_page_index": 1
        }
      ]
    }
  }
];
