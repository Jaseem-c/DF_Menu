"use client";

import { moveCategory, moveItem, setCategoryVisibility } from "@/app/admin/actions";
import { useAction } from "@/components/admin/use-action";
import { cn } from "@/lib/cn";
import type { Category, MenuItem } from "@/types/menu";

function MoveButtons({
  label,
  index,
  count,
  disabled,
  onMove,
}: {
  label: string;
  index: number;
  count: number;
  disabled: boolean;
  onMove: (direction: "up" | "down") => void;
}) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        className="btn-secondary min-h-10 min-w-10 px-0"
        aria-label={`Move ${label} up`}
        disabled={disabled || index === 0}
        onClick={() => onMove("up")}
      >
        ↑
      </button>
      <button
        type="button"
        className="btn-secondary min-h-10 min-w-10 px-0"
        aria-label={`Move ${label} down`}
        disabled={disabled || index === count - 1}
        onClick={() => onMove("down")}
      >
        ↓
      </button>
    </div>
  );
}

export function CategoryManager({
  categories,
  items,
}: {
  categories: Category[];
  items: MenuItem[];
}) {
  const { run, pending } = useAction();

  return (
    <ul className="space-y-3">
      {categories.map((category, index) => {
        const list = items
          .filter((i) => i.category === category.slug)
          .sort((a, b) => a.sort_order - b.sort_order);
        return (
          <li key={category.id} className={cn("card", !category.is_visible && "bg-sand")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">{category.name}</h2>
                <p className="text-xs text-brand-800/70">
                  {list.length} items · {category.is_visible ? "Visible on menu" : "Hidden from menu"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={pending}
                  className="btn-secondary min-h-10"
                  aria-pressed={category.is_visible}
                  onClick={() =>
                    run(
                      () => setCategoryVisibility(category.slug, !category.is_visible),
                      category.is_visible ? "Category hidden" : "Category visible",
                    )
                  }
                >
                  {category.is_visible ? "Hide" : "Show"}
                </button>
                <MoveButtons
                  label={category.name}
                  index={index}
                  count={categories.length}
                  disabled={pending}
                  onMove={(dir) => run(() => moveCategory(category.id, dir), "Category order saved")}
                />
              </div>
            </div>

            {list.length > 0 && (
              <details className="mt-3">
                <summary className="min-h-10 cursor-pointer py-2 text-sm font-bold text-brand-700">
                  Reorder items
                </summary>
                <ol className="mt-1 divide-y divide-sand-dark">
                  {list.map((item, i) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0 truncate text-sm font-semibold">
                        {i + 1}. {item.name}
                      </span>
                      <MoveButtons
                        label={item.name}
                        index={i}
                        count={list.length}
                        disabled={pending}
                        onMove={(dir) => run(() => moveItem(item.id, dir), "Item order saved")}
                      />
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </li>
        );
      })}
    </ul>
  );
}
