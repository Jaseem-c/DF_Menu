"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/login/actions";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/items", label: "Items" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/import-export", label: "Import / Export" },
  { href: "/admin/qr", label: "QR code" },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 bg-brand-900 text-cream">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/admin" className="font-display text-lg font-semibold">
          Diet Factory <span className="text-sm font-normal text-cream/70">admin</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-48 truncate text-xs text-cream/70 sm:block">{email}</span>
          <Link href="/" target="_blank" className="text-sm font-bold underline">
            View menu
          </Link>
          <form action={logout}>
            <button type="submit" className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold">
              Log out
            </button>
          </form>
        </div>
      </div>
      <nav aria-label="Admin sections" className="mx-auto max-w-5xl overflow-x-auto px-4 [scrollbar-width:none]">
        <ul className="flex w-max gap-1 pb-2">
          {LINKS.map((link) => {
            const active =
              link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm font-bold whitespace-nowrap",
                    active ? "bg-cream text-brand-900" : "text-cream/90 hover:bg-white/10",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
