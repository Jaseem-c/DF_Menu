"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useToast } from "@/components/ui/toast";

const QR_OPTIONS = {
  margin: 2,
  errorCorrectionLevel: "M",
  color: { dark: "#033623", light: "#ffffff" },
} as const;

function save(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function isWebUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

export function QrGenerator({ defaultUrl }: { defaultUrl: string }) {
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState(defaultUrl);
  const valid = isWebUrl(url);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !valid) return;
    void QRCode.toCanvas(canvas, url, { ...QR_OPTIONS, width: 320 });
  }, [url, valid]);

  async function downloadPng() {
    const dataUrl = await QRCode.toDataURL(url, { ...QR_OPTIONS, width: 1024 });
    save("diet-factory-menu-qr.png", await (await fetch(dataUrl)).blob());
  }

  async function downloadSvg() {
    const svg = await QRCode.toString(url, { ...QR_OPTIONS, type: "svg" });
    save("diet-factory-menu-qr.svg", new Blob([svg], { type: "image/svg+xml" }));
  }

  return (
    <div className="card space-y-4">
      <div>
        <label htmlFor="qr-url" className="mb-1 block text-sm font-bold">
          Menu address
        </label>
        <input
          id="qr-url"
          type="url"
          className="input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-invalid={!valid}
        />
        <p className="mt-1 text-xs text-brand-800/70">
          Use your final public address (for example your custom domain) before printing.
        </p>
        {!valid && (
          <p role="alert" className="mt-1 text-xs font-semibold text-red-700">
            Enter a full web address starting with https://
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`QR code linking to ${url}`}
          className="rounded-2xl ring-1 ring-sand-dark"
          style={{ width: 240, height: 240, opacity: valid ? 1 : 0.2 }}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-primary"
          disabled={!valid}
          onClick={() => void downloadPng().catch(() => toast("Could not create PNG", "error"))}
        >
          Download PNG
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={!valid}
          onClick={() => void downloadSvg().catch(() => toast("Could not create SVG", "error"))}
        >
          Download SVG
        </button>
      </div>
    </div>
  );
}
