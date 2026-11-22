import Papa from "papaparse";
import { csvRowSchema } from "@/lib/validation";
import type { MenuItem } from "@/types/menu";

export const CSV_COLUMNS = [
  "slug",
  "name",
  "category",
  "description",
  "price",
  "image_url",
  "ingredients",
  "tags",
  "allergens",
  "serving_size",
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "sugar",
  "is_available",
  "is_popular",
] as const;

type CsvColumn = (typeof CSV_COLUMNS)[number];
export type RawCsvRow = Record<CsvColumn, string>;

const REQUIRED: CsvColumn[] = ["name", "category", "price"];

/** Lists are written pipe-separated, e.g. `oats|banana|dates`. */
export function itemsToCsv(items: MenuItem[]): string {
  const data = items.map((item) =>
    CSV_COLUMNS.map((col) => {
      const value = item[col];
      if (Array.isArray(value)) return value.join("|");
      return value === null ? "" : String(value);
    }),
  );
  return Papa.unparse({ fields: [...CSV_COLUMNS], data });
}

export type CsvPreviewRow = {
  line: number;
  raw: RawCsvRow;
  error: string | null;
};

export type CsvParseResult = { rows: CsvPreviewRow[]; fatal: string | null };

export function parseCsv(text: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const headers = parsed.meta.fields ?? [];
  const missing = REQUIRED.filter((col) => !headers.includes(col));
  if (missing.length) {
    return { rows: [], fatal: `Missing required column(s): ${missing.join(", ")}` };
  }
  if (parsed.data.length === 0) return { rows: [], fatal: "The file has no rows" };
  if (parsed.data.length > 500) return { rows: [], fatal: "Import at most 500 rows at a time" };

  const seen = new Set<string>();
  const rows = parsed.data.map((record, index): CsvPreviewRow => {
    const raw = Object.fromEntries(
      CSV_COLUMNS.map((col) => [col, (record[col] ?? "").toString()]),
    ) as RawCsvRow;

    const result = csvRowSchema.safeParse(raw);
    let error: string | null = null;
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue.path.length ? `${String(issue.path[issue.path.length - 1])}: ` : "";
      error = `${field}${issue.message}`;
    } else if (raw.slug && seen.has(raw.slug)) {
      error = "slug: Duplicate slug in this file";
    }
    if (raw.slug) seen.add(raw.slug);
    return { line: index + 2, raw, error };
  });

  return { rows, fatal: null };
}
