import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/menu";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold">Settings</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
