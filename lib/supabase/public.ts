import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./env";

/** Anonymous client with no cookies, so it is safe to use inside `use cache`. */
export function createPublicClient() {
  const { url, anonKey } = requireSupabaseEnv();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
