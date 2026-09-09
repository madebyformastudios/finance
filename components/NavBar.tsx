import Link from "next/link";

export default function NavBar({ email }: { email?: string | null }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-5 font-display text-sm font-medium text-muted">
          <Link href="/dashboard" className="hover:text-ink">
            Overzicht
          </Link>
          <Link href="/history" className="hover:text-ink">
            Geschiedenis
          </Link>
          <Link href="/settings" className="hover:text-ink">
            Instellingen
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {email && <span className="text-sm text-muted">{email}</span>}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="press rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:bg-canvas"
            >
              Uitloggen
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
