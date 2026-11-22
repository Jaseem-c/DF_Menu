import type { Settings } from "@/types/menu";

export function AnnouncementBanner({ settings }: { settings: Settings }) {
  if (!settings.announcement_enabled || !settings.announcement_text) return null;
  return (
    <div role="status" className="bg-accent text-brand-900">
      <p className="mx-auto max-w-3xl px-4 py-2 text-center text-sm font-bold">
        {settings.announcement_text}
      </p>
    </div>
  );
}
