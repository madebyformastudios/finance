export default function GeenToegangPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-3xl bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-shortfall-soft text-shortfall-ink">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4M12 16.5h.01" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.29 2.25h17.78A1.5 1.5 0 0 0 22.18 18L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z"
            />
          </svg>
        </div>
        <h1 className="mt-5 font-display text-xl font-semibold text-ink">Geen toegang</h1>
        <p className="mt-2 text-sm text-muted">
          Je hebt geen autorisatie om deze privéomgeving te bekijken. Dit huishoudboekje is
          alleen toegankelijk voor de twee geautoriseerde accounts.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button
            type="submit"
            className="press w-full rounded-xl bg-shortfall-soft px-4 py-2.5 text-sm font-medium text-shortfall-ink shadow-sm transition hover:brightness-95"
          >
            Terug naar inloggen
          </button>
        </form>
      </div>
    </main>
  );
}
