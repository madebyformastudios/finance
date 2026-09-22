import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Excludes Next.js's automatic router-prefetch requests (e.g. from
    // <Link>) too. Prefetches fire concurrently with real navigations and
    // each one calls supabase.auth.getUser(), which can rotate the
    // single-use refresh token — concurrent rotations race and can clobber
    // the session cookie an in-flight real navigation is relying on,
    // causing a spurious bounce to /login right after signing in.
    {
      source: "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
