"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { IMAGE_BUCKET, IMAGE_MAX_BYTES } from "@/lib/constants";
import * as menu from "@/lib/menu";
import { createSessionClient } from "@/lib/supabase/server";
import { csvRowSchema, itemSchema, settingsSchema } from "@/lib/validation";
import type { ActionResult } from "@/types/menu";
import { z } from "zod";

/**
 * Every action re-checks the admin role, validates its input on the server and
 * expires the `menu` cache tag so the public menu updates immediately.
 */

async function run<T extends object>(
  work: () => Promise<T>,
  { publish = true }: { publish?: boolean } = {},
): Promise<ActionResult<T>> {
  try {
    await requireAdmin();
    const result = await work();
    if (publish) updateTag(menu.MENU_TAG);
    return { ok: true, ...result };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: firstIssue(e) };
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  const field = issue.path.length ? `${issue.path.join(".")}: ` : "";
  return `${field}${issue.message}`;
}

const idSchema = z.uuid();
const directionSchema = z.enum(["up", "down"]);

/* ---------------------------------------------------------------- items */

export async function saveItem(id: string | null, input: unknown) {
  return run(async () => {
    const parsed = itemSchema.safeParse(input);
    if (!parsed.success) throw new Error(firstIssue(parsed.error));
    const item = id
      ? await menu.updateItem(idSchema.parse(id), parsed.data)
      : await menu.createItem(parsed.data);
    return { id: item.id };
  });
}

export async function deleteItem(id: string) {
  return run(async () => {
    await menu.deleteItem(idSchema.parse(id));
    return {};
  });
}

export async function duplicateItem(id: string) {
  return run(async () => {
    const copy = await menu.duplicateItem(idSchema.parse(id));
    return { id: copy.id };
  });
}

export async function setAvailability(id: string, isAvailable: boolean) {
  return run(async () => {
    await menu.setAvailability(idSchema.parse(id), z.boolean().parse(isAvailable));
    return {};
  });
}

export async function setPrice(id: string, price: number) {
  return run(async () => {
    const value = itemSchema.shape.price.parse(price);
    await menu.setPrice(idSchema.parse(id), value);
    return {};
  });
}

export async function moveItem(id: string, direction: "up" | "down") {
  return run(async () => {
    await menu.moveItem(idSchema.parse(id), directionSchema.parse(direction));
    return {};
  });
}

/* ----------------------------------------------------------- categories */

export async function setCategoryVisibility(slug: string, isVisible: boolean) {
  return run(async () => {
    await menu.setCategoryVisibility(
      itemSchema.shape.category.parse(slug),
      z.boolean().parse(isVisible),
    );
    return {};
  });
}

export async function moveCategory(id: string, direction: "up" | "down") {
  return run(async () => {
    await menu.moveCategory(idSchema.parse(id), directionSchema.parse(direction));
    return {};
  });
}

/* ------------------------------------------------------------- settings */

export async function saveSettings(input: unknown) {
  return run(async () => {
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) throw new Error(firstIssue(parsed.error));
    await menu.updateSettings(parsed.data);
    return {};
  });
}

/* ------------------------------------------------------------------ CSV */

export async function importCsvRows(rows: unknown) {
  return run(async () => {
    const raw = z.array(z.record(z.string(), z.string())).min(1).max(500).parse(rows);
    const valid = raw.map((row, index) => {
      const parsed = csvRowSchema.safeParse(row);
      if (!parsed.success) throw new Error(`Row ${index + 1}: ${firstIssue(parsed.error)}`);
      return parsed.data;
    });
    return menu.importItems(valid);
  });
}

/* --------------------------------------------------------------- images */

function sniffImageType(bytes: Uint8Array): "webp" | "jpeg" | "png" | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (ascii(1, 4) === "PNG") return "png";
  return null;
}

export async function uploadImage(formData: FormData) {
  return run(
    async () => {
      const file = formData.get("file");
      if (!(file instanceof File)) throw new Error("No image received");
      if (file.size === 0 || file.size > IMAGE_MAX_BYTES) {
        throw new Error("Image must be under 300 KB. Try a smaller photo.");
      }
      const type = sniffImageType(new Uint8Array(await file.arrayBuffer()));
      if (!type) throw new Error("Only WebP, JPEG or PNG images are allowed");

      const db = await createSessionClient();
      const path = `items/${crypto.randomUUID()}.${type === "jpeg" ? "jpg" : type}`;
      const { error } = await db.storage
        .from(IMAGE_BUCKET)
        .upload(path, file, { contentType: `image/${type}`, cacheControl: "31536000" });
      if (error) throw new Error(error.message);
      return { url: db.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl };
    },
    { publish: false },
  );
}
