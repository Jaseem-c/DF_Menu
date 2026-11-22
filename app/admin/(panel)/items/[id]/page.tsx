import { notFound } from "next/navigation";
import { ItemForm } from "@/components/admin/item-form";
import { getItem, listCategories } from "@/lib/menu";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditItemPage({ params }: PageProps<"/admin/items/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const [item, categories] = await Promise.all([getItem(id), listCategories()]);
  if (!item) notFound();

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold">Edit {item.name}</h1>
      <ItemForm item={item} categories={categories} />
    </div>
  );
}
