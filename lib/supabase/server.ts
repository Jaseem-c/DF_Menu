import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseEnv } from "./env";

/** Supabase client bound to the signed-in user's session cookies. */
export async function createSessionClient() {
  // Reading cookies first marks the caller as request-time work, so it is never prerendered.
  const store = await cookies();
  const { url, anonKey } = requireSupabaseEnv();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) {
            store.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}
