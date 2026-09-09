"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

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
    <header className="border-b border-transparent sm:border-border sm:bg-card">
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
          className="press ml-auto -mr-1 flex h-11 w-11 items-center justify-center text-ink transition-opacity hover:opacity-60 sm:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex flex-col bg-canvas sm:hidden"
          >
            <div className="flex justify-end px-4 py-3">
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Menu sluiten"
                className="press flex h-11 w-11 items-center justify-center text-ink transition-opacity hover:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <motion.nav
              initial="closed"
              animate="open"
              variants={{ open: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } } }}
              className="flex flex-1 flex-col gap-1 px-6 py-4"
            >
              {LINKS.map((link) => (
                <motion.div
                  key={link.href}
                  variants={{
                    closed: { opacity: 0, y: 8 },
                    open: { opacity: 1, y: 0 },
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="press block rounded-xl py-4 font-display text-2xl font-semibold text-ink"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </motion.nav>

            <div className="flex flex-col gap-3 px-6 py-6">
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
