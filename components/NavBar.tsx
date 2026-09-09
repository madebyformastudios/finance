"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/dashboard", label: "Overzicht" },
  { href: "/spaardoelen", label: "Spaardoelen" },
  { href: "/history", label: "Geschiedenis" },
  { href: "/settings", label: "Instellingen" },
];

export default function NavBar({ email }: { email?: string | null }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <nav className="hidden items-center gap-5 font-display text-sm font-medium text-muted sm:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 sm:flex">
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

        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Menu openen"
          className="press flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink sm:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-canvas sm:hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-display text-sm font-semibold text-ink">Menu</span>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Menu sluiten"
              className="press flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-4 py-6">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="press rounded-xl px-4 py-4 font-display text-lg font-medium text-ink hover:bg-card"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3 border-t border-border px-4 py-4">
            {email && <span className="text-sm text-muted">{email}</span>}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="press w-full rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted hover:bg-card"
              >
                Uitloggen
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
