import { HIGH_PROTEIN_GRAMS } from "@/lib/constants";
import type { MenuItem } from "@/types/menu";

export type SortKey = "menu" | "price-asc" | "price-desc" | "calories-asc" | "protein-desc";

export type MenuFilters = {
  query: string;
  tag: string | null;
  highProtein: boolean;
  maxCalories: number | null;
  sort: SortKey;
};

export const DEFAULT_FILTERS: MenuFilters = {
  query: "",
  tag: null,
  highProtein: false,
  maxCalories: null,
  sort: "menu",
};

export function hasActiveFilters(f: MenuFilters): boolean {
  return Boolean(f.query.trim() || f.tag || f.highProtein || f.maxCalories || f.sort !== "menu");
}

function matchesQuery(item: MenuItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [item.name, item.description ?? "", ...item.ingredients, ...item.tags]
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

/** Compares nullable numbers, always putting missing values last. */
function byNumber(a: number | null, b: number | null, dir: 1 | -1): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return (a - b) * dir;
}

export function applyFilters(items: MenuItem[], f: MenuFilters): MenuItem[] {
  const kept = items.filter(
    (item) =>
      matchesQuery(item, f.query) &&
      (!f.tag || item.tags.includes(f.tag)) &&
      (!f.highProtein || (item.protein !== null && item.protein >= HIGH_PROTEIN_GRAMS)) &&
      (!f.maxCalories || (item.calories !== null && item.calories <= f.maxCalories)),
  );

  switch (f.sort) {
    case "price-asc":
      return kept.sort((a, b) => a.price - b.price);
    case "price-desc":
      return kept.sort((a, b) => b.price - a.price);
    case "calories-asc":
      return kept.sort((a, b) => byNumber(a.calories, b.calories, 1));
    case "protein-desc":
      return kept.sort((a, b) => byNumber(a.protein, b.protein, -1));
    default:
      return kept;
  }
}
