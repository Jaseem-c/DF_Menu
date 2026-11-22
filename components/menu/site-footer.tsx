import { telLink, whatsappLink } from "@/lib/format";
import type { Settings } from "@/types/menu";

export function SiteFooter({ settings }: { settings: Settings }) {
  const { business_name: name, phone, whatsapp_number: whatsapp } = settings;
  return (
    <footer className="bg-brand-900 text-cream">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-8 text-center">
        <p className="font-display text-xl font-semibold">{name}</p>
        <p className="text-sm text-cream/80">Prices in INR. Ask our team about allergens.</p>
        <div className="flex flex-wrap justify-center gap-2">
          {whatsapp && (
            <a
              href={whatsappLink(whatsapp)}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-brand-900"
            >
              Order on WhatsApp
            </a>
          )}
          {phone && (
            <a
              href={telLink(phone)}
              className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold ring-1 ring-white/30"
            >
              Call {phone}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
