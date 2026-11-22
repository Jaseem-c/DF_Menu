import { Suspense, type ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { ToastProvider } from "@/components/ui/toast";
import { getAdminOrRedirect } from "@/lib/auth";
import { logout } from "../login/actions";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <Suspense fallback={<p className="p-6 text-sm">Loading admin…</p>}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </ToastProvider>
  );
}

async function AdminShell({ children }: { children: ReactNode }) {
  const session = await getAdminOrRedirect();

  if (!session) {
    return (
      <main className="mx-auto max-w-md p-6">
        <div className="card space-y-3">
          <h1 className="font-display text-xl font-semibold">No admin access</h1>
          <p className="text-sm">
            This account is signed in but is not an admin. Ask the owner to add it to the admin
            list, or sign in with a different account.
          </p>
          <form action={logout}>
            <button type="submit" className="btn-primary">
              Log out
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <>
      <AdminNav email={session.email} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}
