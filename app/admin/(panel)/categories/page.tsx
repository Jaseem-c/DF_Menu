import { CategoryManager } from "@/components/admin/category-manager";
import { listCategories, listItems } from "@/lib/menu";

export default async function CategoriesPage() {
  const [categories, items] = await Promise.all([listCategories(), listItems()]);
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold">Categories</h1>
      <p className="text-sm">
        Hide a category to remove it from the public menu, and use the arrows to change the order
        customers see.
      </p>
      <CategoryManager categories={categories} items={items} />
    </div>
  );
}
