"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CALORIE_LIMITS, HIGH_PROTEIN_GRAMS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import {
  applyFilters,
  DEFAULT_FILTERS,
  hasActiveFilters,
  type MenuFilters,
  type SortKey,
} from "@/lib/filter";
import type { Category, MenuItem } from "@/types/menu";
import { ItemCard } from "./item-card";
import { ItemSheet } from "./item-sheet";

type Props = { categories: Category[]; items: MenuItem[] };

const chip =
  "rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition min-h-9";

export function MenuBrowser({ categories, items }: Props) {
  const [filters, setFilters] = useState<MenuFilters>(DEFAULT_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [active, setActive] = useState<string | null>(categories[0]?.slug ?? null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  const tags = useMemo(() => [...new Set(items.flatMap((i) => i.tags))].sort(), [items]);
  const hasCalories = items.some((i) => i.calories !== null);
  const hasProtein = items.some((i) => i.protein !== null);

  const sections = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          items: applyFilters(
            items.filter((i) => i.category === category.slug),
            filters,
          ),
        }))
        .filter((s) => s.items.length > 0),
    [categories, items, filters],
  );
  const total = sections.reduce((n, s) => n + s.items.length, 0);
  const sectionKey = sections.map((s) => s.category.slug).join(",");

  // Highlight the tab of the section currently under the sticky bar.
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-category]");
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActive((hit.target as HTMLElement).dataset.category ?? null);
      },
      { rootMargin: "-140px 0px -65% 0px" },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [sectionKey]);

  useEffect(() => {
    if (active) {
      tabRefs.current.get(active)?.scrollIntoView({ inline: "center", block: "nearest" });
    }
  }, [active]);

  const update = (patch: Partial<MenuFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const filtersActive = hasActiveFilters(filters);

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-sand-dark bg-cream/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 pt-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <label htmlFor="menu-search" className="sr-only">
                Search the menu
              </label>
              <input
                id="menu-search"
                type="search"
                inputMode="search"
                value={filters.query}
                onChange={(e) => update({ query: e.target.value })}
                placeholder="Search the menu"
                className="h-11 w-full rounded-full border border-sand-dark bg-white px-4 text-base placeholder:text-brand-800/50"
              />
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen((o) => !o)}
              aria-expanded={panelOpen}
              aria-controls="filter-panel"
              className={cn(
                "h-11 shrink-0 rounded-full px-4 text-sm font-bold ring-1",
                panelOpen || filtersActive
                  ? "bg-brand-900 text-cream ring-brand-900"
                  : "bg-white ring-sand-dark",
              )}
            >
              Filters{filtersActive ? " •" : ""}
            </button>
          </div>

          {panelOpen && (
            <div id="filter-panel" className="mt-3 space-y-3 rounded-2xl bg-white p-3 ring-1 ring-sand-dark">
              {tags.length > 0 && (
                <fieldset>
                  <legend className="mb-1.5 text-xs font-bold tracking-wide text-brand-800/70 uppercase">
                    Dietary
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        aria-pressed={filters.tag === tag}
                        onClick={() => update({ tag: filters.tag === tag ? null : tag })}
                        className={cn(
                          chip,
                          "capitalize",
                          filters.tag === tag
                            ? "bg-brand-900 text-cream ring-brand-900"
                            : "bg-white ring-sand-dark",
                        )}
                      >
                        {tag.replace(/-/g, " ")}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {hasProtein && (
                  <button
                    type="button"
                    aria-pressed={filters.highProtein}
                    onClick={() => update({ highProtein: !filters.highProtein })}
                    className={cn(
                      chip,
                      filters.highProtein
                        ? "bg-brand-900 text-cream ring-brand-900"
                        : "bg-white ring-sand-dark",
                    )}
                  >
                    High protein ({HIGH_PROTEIN_GRAMS}g+)
                  </button>
                )}
                {hasCalories && (
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    Under
                    <select
                      value={filters.maxCalories ?? ""}
                      onChange={(e) =>
                        update({ maxCalories: e.target.value ? Number(e.target.value) : null })
                      }
                      className="h-9 rounded-full border border-sand-dark bg-white px-3"
                    >
                      <option value="">Any</option>
                      {CALORIE_LIMITS.map((c) => (
                        <option key={c} value={c}>
                          {c} kcal
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="flex items-center gap-2 text-sm font-semibold">
                  Sort
                  <select
                    value={filters.sort}
                    onChange={(e) => update({ sort: e.target.value as SortKey })}
                    className="h-9 rounded-full border border-sand-dark bg-white px-3"
                  >
                    <option value="menu">Menu order</option>
                    <option value="price-asc">Price: low to high</option>
                    <option value="price-desc">Price: high to low</option>
                    {hasCalories && <option value="calories-asc">Calories: low to high</option>}
                    {hasProtein && <option value="protein-desc">Protein: high to low</option>}
                  </select>
                </label>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="text-sm font-bold text-brand-600 underline"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          <nav aria-label="Menu categories" className="-mx-4 mt-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
            <ul className="flex w-max gap-2">
              {sections.map(({ category }) => (
                <li key={category.slug}>
                  <button
                    type="button"
                    ref={(node) => {
                      if (node) tabRefs.current.set(category.slug, node);
                      else tabRefs.current.delete(category.slug);
                    }}
                    aria-current={active === category.slug ? "true" : undefined}
                    onClick={() => {
                      setActive(category.slug);
                      document
                        .getElementById(`cat-${category.slug}`)
                        ?.scrollIntoView({ block: "start" });
                    }}
                    className={cn(
                      "min-h-10 rounded-full px-4 text-sm font-bold whitespace-nowrap",
                      active === category.slug
                        ? "bg-brand-900 text-cream"
                        : "bg-white ring-1 ring-sand-dark",
                    )}
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 pb-10">
        <p aria-live="polite" className="sr-only">
          {total} {total === 1 ? "item" : "items"} shown
        </p>

        {sections.map(({ category, items: list }) => (
          <section
            key={category.slug}
            id={`cat-${category.slug}`}
            data-category={category.slug}
            aria-labelledby={`h-${category.slug}`}
            className="scroll-mt-36 pt-6"
          >
            <h2 id={`h-${category.slug}`} className="mb-3 font-display text-2xl font-semibold">
              {category.name}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {list.map((item) => (
                <li key={item.id} className="flex">
                  <ItemCard item={item} onSelect={setSelected} />
                </li>
              ))}
            </ul>
          </section>
        ))}

        {total === 0 && (
          <div className="mt-10 rounded-2xl bg-white p-6 text-center ring-1 ring-sand-dark">
            <p className="font-display text-lg font-semibold">Nothing matches your search</p>
            <p className="mt-1 text-sm text-brand-800/80">Try a different word or clear the filters.</p>
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-4 rounded-full bg-brand-900 px-5 py-2 text-sm font-bold text-cream"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      <ItemSheet item={selected} onClose={() => setSelected(null)} />
    </>
  );
}
