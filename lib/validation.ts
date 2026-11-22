import { z } from "zod";
import { IMAGE_BUCKET } from "@/lib/constants";
import { CATEGORY_SLUGS } from "@/types/menu";

const list = z
  .array(z.string().trim().min(1, "Empty value").max(60, "Too long"))
  .max(30, "Too many entries");

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Max ${max} characters`)
    .nullable()
    .transform((v) => (v ? v : null));

const macro = z.number().min(0, "Must be 0 or more").max(1000, "Too large").nullable();

function isOwnImageUrl(value: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  return value.startsWith(`${base}/storage/v1/object/public/${IMAGE_BUCKET}/`);
}

export const itemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Max 120 characters"),
  category: z.enum(CATEGORY_SLUGS, { error: "Pick a category" }),
  description: nullableText(500),
  price: z
    .number({ error: "Price is required" })
    .int("Use whole rupees")
    .min(0, "Price cannot be negative")
    .max(100000, "Price is too high"),
  image_url: z
    .string()
    .nullable()
    .refine((v) => v === null || isOwnImageUrl(v), "Image must be uploaded here"),
  ingredients: list,
  tags: list,
  allergens: list,
  serving_size: nullableText(60),
  calories: z.number().int("Use a whole number").min(0).max(5000, "Too large").nullable(),
  protein: macro,
  carbs: macro,
  fat: macro,
  fiber: macro,
  sugar: macro,
  is_available: z.boolean(),
  is_popular: z.boolean(),
});

export type ItemInput = z.infer<typeof itemSchema>;

export const settingsSchema = z
  .object({
    business_name: z.string().trim().min(1, "Business name is required").max(80),
    phone: z
      .string()
      .trim()
      .regex(/^[+\d\s()-]{6,20}$/, "Enter a valid phone number")
      .nullable()
      .or(z.literal("").transform(() => null)),
    whatsapp_number: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s+()-]/g, ""))
      .pipe(z.string().regex(/^\d{8,15}$/, "Digits only, with country code, e.g. 916362248157"))
      .nullable()
      .or(z.literal("").transform(() => null)),
    announcement_text: nullableText(200),
    announcement_enabled: z.boolean(),
  })
  .refine((v) => !v.announcement_enabled || v.announcement_text, {
    path: ["announcement_text"],
    message: "Add banner text before turning it on",
  });

export type SettingsInput = z.infer<typeof settingsSchema>;

/** One CSV row after parsing. Arrays are pipe-separated in the file. */
const csvBoolean = (whenBlank: boolean) =>
  z
    .string()
    .trim()
    .toLowerCase()
    .transform((v, ctx) => {
      if (v === "") return whenBlank;
      if (["true", "yes", "1"].includes(v)) return true;
      if (["false", "no", "0"].includes(v)) return false;
      ctx.addIssue({ code: "custom", message: "Use true or false" });
      return z.NEVER;
    });

const csvNumber = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: "custom", message: "Not a number" });
      return z.NEVER;
    }
    return n;
  });

const csvList = z
  .string()
  .transform((v) => v.split("|").map((s) => s.trim()).filter(Boolean));

const csvRawSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Invalid slug").or(z.literal("")),
  name: z.string(),
  category: z.string().trim(),
  description: z.string(),
  price: csvNumber,
  image_url: z.string().trim(),
  ingredients: csvList,
  tags: csvList,
  allergens: csvList,
  serving_size: z.string(),
  calories: csvNumber,
  protein: csvNumber,
  carbs: csvNumber,
  fat: csvNumber,
  fiber: csvNumber,
  sugar: csvNumber,
  is_available: csvBoolean(true),
  is_popular: csvBoolean(false),
});

/** Parses one CSV record (all strings) into `{ slug, item }` or reports issues. */
export const csvRowSchema = csvRawSchema.transform((row, ctx) => {
  const { slug, ...rest } = row;
  const parsed = itemSchema.safeParse({ ...rest, image_url: rest.image_url || null });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      ctx.addIssue({ code: "custom", message: issue.message, path: issue.path });
    }
    return z.NEVER;
  }
  return { slug, item: parsed.data };
});

export type CsvRow = z.output<typeof csvRowSchema>;
