"use client";

import { useEffect } from "react";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-3xl bg-card p-8 text-center shadow-sm">
        <h1 className="font-display text-xl font-semibold text-ink">Er ging iets mis</h1>
        <p className="mt-2 text-sm text-muted">De pagina kon niet worden geladen. Probeer het nog eens.</p>
        <button
          onClick={() => retry()}
          className="press mt-6 w-full rounded-xl bg-dominant px-4 py-2.5 text-sm font-medium text-dominant-ink hover:bg-dominant-soft"
        >
          Opnieuw proberen
        </button>
      </div>
    </main>
  );
}
