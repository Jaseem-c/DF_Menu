"use client";

import { useEffect, useRef } from "react";
import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/types/menu";
import { ItemImage } from "./item-image";
import { hasNutrition, NutritionPanel } from "./nutrition-panel";
import { TagChip } from "./tag-chip";

type Props = { item: MenuItem | null; onClose: () => void };

/** Item detail as a bottom sheet on phones and a centred card on larger screens. */
export function ItemSheet({ item, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (item && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    }
    if (!item && dialog.open) dialog.close();
    return () => {
      document.body.style.overflow = "";
    };
  }, [item]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="sheet-title"
      className="sheet mt-auto mb-0 max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-cream p-0 text-brand-900 backdrop:bg-black/50 sm:m-auto sm:max-w-lg sm:rounded-3xl"
    >
      {item && (
        <div>
          <div className="relative">
            <ItemImage
              imageUrl={item.image_url}
              category={item.category}
              alt={item.name}
              sizes="(min-width: 640px) 512px, 100vw"
              className="h-48 w-full sm:h-56"
              priority
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-white/90 text-xl font-bold shadow"
            >
              ×
            </button>
          </div>

          <div className="space-y-4 p-4 pb-6">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h2 id="sheet-title" className="font-display text-2xl leading-tight font-semibold">
                  {item.name}
                </h2>
                <p className="font-display text-2xl font-semibold">{formatPrice(item.price)}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.is_popular && (
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-amber-800">
                    ★ Signature
                  </span>
                )}
                {!item.is_available && (
                  <span className="rounded-full bg-sand-dark px-2 py-0.5 text-xs font-bold">
                    Sold out
                  </span>
                )}
                {item.tags.map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>
              {item.description && <p className="mt-3 text-brand-800/90">{item.description}</p>}
            </div>

            {item.ingredients.length > 0 && (
              <section aria-labelledby="ingredients-heading">
                <h3 id="ingredients-heading" className="font-display text-base font-semibold">
                  Ingredients
                </h3>
                <p className="mt-1 text-brand-800/90">{item.ingredients.join(", ")}</p>
              </section>
            )}

            {item.allergens.length > 0 && (
              <section
                aria-labelledby="allergens-heading"
                className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200"
              >
                <h3 id="allergens-heading" className="font-display text-base font-semibold">
                  Allergens
                </h3>
                <p className="mt-1 text-sm capitalize">{item.allergens.join(", ")}</p>
              </section>
            )}

            {item.serving_size && !hasNutrition(item) && (
              <p className="text-sm text-brand-800/80">Serving size: {item.serving_size}</p>
            )}

            {hasNutrition(item) && <NutritionPanel item={item} />}
          </div>
        </div>
      )}
    </dialog>
  );
}
