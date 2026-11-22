"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  checkLoginAllowed,
  clearLoginFailures,
  recordLoginFailure,
} from "@/lib/rate-limit";
import { createSessionClient } from "@/lib/supabase/server";

const credentials = z.object({
  email: z.email("Enter a valid email").max(254),
  password: z.string().min(1, "Enter your password").max(200),
});

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { email, password } = parsed.data;
  const forwarded = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const keys = [`ip:${forwarded}`, `email:${email.toLowerCase()}`];

  if (!keys.every((k) => checkLoginAllowed(k))) {
    return { error: "Too many attempts. Please wait 15 minutes and try again." };
  }

  const db = await createSessionClient();
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    keys.forEach((k) => recordLoginFailure(k));
    return { error: "Invalid email or password." };
  }

  const { data: adminRow } = await db
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!adminRow) {
    await db.auth.signOut();
    keys.forEach((k) => recordLoginFailure(k));
    return { error: "This account does not have admin access." };
  }

  keys.forEach((k) => clearLoginFailures(k));
  redirect("/admin");
}

export async function logout(): Promise<void> {
  const db = await createSessionClient();
  await db.auth.signOut();
  redirect("/admin/login");
}
