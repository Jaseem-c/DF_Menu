import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Optimistic gate for /admin: refreshes the Supabase session and sends visitors
 * without one to the login page. Real authorization (admin role check) happens
 * in the admin layout and in every server action.
 */
export async function proxy(request: NextRequest) {
  const env = getSupabaseEnv();
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";

  if (!env) {
    return isLogin ? NextResponse.next() : redirectToLogin(request);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (!data.user && !isLogin) return redirectToLogin(request);

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
