import { headers } from "next/headers";
import { QrGenerator } from "@/components/admin/qr-generator";

export default async function QrPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const defaultUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}/`;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold">QR code</h1>
      <QrGenerator defaultUrl={defaultUrl} />
    </div>
  );
}
