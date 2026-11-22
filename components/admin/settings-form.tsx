"use client";

import { useState, useTransition, type FormEvent } from "react";
import { saveSettings } from "@/app/admin/actions";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { settingsSchema } from "@/lib/validation";
import type { Settings } from "@/types/menu";

export function SettingsForm({ settings }: { settings: Settings }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState({
    business_name: settings.business_name,
    phone: settings.phone ?? "",
    whatsapp_number: settings.whatsapp_number ?? "",
    announcement_text: settings.announcement_text ?? "",
    announcement_enabled: settings.announcement_enabled,
  });

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = settingsSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await saveSettings(parsed.data);
      toast(result.ok ? "Settings saved" : result.error, result.ok ? "success" : "error");
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <section className="card space-y-4">
        <h2 className="font-display text-lg font-semibold">Business</h2>
        <Field id="business_name" label="Business name" error={errors.business_name}>
          <input
            id="business_name"
            className="input"
            value={values.business_name}
            onChange={(e) => set("business_name", e.target.value)}
            aria-invalid={Boolean(errors.business_name)}
          />
        </Field>
        <Field id="phone" label="Phone number" error={errors.phone}>
          <input
            id="phone"
            type="tel"
            className="input"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            aria-invalid={Boolean(errors.phone)}
          />
        </Field>
        <Field
          id="whatsapp_number"
          label="WhatsApp number"
          error={errors.whatsapp_number}
          hint="With country code, e.g. 916362248157. Used for the Order on WhatsApp button."
        >
          <input
            id="whatsapp_number"
            type="tel"
            className="input"
            value={values.whatsapp_number}
            onChange={(e) => set("whatsapp_number", e.target.value)}
            aria-invalid={Boolean(errors.whatsapp_number)}
          />
        </Field>
      </section>

      <section className="card space-y-4">
        <h2 className="font-display text-lg font-semibold">Announcement banner</h2>
        <Field
          id="announcement_text"
          label="Banner text"
          error={errors.announcement_text}
          hint="Shown at the top of the menu, for example a festival closing notice."
        >
          <textarea
            id="announcement_text"
            className="input"
            rows={2}
            value={values.announcement_text}
            onChange={(e) => set("announcement_text", e.target.value)}
            aria-invalid={Boolean(errors.announcement_text)}
          />
        </Field>
        <label className="flex min-h-11 items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            className="size-5 accent-brand-700"
            checked={values.announcement_enabled}
            onChange={(e) => set("announcement_enabled", e.target.checked)}
          />
          Show the banner on the menu
        </label>
      </section>

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
