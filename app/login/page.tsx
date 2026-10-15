import GoogleSignInButton from "@/components/GoogleSignInButton";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

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
        {error && (
          <p role="alert" className="relative mt-4 rounded-lg bg-shortfall-soft px-3 py-2 text-sm text-shortfall-ink">
            Inloggen is niet gelukt. Alleen de twee geautoriseerde accounts hebben toegang.
          </p>
        )}
        <GoogleSignInButton />
      </div>
    </main>
  );
}
