import Link from "next/link";

export default function NavBar({ email }: { email?: string | null }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
          <Link href="/dashboard" className="hover:text-slate-900">
            Dashboard
          </Link>
          <Link href="/history" className="hover:text-slate-900">
            History
          </Link>
          <Link href="/settings" className="hover:text-slate-900">
            Settings
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {email && <span className="text-sm text-slate-500">{email}</span>}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
