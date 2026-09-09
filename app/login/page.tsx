"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-dominant p-8 text-center text-dominant-ink shadow-sm">
        <svg
          className="pointer-events-none absolute -left-14 -bottom-16 h-56 w-56 opacity-20"
          viewBox="0 0 200 200"
          fill="none"
        >
          <path
            d="M45.3,-58.5C58.6,-49.6,69.2,-35.5,73.9,-19.6C78.6,-3.7,77.3,14,69.9,28.4C62.5,42.8,49,53.9,34.3,61.4C19.6,68.9,3.6,72.8,-12.9,71.6C-29.4,70.4,-46.4,64.1,-58.3,52.4C-70.2,40.7,-77,23.6,-77.8,6.1C-78.6,-11.4,-73.4,-29.3,-62.4,-42.6C-51.4,-55.9,-34.6,-64.6,-17.9,-68.6C-1.2,-72.6,15.4,-71.9,31.9,-67.6C32,-67.6,45.3,-58.5,45.3,-58.5Z"
            fill="currentColor"
            transform="translate(100 100)"
          />
        </svg>
        <h1 className="relative font-display text-2xl font-semibold">Huishoudboekje</h1>
        <p className="relative mt-2 text-sm text-dominant-ink/75">
          Log in om jullie gezamenlijke financiën te beheren.
        </p>
        <button
          onClick={signInWithGoogle}
          className="press relative mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:brightness-95"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Doorgaan met Google
        </button>
      </div>
    </main>
  );
}
