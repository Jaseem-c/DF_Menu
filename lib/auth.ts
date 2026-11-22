import "server-only";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";

export type AdminSession = { userId: string; email: string };

/** Returns the signed-in user and whether they are listed in `admin_users`. */
export async function getSessionUser(): Promise<
  { userId: string; email: string; isAdmin: boolean } | null
> {
  const db = await createSessionClient();
  const { data } = await db.auth.getUser();
  if (!data.user) return null;
  const { data: row } = await db
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  return { userId: data.user.id, email: data.user.email ?? "", isAdmin: Boolean(row) };
}

/** Page guard: redirects to login, or returns null for signed-in non-admins. */
export async function getAdminOrRedirect(): Promise<AdminSession | null> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user.isAdmin ? { userId: user.userId, email: user.email } : null;
}

/** Server action guard: throws unless the caller is an admin. */
export async function requireAdmin(): Promise<AdminSession> {
  const user = await getSessionUser();
  if (!user?.isAdmin) throw new Error("Not authorized");
  return { userId: user.userId, email: user.email };
}
