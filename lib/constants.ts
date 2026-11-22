import type { CategorySlug } from "@/types/menu";

export const BRAND_PROMISES = [
  "No refined sugar",
  "Olive oil only",
  "No palm oil",
  "Air frying only",
] as const;

export const CATEGORY_EMOJI: Record<CategorySlug, string> = {
  juices: "🥤",
  shakes: "🥛",
  toasts: "🍞",
  bowls: "🥣",
  salads: "🥗",
  "hot-drinks": "🍵",
};

export const SUGGESTED_TAGS = [
  "veg",
  "non-veg",
  "vegan",
  "high-protein",
  "gluten-free",
  "dairy-free",
  "low-sugar",
];

export const COMMON_ALLERGENS = [
  "nuts",
  "dairy",
  "gluten",
  "soy",
  "eggs",
  "sesame",
];

/** Items with at least this much protein (g) count as "high protein". */
export const HIGH_PROTEIN_GRAMS = 15;

export const CALORIE_LIMITS = [100, 200, 300, 400, 500] as const;

export const IMAGE_BUCKET = "menu-images";
export const IMAGE_TARGET_BYTES = 200 * 1024;
export const IMAGE_MAX_BYTES = 300 * 1024;
export const IMAGE_MAX_DIMENSION = 1000;
export const IMAGE_MIME_TYPES = ["image/webp", "image/jpeg", "image/png"];
