/**
 * Loads data/menu.json into Supabase (categories, settings and items).
 * Safe to re-run: rows are matched on slug / id and updated in place.
 *
 * Usage: npm run seed   (reads .env.local; needs SUPABASE_SERVICE_ROLE_KEY)
 *
 * NOTE: nutrition values in the seed data are estimates and must be verified
 * against IFCT (Indian Food Composition Tables) or USDA FoodData Central
 * before launch. They are currently empty and can be added from /admin.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type SeedFile = {
  settings: Record<string, unknown>;
  categories: Record<string, unknown>[];
  items: Record<string, unknown>[];
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local before seeding.",
    );
  }

  const file = path.join(process.cwd(), "data", "menu.json");
  const seed = JSON.parse(await readFile(file, "utf8")) as SeedFile;

  const db = createClient(url, serviceKey, { auth: { persistSession: false } });

  const steps = [
    {
      label: "settings",
      run: () => db.from("settings").upsert({ id: 1, ...seed.settings }, { onConflict: "id" }),
    },
    {
      label: "categories",
      run: () => db.from("categories").upsert(seed.categories, { onConflict: "slug" }),
    },
    {
      label: "items",
      run: () => db.from("menu_items").upsert(seed.items, { onConflict: "slug" }),
    },
  ];

  for (const step of steps) {
    const { error } = await step.run();
    if (error) throw new Error(`Seeding ${step.label} failed: ${error.message}`);
    console.log(`Seeded ${step.label}`);
  }
  console.log(`Done: ${seed.categories.length} categories, ${seed.items.length} items.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
