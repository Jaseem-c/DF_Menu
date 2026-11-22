"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deleteItem, duplicateItem, setAvailability, setPrice } from "@/app/admin/actions";
import { useAction } from "@/components/admin/use-action";
import { ItemImage } from "@/components/menu/item-image";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import type { Category, MenuItem } from "@/types/menu";

type Availability = "all" | "available" | "sold-out";

export function ItemsManager({ items, categories }: { items: MenuItem[]; categories: Category[] }) {
  const { run, pending } = useAction();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailabilityFilter] = useState<Availability>("all");
  const [toDelete, setToDelete] = useState<MenuItem | null>(null);

  const categoryOrder = useMemo(
    () => new Map(categories.map((c, i) => [c.slug, i])),
    [categories],
  );
  const categoryName = useMemo(() => new Map(categories.map((c) => [c.slug, c.name])), [categories]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter(
        (i) =>
          (!q || i.name.toLowerCase().includes(q)) &&
          (category === "all" || i.category === category) &&
          (availability === "all" || (availability === "available") === i.is_available),
      )
      .sort(
        (a, b) =>
          (categoryOrder.get(a.category) ?? 0) - (categoryOrder.get(b.category) ?? 0) ||
          a.sort_order - b.sort_order,
      );
  }, [items, query, category, availability, categoryOrder]);

  return (
    <div className="space-y-4">
      <div className="card grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div>
          <label htmlFor="item-search" className="sr-only">
            Search items
          </label>
          <input
            id="item-search"
            type="search"
            className="input"
            placeholder="Search items"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="cat-filter" className="sr-only">
            Category
          </label>
          <select
            id="cat-filter"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="avail-filter" className="sr-only">
            Availability
          </label>
          <select
            id="avail-filter"
            className="input"
            value={availability}
            onChange={(e) => setAvailabilityFilter(e.target.value as Availability)}
          >
            <option value="all">All items</option>
            <option value="available">In stock</option>
            <option value="sold-out">Sold out</option>
          </select>
        </div>
      </div>

      <p aria-live="polite" className="text-sm text-brand-800/80">
        {visible.length} of {items.length} items
      </p>

      <ul className="space-y-2">
        <li
          aria-hidden="true"
          className="hidden grid-cols-[3rem_1fr_9rem_6rem_7rem_13rem] items-center gap-3 px-3 text-xs font-bold tracking-wide text-brand-800/70 uppercase md:grid"
        >
          <span />
          <span>Name</span>
          <span>Category</span>
          <span>Price</span>
          <span>Stock</span>
          <span className="text-right">Actions</span>
        </li>

        {visible.map((item) => (
          <li
            key={item.id}
            className={cn(
              "card grid grid-cols-[3rem_1fr] items-center gap-x-3 gap-y-2 p-3 md:grid-cols-[3rem_1fr_9rem_6rem_7rem_13rem]",
              !item.is_available && "bg-sand",
            )}
          >
            <ItemImage
              imageUrl={item.image_url}
              category={item.category}
              alt=""
              sizes="48px"
              className="size-12 rounded-lg text-xl"
            />
            <div className="min-w-0">
              <Link href={`/admin/items/${item.id}`} className="font-bold hover:underline">
                {item.name}
              </Link>
              <p className="text-xs text-brand-800/70 md:hidden">{categoryName.get(item.category)}</p>
            </div>
            <span className="hidden text-sm md:block">{categoryName.get(item.category)}</span>

            <div className="col-span-2 flex items-center justify-between gap-3 md:contents">
              <PriceCell item={item} />
              <StockSwitch item={item} disabled={pending} onToggle={(next) =>
                run(() => setAvailability(item.id, next), next ? "Marked in stock" : "Marked sold out")
              } />
              <div className="flex justify-end gap-1">
                <Link href={`/admin/items/${item.id}`} className="btn-secondary min-h-10 px-3">
                  Edit
                </Link>
                <button
                  type="button"
                  disabled={pending}
                  className="btn-secondary min-h-10 px-3"
                  onClick={() => run(() => duplicateItem(item.id), "Item duplicated")}
                >
                  Copy
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="btn-secondary min-h-10 px-3 text-red-700"
                  onClick={() => setToDelete(item)}
                  aria-label={`Delete ${item.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="card text-center text-sm">No items match these filters.</p>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this item?"
        message={`“${toDelete?.name ?? ""}” will be removed from the menu. This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) run(() => deleteItem(toDelete.id), "Item deleted");
          setToDelete(null);
        }}
      />
    </div>
  );
}

function StockSwitch({
  item,
  disabled,
  onToggle,
}: {
  item: MenuItem;
  disabled: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={item.is_available}
      aria-label={`${item.name} in stock`}
      disabled={disabled}
      onClick={() => onToggle(!item.is_available)}
      className="flex min-h-11 items-center gap-2 text-sm font-bold disabled:opacity-60"
    >
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          item.is_available ? "bg-brand-600" : "bg-gray-400",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition-all",
            item.is_available ? "left-[1.375rem]" : "left-0.5",
          )}
        />
      </span>
      {item.is_available ? "In stock" : "Sold out"}
    </button>
  );
}

function PriceCell({ item }: { item: MenuItem }) {
  const { run, pending } = useAction();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(item.price));

  function commit() {
    setEditing(false);
    const next = Number(draft);
    if (draft.trim() === "" || !Number.isInteger(next) || next < 0) {
      toast("Enter a whole-rupee price", "error");
      setDraft(String(item.price));
      return;
    }
    if (next !== item.price) run(() => setPrice(item.id, next), "Price updated");
  }

  if (!editing) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setDraft(String(item.price));
          setEditing(true);
        }}
        aria-label={`Edit price of ${item.name}, currently ${formatPrice(item.price)}`}
        className="min-h-11 min-w-16 rounded-lg px-2 text-left font-display text-lg font-semibold underline decoration-dotted underline-offset-4"
      >
        {formatPrice(item.price)}
      </button>
    );
  }

  return (
    <input
      autoFocus
      inputMode="numeric"
      aria-label={`New price for ${item.name}`}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          setDraft(String(item.price));
          setEditing(false);
        }
      }}
      className="input w-24"
    />
  );
}
