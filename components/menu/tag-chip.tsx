import { cn } from "@/lib/cn";

const TONES: Record<string, string> = {
  "non-veg": "bg-red-50 text-red-800 ring-red-200",
  veg: "bg-brand-100 text-brand-800 ring-brand-200",
  vegan: "bg-brand-100 text-brand-800 ring-brand-200",
};

export function TagChip({ tag }: { tag: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-1",
        TONES[tag] ?? "bg-sand text-brand-800 ring-sand-dark",
      )}
    >
      {tag.replace(/-/g, " ")}
    </span>
  );
}
