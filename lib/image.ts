import { IMAGE_MAX_DIMENSION, IMAGE_TARGET_BYTES } from "@/lib/constants";

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (webp) => {
        if (webp?.type === "image/webp") return resolve(webp);
        // Browsers without WebP encoding fall back to JPEG.
        canvas.toBlob((jpeg) => resolve(jpeg), "image/jpeg", quality);
      },
      "image/webp",
      quality,
    );
  });
}

/** Resizes and re-encodes a photo (WebP where supported) to stay under ~200 KB. */
export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  const bitmap = await createImageBitmap(file);
  let scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45]) {
      const blob = await encode(canvas, quality);
      if (blob && blob.size <= IMAGE_TARGET_BYTES) {
        bitmap.close();
        return blob;
      }
    }
    scale *= 0.8;
  }
  bitmap.close();
  throw new Error("Could not shrink this image enough. Try a different photo.");
}
