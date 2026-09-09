"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { allocateToSavingsPot, createSavingsPot } from "@/app/dashboard/actions";
import type { SavingsPot, SavingsTransaction } from "@/lib/types";

const eur = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
function currency(n: number) {
  return eur.format(n);
}

function PotRow({
  pot,
  allocatedThisMonth,
  unallocated,
  locked,
  isPending,
  onAllocate,
}: {
  pot: SavingsPot;
  allocatedThisMonth: number;
  unallocated: number;
  locked: boolean;
  isPending: boolean;
  onAllocate: (potId: string, amount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAllocate() {
    const value = Number(amount) || 0;
    if (value <= 0) return;
    if (value > unallocated) {
      setError(`Dit is hoger dan het nog te verdelen bedrag (${currency(unallocated)}).`);
      return;
    }
    setError(null);
    onAllocate(pot.id, value);
    setAmount("");
  }

  return (
    <li className="flex flex-col gap-2 rounded-xl bg-canvas px-3 py-2.5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="break-words font-medium text-ink">{pot.name}</span>
        <div className="flex items-center gap-3 text-muted">
          <span>
            Saldo: <span className="tabular-nums text-ink">{currency(pot.current_balance)}</span>
          </span>
          {allocatedThisMonth > 0 && (
            <span className="tabular-nums text-surplus-ink">+{currency(allocatedThisMonth)} deze maand</span>
          )}
        </div>
      </div>
      {!locked && (
        <div className="flex items-end gap-2">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            placeholder="Bedrag"
            className="w-28 rounded-lg border border-border bg-card px-2 py-1.5 outline-none focus:border-dominant"
          />
          <button
            onClick={handleAllocate}
            disabled={isPending || !amount}
            className="press rounded-lg bg-dominant px-3 py-1.5 text-xs font-medium text-dominant-ink hover:bg-dominant-soft disabled:opacity-50"
          >
            Toewijzen
          </button>
        </div>
      )}
      {error && <span className="text-xs text-shortfall">{error}</span>}
    </li>
  );
}

export default function SavingsGoals({
  monthlyRecordId,
  monthLabel,
  savingsPot,
  pots,
  monthTransactions,
  locked,
}: {
  monthlyRecordId: string;
  monthLabel: string;
  savingsPot: number;
  pots: SavingsPot[];
  monthTransactions: SavingsTransaction[];
  locked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [newPot, setNewPot] = useState({ name: "", target_amount: "" });

  const allocatedByPot = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTransactions) {
      map.set(t.pot_id, (map.get(t.pot_id) ?? 0) + Number(t.amount));
    }
    return map;
  }, [monthTransactions]);

  const allocatedThisMonth = useMemo(
    () => monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
    [monthTransactions],
  );
  const unallocated = savingsPot - allocatedThisMonth;

  const unallocatedColor =
    unallocated > 0 ? "text-surplus-ink" : unallocated === 0 ? "text-muted" : "text-shortfall";
  const unallocatedBg =
    unallocated > 0 ? "bg-surplus-soft" : unallocated === 0 ? "bg-canvas" : "bg-shortfall-soft";

  function handleAllocate(potId: string, amount: number) {
    startTransition(async () => {
      await allocateToSavingsPot({
        pot_id: potId,
        monthly_record_id: monthlyRecordId,
        amount,
        description: `Maandelijkse inleg ${monthLabel}`,
      });
    });
  }

  function handleCreatePot() {
    if (!newPot.name) return;
    const target = Number(newPot.target_amount) || 0;
    startTransition(async () => {
      await createSavingsPot({ name: newPot.name, target_amount: target > 0 ? target : null });
      setNewPot({ name: "", target_amount: "" });
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">Spaardoelen</h2>
        <Link href="/spaardoelen" className="press text-sm text-dominant hover:underline">
          Alle spaarpotjes →
        </Link>
      </div>

      <div className={`mb-4 flex items-center justify-between rounded-xl px-4 py-3 ${unallocatedBg}`}>
        <span className="text-sm text-ink">Nog te verdelen</span>
        <span className={`font-display text-xl font-semibold tabular-nums ${unallocatedColor}`}>
          {currency(unallocated)}
        </span>
      </div>

      <ul className="mb-3 flex flex-col gap-2">
        {pots.map((pot) => (
          <PotRow
            key={pot.id}
            pot={pot}
            allocatedThisMonth={allocatedByPot.get(pot.id) ?? 0}
            unallocated={unallocated}
            locked={locked}
            isPending={isPending}
            onAllocate={handleAllocate}
          />
        ))}
        {pots.length === 0 && <li className="text-sm text-muted">Nog geen spaarpotjes aangemaakt.</li>}
      </ul>

      {!locked && (
        <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-muted">Naam nieuw spaarpotje</span>
            <input
              value={newPot.name}
              placeholder="bijv. Onderhoud Motor"
              onChange={(e) => setNewPot((n) => ({ ...n, name: e.target.value }))}
              className="rounded-xl border border-border bg-card px-3 py-2 outline-none focus:border-dominant"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Doelbedrag (optioneel)</span>
            <input
              type="number"
              step="0.01"
              value={newPot.target_amount}
              onChange={(e) => setNewPot((n) => ({ ...n, target_amount: e.target.value }))}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 outline-none focus:border-dominant sm:w-32"
            />
          </label>
          <button
            onClick={handleCreatePot}
            disabled={isPending || !newPot.name}
            className="press rounded-xl bg-dominant px-4 py-2 text-sm font-medium text-dominant-ink hover:bg-dominant-soft disabled:opacity-50"
          >
            + Nieuw spaarpotje
          </button>
        </div>
      )}
    </section>
  );
}
