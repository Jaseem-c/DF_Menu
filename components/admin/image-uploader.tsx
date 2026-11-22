"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { compressImage } from "@/lib/image";

type Props = {
  /** Existing saved image URL, if any. */
  currentUrl: string | null;
  /** Called with the compressed file to upload on save, or null when cleared. */
  onChange: (change: { blob: Blob | null; removed: boolean }) => void;
};

export function ImageUploader({ currentUrl, onChange }: Props) {
  const toast = useToast();
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(
    () => () => {
      if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const blob = await compressImage(file);
      setPreview(URL.createObjectURL(blob));
      setInfo(`${Math.round(blob.size / 1024)} KB, ${blob.type.replace("image/", "").toUpperCase()}`);
      onChange({ blob, removed: false });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not read this image", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-bold">Photo</span>
      <div className="flex items-center gap-3">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-100 text-3xl">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview or an already optimised upload
            <img src={preview} alt="Selected item preview" className="size-full object-cover" />
          ) : (
            <span aria-hidden="true">🍽️</span>
          )}
        </div>
        <div className="space-y-2">
          <label className="btn-secondary cursor-pointer">
            {busy ? "Compressing…" : preview ? "Replace photo" : "Choose photo"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                void handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {preview && (
            <button
              type="button"
              className="block text-sm font-bold text-red-700 underline"
              onClick={() => {
                setPreview(null);
                setInfo(null);
                onChange({ blob: null, removed: true });
              }}
            >
              Remove photo
            </button>
          )}
          <p className="text-xs text-brand-800/70">
            {info ?? "Resized to WebP under 200 KB automatically."}
          </p>
        </div>
      </div>
    </div>
  );
}
