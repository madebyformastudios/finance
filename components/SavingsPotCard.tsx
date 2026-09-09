"use client";

import { useEffect, useState, useTransition } from "react";
import { withdrawFromSavingsPot } from "@/app/spaardoelen/actions";
import type { SavingsPot } from "@/lib/types";

const eur = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
function currency(n: number) {
  return eur.format(n);
}

function WithdrawModal({ pot, onClose }: { pot: SavingsPot; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleSubmit() {
    const value = Number(amount) || 0;
    if (value <= 0) {
      setError("Voer een bedrag groter dan 0 in.");
      return;
    }
    if (value > pot.current_balance) {
      setError(`Dit is hoger dan het huidige saldo (${currency(pot.current_balance)}).`);
      return;
    }
    startTransition(async () => {
      await withdrawFromSavingsPot({
        pot_id: pot.id,
        amount: value,
        description: description || "Geld opgenomen",
      });
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-semibold text-ink">Geld opnemen</h3>
        <p className="mt-1 text-sm text-muted">
          {pot.name} · saldo {currency(pot.current_balance)}
        </p>

        <label className="mt-4 flex flex-col gap-1 text-sm">
          <span className="text-muted">Bedrag</span>
          <input
            type="number"
            step="0.01"
            autoFocus
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            className="rounded-xl border border-border bg-canvas px-3 py-2 outline-none focus:border-dominant"
          />
        </label>

        <label className="mt-3 flex flex-col gap-1 text-sm">
          <span className="text-muted">Omschrijving</span>
          <input
            value={description}
            placeholder="bijv. Onderhoud uitgevoerd"
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-xl border border-border bg-canvas px-3 py-2 outline-none focus:border-dominant"
          />
        </label>

        {error && <p className="mt-2 text-sm text-shortfall">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="press rounded-xl border border-border px-4 py-2 text-sm text-muted hover:bg-canvas"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !amount}
            className="press rounded-xl bg-dominant px-4 py-2 text-sm font-medium text-dominant-ink hover:bg-dominant-soft disabled:opacity-50"
          >
            {isPending ? "Bezig…" : "Opnemen"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SavingsPotCard({ pot }: { pot: SavingsPot }) {
  const [modalOpen, setModalOpen] = useState(false);

  const progress =
    pot.target_amount && pot.target_amount > 0
      ? Math.min(100, (pot.current_balance / pot.target_amount) * 100)
      : null;

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">{pot.name}</h3>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-ink">
            {currency(pot.current_balance)}
          </p>
        </div>

        {progress !== null && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Doel: {currency(pot.target_amount!)}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full bg-dominant transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={() => setModalOpen(true)}
          disabled={pot.current_balance <= 0}
          className="press mt-1 rounded-xl border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-40"
        >
          Geld opnemen
        </button>
      </div>

      {modalOpen && <WithdrawModal pot={pot} onClose={() => setModalOpen(false)} />}
    </>
  );
}
