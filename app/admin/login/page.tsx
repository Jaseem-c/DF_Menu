import Image from "next/image";
import { LoginForm } from "@/components/admin/login-form";
import { getSupabaseEnv } from "@/lib/supabase/env";

export default function LoginPage() {
  const configured = getSupabaseEnv() !== null;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div className="rounded-2xl bg-brand-900 p-4">
        <Image src="/logo.webp" alt="Diet Factory" width={1200} height={724} priority className="mx-auto h-auto w-44" />
      </div>
      <div className="card space-y-4">
        <h1 className="font-display text-xl font-semibold">Admin sign in</h1>
        {configured ? (
          <LoginForm />
        ) : (
          <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            Supabase is not configured yet. Copy .env.example to .env.local and fill in your
            project keys (see the README).
          </p>
        )}
      </div>
    </main>
  );
}
