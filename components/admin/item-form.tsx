"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { saveItem, uploadImage } from "@/app/admin/actions";
import { ImageUploader } from "@/components/admin/image-uploader";
import { TagInput } from "@/components/admin/tag-input";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { COMMON_ALLERGENS, SUGGESTED_TAGS } from "@/lib/constants";
import { itemSchema } from "@/lib/validation";
import type { Category, MenuItem, NutritionKey } from "@/types/menu";

type Props = { item?: MenuItem; categories: Category[] };

const NUTRITION_FIELDS: { key: NutritionKey; label: string; unit: string }[] = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
  { key: "sugar", label: "Sugar", unit: "g" },
];

const toText = (value: number | null | undefined) => (value == null ? "" : String(value));

/** Blank means "not set"; anything else must be a number (validated by the schema). */
function toNumber(text: string): number | null {
  const trimmed = text.trim();
  return trimmed === "" ? null : Number(trimmed);
}

export function ItemForm({ item, categories }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState<string>(item?.category ?? categories[0]?.slug ?? "");
  const [price, setPrice] = useState(toText(item?.price));
  const [description, setDescription] = useState(item?.description ?? "");
  const [servingSize, setServingSize] = useState(item?.serving_size ?? "");
  const [ingredients, setIngredients] = useState(item?.ingredients ?? []);
  const [tags, setTags] = useState(item?.tags ?? []);
  const [allergens, setAllergens] = useState(item?.allergens ?? []);
  const [nutrition, setNutrition] = useState<Record<NutritionKey, string>>({
    calories: toText(item?.calories),
    protein: toText(item?.protein),
    carbs: toText(item?.carbs),
    fat: toText(item?.fat),
    fiber: toText(item?.fiber),
    sugar: toText(item?.sugar),
  });
  const [isPopular, setIsPopular] = useState(item?.is_popular ?? false);
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true);
  const [image, setImage] = useState<{ blob: Blob | null; removed: boolean }>({
    blob: null,
    removed: false,
  });

  const describe = (field: string) => (errors[field] ? `${field}-error` : undefined);

  function onSubmit(event: FormEvent) {
    event.preventDefault();

    startTransition(async () => {
      let imageUrl = image.removed ? null : (item?.image_url ?? null);

      if (image.blob) {
        const body = new FormData();
        body.set("file", new File([image.blob], "photo", { type: image.blob.type }));
        const uploaded = await uploadImage(body);
        if (!uploaded.ok) {
          toast(uploaded.error, "error");
          return;
        }
        imageUrl = uploaded.url;
      }

      const candidate = {
        name,
        category,
        description,
        price: price.trim() === "" ? Number.NaN : Number(price),
        image_url: imageUrl,
        ingredients,
        tags,
        allergens,
        serving_size: servingSize,
        calories: toNumber(nutrition.calories),
        protein: toNumber(nutrition.protein),
        carbs: toNumber(nutrition.carbs),
        fat: toNumber(nutrition.fat),
        fiber: toNumber(nutrition.fiber),
        sugar: toNumber(nutrition.sugar),
        is_available: isAvailable,
        is_popular: isPopular,
      };

      const parsed = itemSchema.safeParse(candidate);
      if (!parsed.success) {
        const next: Record<string, string> = {};
        for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
        setErrors(next);
        toast("Please fix the highlighted fields", "error");
        return;
      }
      setErrors({});

      const result = await saveItem(item?.id ?? null, parsed.data);
      if (!result.ok) {
        toast(result.error, "error");
        return;
      }
      toast(item ? "Item updated" : "Item added");
      router.push("/admin/items");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <section className="card space-y-4">
        <h2 className="font-display text-lg font-semibold">Basics</h2>
        <Field id="name" label="Name" error={errors.name}>
          <input
            id="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describe("name")}
            autoComplete="off"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="category" label="Category" error={errors.category}>
            <select
              id="category"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-invalid={Boolean(errors.category)}
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field id="price" label="Price (₹)" error={errors.price}>
            <input
              id="price"
              className="input"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-invalid={Boolean(errors.price)}
              aria-describedby={describe("price")}
            />
          </Field>
        </div>
        <Field id="description" label="Short description" error={errors.description}>
          <textarea
            id="description"
            className="input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describe("description")}
          />
        </Field>
        <Field id="serving" label="Serving size" error={errors.serving_size} hint="For example: 300 ml or 1 bowl">
          <input
            id="serving"
            className="input"
            value={servingSize}
            onChange={(e) => setServingSize(e.target.value)}
            aria-invalid={Boolean(errors.serving_size)}
          />
        </Field>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <label className="flex min-h-11 items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              className="size-5 accent-brand-700"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
            In stock
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              className="size-5 accent-brand-700"
              checked={isPopular}
              onChange={(e) => setIsPopular(e.target.checked)}
            />
            Signature / popular item
          </label>
        </div>
      </section>

      <section className="card">
        <ImageUploader currentUrl={item?.image_url ?? null} onChange={setImage} />
      </section>

      <section className="card space-y-4">
        <h2 className="font-display text-lg font-semibold">Ingredients, tags and allergens</h2>
        <TagInput
          id="ingredients"
          label="Ingredients"
          values={ingredients}
          onChange={setIngredients}
          hint="Press Enter after each ingredient."
        />
        <TagInput
          id="tags"
          label="Dietary tags"
          values={tags}
          onChange={setTags}
          suggestions={SUGGESTED_TAGS}
          hint="Shown on cards and used by the menu filters."
        />
        <TagInput
          id="allergens"
          label="Allergens"
          values={allergens}
          onChange={setAllergens}
          suggestions={COMMON_ALLERGENS}
          hint="Leave empty only if you have confirmed the item has none."
        />
        {errors.ingredients || errors.tags || errors.allergens ? (
          <p role="alert" className="text-xs font-semibold text-red-700">
            {errors.ingredients ?? errors.tags ?? errors.allergens}
          </p>
        ) : null}
      </section>

      <section className="card">
        <h2 className="font-display text-lg font-semibold">Nutrition (optional)</h2>
        <p className="mt-1 text-sm text-brand-800/80">
          Leave blank until known. Values are estimates: verify against IFCT or USDA FoodData Central
          before publishing.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {NUTRITION_FIELDS.map(({ key, label, unit }) => (
            <Field key={key} id={key} label={`${label} (${unit})`} error={errors[key]}>
              <input
                id={key}
                className="input"
                inputMode="decimal"
                value={nutrition[key]}
                onChange={(e) => setNutrition((n) => ({ ...n, [key]: e.target.value }))}
                aria-invalid={Boolean(errors[key])}
                aria-describedby={describe(key)}
              />
            </Field>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : item ? "Save changes" : "Add item"}
        </button>
        <Link href="/admin/items" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
