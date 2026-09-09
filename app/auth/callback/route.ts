import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Behind Vercel's proxy, request.url's origin can be an internal address
  // rather than the public host the browser is actually on — redirecting
  // there instead of the real domain is a classic source of "works
  // sometimes" auth bugs. x-forwarded-host carries the real one.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const redirectOrigin =
    process.env.NODE_ENV === "development" || !forwardedHost ? origin : `https://${forwardedHost}`;

  if (!code) {
    return NextResponse.redirect(`${redirectOrigin}/login?error=auth`);
  }

  // Build the redirect response first and bind the Supabase client's cookie
  // writes directly to it, instead of going through next/headers' cookies()
  // (as lib/supabase/server.ts does) and hoping they merge into a manually
  // constructed NextResponse.redirect(). This removes any ambiguity about
  // whether the session cookies from exchangeCodeForSession actually land
  // on the response the browser receives.
  const response = NextResponse.redirect(`${redirectOrigin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${redirectOrigin}/login?error=auth`);
  }

  return response;
}
