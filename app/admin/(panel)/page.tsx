import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { listCategories, listItems } from "@/lib/menu";

export default async function DashboardPage() {
  const [items, categories] = await Promise.all([listItems(), listCategories()]);
  const available = items.filter((i) => i.is_available).length;
  const recent = [...items]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);

  const stats = [
    { label: "Total items", value: items.length },
    { label: "In stock", value: available },
    { label: "Sold out", value: items.length - available },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Dashboard</h1>

      <dl className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card text-center">
            <dd className="font-display text-3xl font-semibold">{s.value}</dd>
            <dt className="text-xs font-bold text-brand-800/70">{s.label}</dt>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="font-display text-lg font-semibold">Items per category</h2>
          <ul className="mt-3 divide-y divide-sand-dark">
            {categories.map((c) => (
              <li key={c.id} className="flex justify-between py-2 text-sm">
                <span className="font-semibold">
                  {c.name}
                  {!c.is_visible && <span className="ml-2 text-xs text-brand-800/70">(hidden)</span>}
                </span>
                <span>{items.filter((i) => i.category === c.slug).length}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="font-display text-lg font-semibold">Recently updated</h2>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm">No items yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-sand-dark">
              {recent.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link href={`/admin/items/${i.id}`} className="min-w-0 truncate font-semibold hover:underline">
                    {i.name}
                  </Link>
                  <span className="shrink-0">{formatPrice(i.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/items/new" className="btn-primary">
          Add item
        </Link>
        <Link href="/admin/items" className="btn-secondary">
          Manage items
        </Link>
      </div>
    </div>
  );
}
