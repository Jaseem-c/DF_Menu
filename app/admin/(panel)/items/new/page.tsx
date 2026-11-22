import { ItemForm } from "@/components/admin/item-form";
import { listCategories } from "@/lib/menu";

export default async function NewItemPage() {
  const categories = await listCategories();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold">Add item</h1>
      <ItemForm categories={categories} />
    </div>
  );
}
