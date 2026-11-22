"use client";

import { useState } from "react";
import { importCsvRows } from "@/app/admin/actions";
import { useAction } from "@/components/admin/use-action";
import { useToast } from "@/components/ui/toast";
import { itemsToCsv, parseCsv, type CsvParseResult } from "@/lib/csv";
import type { MenuItem } from "@/types/menu";

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function CsvTools({ items }: { items: MenuItem[] }) {
  const toast = useToast();
  const { run, pending } = useAction();
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<CsvParseResult | null>(null);

  const errorCount = result?.rows.filter((r) => r.error).length ?? 0;
  const canImport = result !== null && !result.fatal && result.rows.length > 0 && errorCount === 0;

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast("CSV files must be under 1 MB", "error");
      return;
    }
    setFileName(file.name);
    setResult(parseCsv(await file.text()));
  }

  return (
    <div className="space-y-5">
      <section className="card space-y-3">
        <h2 className="font-display text-lg font-semibold">Export</h2>
        <p className="text-sm">
          Download every item as a CSV. Lists (ingredients, tags, allergens) are separated with a
          pipe, like <code>oats|banana|dates</code>.
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={() =>
            download(
              `diet-factory-menu-${new Date().toISOString().slice(0, 10)}.csv`,
              itemsToCsv(items),
              "text/csv;charset=utf-8",
            )
          }
        >
          Download menu CSV
        </button>
      </section>

      <section className="card space-y-3">
        <h2 className="font-display text-lg font-semibold">Import</h2>
        <p className="text-sm">
          Use an exported file as the template. Rows whose <code>slug</code> matches an existing
          item update it; other rows are added as new items. Nothing is saved until you confirm.
        </p>
        <label className="btn-secondary cursor-pointer">
          Choose CSV file
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {fileName && <p className="text-sm font-semibold">{fileName}</p>}

        {result?.fatal && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">
            {result.fatal}
          </p>
        )}

        {result && !result.fatal && (
          <>
            <p role="status" className="text-sm font-bold">
              {result.rows.length} rows, {errorCount === 0 ? "no errors" : `${errorCount} with errors`}
            </p>
            <div className="max-h-96 overflow-auto rounded-xl ring-1 ring-sand-dark">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="sticky top-0 bg-sand text-xs uppercase">
                  <tr>
                    <th className="p-2">Line</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr key={row.line} className={row.error ? "bg-red-50" : undefined}>
                      <td className="p-2">{row.line}</td>
                      <td className="p-2">{row.raw.name}</td>
                      <td className="p-2">{row.raw.category}</td>
                      <td className="p-2">{row.raw.price}</td>
                      <td className="p-2 font-semibold">
                        {row.error ? (
                          <span className="text-red-800">{row.error}</span>
                        ) : (
                          <span className="text-brand-700">
                            {row.raw.slug && items.some((i) => i.slug === row.raw.slug) ? "Update" : "New"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={!canImport || pending}
              onClick={() =>
                run(
                  () => importCsvRows(result.rows.map((r) => r.raw)),
                  "Import complete",
                  () => {
                    setResult(null);
                    setFileName(null);
                  },
                )
              }
            >
              {pending ? "Importing…" : `Import ${result.rows.length} rows`}
            </button>
            {errorCount > 0 && (
              <p className="text-sm text-red-800">Fix the highlighted rows and choose the file again.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
