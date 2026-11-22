import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/types/menu";
import { ItemImage } from "./item-image";
import { TagChip } from "./tag-chip";

type Props = { item: MenuItem; onSelect: (item: MenuItem) => void };

export function ItemCard({ item, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-label={`${item.name}, ${formatPrice(item.price)}${item.is_available ? "" : ", sold out"}. Show details`}
      className={cn(
        "flex w-full gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-sand-dark/70 transition active:scale-[0.99]",
        !item.is_available && "opacity-60 grayscale",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="font-display text-base leading-snug font-semibold">{item.name}</h3>
          {item.is_popular && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-amber-800">
              ★ Signature
            </span>
          )}
        </div>

        {item.description && (
          <p className="mt-1 line-clamp-2 text-sm text-brand-800/80">{item.description}</p>
        )}

        {(item.tags.length > 0 || item.calories !== null) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
            {item.calories !== null && (
              <span className="rounded-full bg-brand-900 px-2 py-0.5 text-xs font-semibold text-cream">
                {item.calories} kcal
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-2">
          <span className="font-display text-lg font-semibold">{formatPrice(item.price)}</span>
          {!item.is_available && (
            <span className="rounded-full bg-sand-dark px-2 py-0.5 text-xs font-bold text-brand-900">
              Sold out
            </span>
          )}
        </div>
      </div>

      <ItemImage
        imageUrl={item.image_url}
        category={item.category}
        alt=""
        sizes="96px"
        className="size-20 shrink-0 self-start rounded-xl sm:size-24"
      />
    </button>
  );
}
