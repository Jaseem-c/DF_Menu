import Link from "next/link";
import { ItemsManager } from "@/components/admin/items-manager";
import { listCategories, listItems } from "@/lib/menu";

export default async function ItemsPage() {
  const [items, categories] = await Promise.all([listItems(), listCategories()]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Items</h1>
        <Link href="/admin/items/new" className="btn-primary">
          Add item
        </Link>
      </div>
      <ItemsManager items={items} categories={categories} />
    </div>
  );
}
