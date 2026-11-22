import Image from "next/image";
import { BRAND_PROMISES } from "@/lib/constants";
import type { Settings } from "@/types/menu";

export function SiteHeader({ settings }: { settings: Settings }) {
  return (
    <header className="bg-brand-900 text-cream">
      <div className="mx-auto max-w-3xl px-4 pt-4 pb-5">
        <Image
          src="/logo.webp"
          alt={`${settings.business_name}: where health meets wellness`}
          width={1200}
          height={724}
          priority
          className="mx-auto h-auto w-52 sm:w-64"
        />
        <ul className="mt-3 flex flex-wrap justify-center gap-2">
          {BRAND_PROMISES.map((promise) => (
            <li
              key={promise}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20"
            >
              {promise}
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
