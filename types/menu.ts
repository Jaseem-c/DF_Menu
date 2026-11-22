export const CATEGORY_SLUGS = [
  "juices",
  "shakes",
  "toasts",
  "bowls",
  "salads",
  "hot-drinks",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const NUTRITION_KEYS = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "sugar",
] as const;

export type NutritionKey = (typeof NUTRITION_KEYS)[number];

export type Category = {
  id: string;
  name: string;
  slug: CategorySlug;
  sort_order: number;
  is_visible: boolean;
};

export type MenuItem = {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  description: string | null;
  price: number;
  image_url: string | null;
  ingredients: string[];
  tags: string[];
  allergens: string[];
  serving_size: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  is_available: boolean;
  is_popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Settings = {
  business_name: string;
  phone: string | null;
  whatsapp_number: string | null;
  announcement_text: string | null;
  announcement_enabled: boolean;
};

export type PublicMenu = {
  categories: Category[];
  items: MenuItem[];
  settings: Settings;
};

export type ActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };
