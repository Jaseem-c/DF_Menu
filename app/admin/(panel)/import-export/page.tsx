import { CsvTools } from "@/components/admin/csv-tools";
import { listItems } from "@/lib/menu";

export default async function ImportExportPage() {
  const items = await listItems();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold">Import / Export</h1>
      <CsvTools items={items} />
    </div>
  );
}
