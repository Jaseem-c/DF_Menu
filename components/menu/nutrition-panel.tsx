import { formatNumber } from "@/lib/format";
import type { MenuItem } from "@/types/menu";

const MACROS = [
  { key: "protein", label: "Protein", bar: "bg-brand-500" },
  { key: "carbs", label: "Carbs", bar: "bg-accent" },
  { key: "fat", label: "Fat", bar: "bg-amber-300" },
  { key: "fiber", label: "Fiber", bar: "bg-brand-400" },
  { key: "sugar", label: "Sugar", bar: "bg-rose-400" },
] as const;

export function hasNutrition(item: MenuItem): boolean {
  return [item.calories, item.protein, item.carbs, item.fat, item.fiber, item.sugar].some(
    (v) => v !== null,
  );
}

export function NutritionPanel({ item }: { item: MenuItem }) {
  const rows = MACROS.filter((m) => item[m.key] !== null);
  const peak = Math.max(1, ...rows.map((m) => item[m.key] ?? 0));

  const split = [item.protein, item.carbs, item.fat];
  const splitTotal = split.reduce<number>((sum, v) => sum + (v ?? 0), 0);
  const showSplit = split.every((v) => v !== null) && splitTotal > 0;

  return (
    <section aria-labelledby="nutrition-heading" className="rounded-2xl bg-sand p-4">
      <div className="flex items-baseline justify-between">
        <h3 id="nutrition-heading" className="font-display text-base font-semibold">
          Nutrition
        </h3>
        <span className="text-xs text-brand-800/70">
          {item.serving_size ? `per ${item.serving_size}` : "per serving"}
        </span>
      </div>

      {item.calories !== null && (
        <p className="mt-2 font-display text-3xl font-semibold">
          {item.calories} <span className="text-base font-medium">kcal</span>
        </p>
      )}

      {showSplit && (
        <div
          className="mt-3 flex h-3 overflow-hidden rounded-full"
          role="img"
          aria-label={`Share of protein, carbs and fat: ${split
            .map((v) => `${Math.round(((v ?? 0) / splitTotal) * 100)}%`)
            .join(", ")}`}
        >
          {MACROS.slice(0, 3).map((m, i) => (
            <div
              key={m.key}
              className={m.bar}
              style={{ width: `${((split[i] ?? 0) / splitTotal) * 100}%` }}
            />
          ))}
        </div>
      )}

      <dl className="mt-3 space-y-2">
        {rows.map((m) => {
          const value = item[m.key] ?? 0;
          return (
            <div key={m.key}>
              <div className="flex justify-between text-sm">
                <dt className="font-semibold">{m.label}</dt>
                <dd>{formatNumber(value)} g</dd>
              </div>
              <div aria-hidden="true" className="mt-1 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className={`h-full rounded-full ${m.bar}`}
                  style={{ width: `${(value / peak) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </dl>

      <p className="mt-3 text-xs text-brand-800/70">Values are approximate estimates.</p>
    </section>
  );
}
