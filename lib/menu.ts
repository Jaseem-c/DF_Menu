import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import seed from "@/data/menu.json";
import { slugify } from "@/lib/format";
import { createPublicClient } from "@/lib/supabase/public";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSessionClient } from "@/lib/supabase/server";
import type { ItemInput, SettingsInput } from "@/lib/validation";
import type { Category, MenuItem, PublicMenu, Settings } from "@/types/menu";

/**
 * Repository for all menu data access. Public reads are cached and tagged
 * `menu`; admin reads and every write use the signed-in user's session so that
 * Row Level Security decides what is allowed.
 */

export const MENU_TAG = "menu";

function unwrap<T>({ data, error }: { data: unknown; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

/* ------------------------------------------------------------ public reads */

export async function getPublicMenu(): Promise<PublicMenu> {
  "use cache";
  cacheLife("hours");
  cacheTag(MENU_TAG);

  if (!getSupabaseEnv()) return seedMenu();

  const db = createPublicClient();
  const [categories, items, settings] = await Promise.all([
    db.from("categories").select("*").eq("is_visible", true).order("sort_order"),
    db.from("menu_items").select("*").order("sort_order"),
    db.from("settings").select("*").eq("id", 1).single(),
  ]);

  return {
    categories: unwrap<Category[]>(categories),
    items: unwrap<MenuItem[]>(items),
    settings: unwrap<Settings>(settings),
  };
}

/** Preview data from data/menu.json, used only while Supabase is not configured. */
function seedMenu(): PublicMenu {
  const epoch = new Date(0).toISOString();
  return {
    categories: seed.categories.map((c) => ({ ...c, id: c.slug })) as Category[],
    items: seed.items.map((i) => ({
      ...i,
      id: i.slug,
      created_at: epoch,
      updated_at: epoch,
    })) as MenuItem[],
    settings: seed.settings as Settings,
  };
}

/* ------------------------------------------------------------ admin reads */

export async function listCategories(): Promise<Category[]> {
  const db = await createSessionClient();
  return unwrap(await db.from("categories").select("*").order("sort_order"));
}

export async function listItems(): Promise<MenuItem[]> {
  const db = await createSessionClient();
  return unwrap(
    await db.from("menu_items").select("*").order("category").order("sort_order"),
  );
}

export async function getItem(id: string): Promise<MenuItem | null> {
  const db = await createSessionClient();
  return unwrap(await db.from("menu_items").select("*").eq("id", id).maybeSingle());
}

export async function getSettings(): Promise<Settings> {
  const db = await createSessionClient();
  return unwrap(await db.from("settings").select("*").eq("id", 1).single());
}

/* ----------------------------------------------------------- item writes */

async function uniqueSlug(db: Awaited<ReturnType<typeof createSessionClient>>, name: string) {
  const base = slugify(name) || "item";
  const taken = new Set(
    unwrap<{ slug: string }[]>(
      await db.from("menu_items").select("slug").like("slug", `${base}%`),
    ).map((r) => r.slug),
  );
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

async function nextSortOrder(
  db: Awaited<ReturnType<typeof createSessionClient>>,
  category: string,
) {
  const rows = unwrap<{ sort_order: number }[]>(
    await db
      .from("menu_items")
      .select("sort_order")
      .eq("category", category)
      .order("sort_order", { ascending: false })
      .limit(1),
  );
  return (rows[0]?.sort_order ?? 0) + 1;
}

export async function createItem(input: ItemInput): Promise<MenuItem> {
  const db = await createSessionClient();
  const slug = await uniqueSlug(db, input.name);
  const sort_order = await nextSortOrder(db, input.category);
  return unwrap(
    await db.from("menu_items").insert({ ...input, slug, sort_order }).select().single(),
  );
}

export async function updateItem(id: string, input: ItemInput): Promise<MenuItem> {
  const db = await createSessionClient();
  const current = await getItem(id);
  if (!current) throw new Error("Item not found");
  const sort_order =
    current.category === input.category
      ? current.sort_order
      : await nextSortOrder(db, input.category);
  return unwrap(
    await db
      .from("menu_items")
      .update({ ...input, sort_order })
      .eq("id", id)
      .select()
      .single(),
  );
}

export async function deleteItem(id: string): Promise<void> {
  const db = await createSessionClient();
  const { error } = await db.from("menu_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function duplicateItem(id: string): Promise<MenuItem> {
  const item = await getItem(id);
  if (!item) throw new Error("Item not found");
  return createItem({
    name: `${item.name} (copy)`,
    category: item.category,
    description: item.description,
    price: item.price,
    image_url: item.image_url,
    ingredients: item.ingredients,
    tags: item.tags,
    allergens: item.allergens,
    serving_size: item.serving_size,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    fiber: item.fiber,
    sugar: item.sugar,
    is_available: item.is_available,
    is_popular: item.is_popular,
  });
}

export async function setAvailability(id: string, isAvailable: boolean): Promise<void> {
  const db = await createSessionClient();
  const { error } = await db
    .from("menu_items")
    .update({ is_available: isAvailable })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setPrice(id: string, price: number): Promise<void> {
  const db = await createSessionClient();
  const { error } = await db.from("menu_items").update({ price }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Moves an item one step up or down inside its category. */
export async function moveItem(id: string, direction: "up" | "down"): Promise<void> {
  const db = await createSessionClient();
  const item = await getItem(id);
  if (!item) throw new Error("Item not found");
  const siblings = unwrap<{ id: string }[]>(
    await db
      .from("menu_items")
      .select("id")
      .eq("category", item.category)
      .order("sort_order")
      .order("name"),
  );
  await writeOrder(db, "menu_items", reorder(siblings.map((s) => s.id), id, direction));
}

/* ------------------------------------------------------ category writes */

export async function setCategoryVisibility(slug: string, isVisible: boolean): Promise<void> {
  const db = await createSessionClient();
  const { error } = await db.from("categories").update({ is_visible: isVisible }).eq("slug", slug);
  if (error) throw new Error(error.message);
}

export async function moveCategory(id: string, direction: "up" | "down"): Promise<void> {
  const db = await createSessionClient();
  const rows = unwrap<{ id: string }[]>(
    await db.from("categories").select("id").order("sort_order"),
  );
  await writeOrder(db, "categories", reorder(rows.map((r) => r.id), id, direction));
}

function reorder(ids: string[], id: string, direction: "up" | "down"): string[] {
  const from = ids.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= ids.length) return ids;
  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

async function writeOrder(
  db: Awaited<ReturnType<typeof createSessionClient>>,
  table: "menu_items" | "categories",
  ids: string[],
) {
  const results = await Promise.all(
    ids.map((rowId, index) => db.from(table).update({ sort_order: index + 1 }).eq("id", rowId)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}

/* --------------------------------------------------------- settings/CSV */

export async function updateSettings(input: SettingsInput): Promise<void> {
  const db = await createSessionClient();
  const { error } = await db.from("settings").update(input).eq("id", 1);
  if (error) throw new Error(error.message);
}

/** Inserts new items and updates existing ones, matched by slug. */
export async function importItems(
  rows: { slug: string; item: ItemInput }[],
): Promise<{ created: number; updated: number }> {
  const db = await createSessionClient();
  const existing = new Set(
    unwrap<{ slug: string }[]>(await db.from("menu_items").select("slug")).map((r) => r.slug),
  );

  const updates: Record<string, unknown>[] = [];
  const inserts: Record<string, unknown>[] = [];
  const nextOrder = new Map<string, number>();

  for (const { slug, item } of rows) {
    if (slug && existing.has(slug)) {
      updates.push({ ...item, slug });
      continue;
    }
    const base = slug || slugify(item.name) || "item";
    let finalSlug = base;
    for (let n = 2; existing.has(finalSlug); n += 1) finalSlug = `${base}-${n}`;
    existing.add(finalSlug);
    if (!nextOrder.has(item.category)) {
      nextOrder.set(item.category, await nextSortOrder(db, item.category));
    }
    const sort_order = nextOrder.get(item.category)!;
    nextOrder.set(item.category, sort_order + 1);
    inserts.push({ ...item, slug: finalSlug, sort_order });
  }

  if (updates.length) {
    const { error } = await db.from("menu_items").upsert(updates, { onConflict: "slug" });
    if (error) throw new Error(error.message);
  }
  if (inserts.length) {
    const { error } = await db.from("menu_items").insert(inserts);
    if (error) throw new Error(error.message);
  }
  return { created: inserts.length, updated: updates.length };
}
