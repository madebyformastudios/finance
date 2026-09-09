"use client";

import { useMemo, useState, useTransition } from "react";
import {
  addSavingsAllocation,
  deleteSavingsAllocation,
  updateSavingsAllocation,
} from "@/app/dashboard/actions";
import type { SavingsAllocation } from "@/lib/types";

const eur = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
function currency(n: number) {
  return eur.format(n);
}

function EditableAmount({
  allocation,
  max,
  locked,
  isPending,
  onSave,
}: {
  allocation: SavingsAllocation;
  max: number;
  locked: boolean;
  isPending: boolean;
  onSave: (id: string, amount: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(allocation.amount));
  const [error, setError] = useState<string | null>(null);

  function commit() {
    const amount = Number(text) || 0;
    if (amount <= 0) {
      setError("Voer een bedrag groter dan 0 in.");
      return;
    }
    if (amount > max) {
      setError(`Dit is hoger dan het nog te verdelen bedrag (${currency(max)}).`);
      return;
    }
    onSave(allocation.id, amount);
    setEditing(false);
    setError(null);
  }

  if (!editing) {
    return (
      <button
        onClick={() => !locked && setEditing(true)}
        disabled={locked}
        className="tabular-nums text-ink underline decoration-dotted underline-offset-2 disabled:no-underline"
      >
        {currency(allocation.amount)}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          step="0.01"
          autoFocus
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          className="w-24 rounded-lg border border-border bg-card px-2 py-1 text-right outline-none focus:border-dominant"
        />
        <button
          onClick={commit}
          disabled={isPending}
          className="press rounded-lg bg-dominant px-2 py-1 text-xs font-medium text-dominant-ink hover:bg-dominant-soft"
        >
          Opslaan
        </button>
      </div>
      {error && <span className="text-xs text-shortfall">{error}</span>}
    </div>
  );
}

export default function SavingsGoals({
  monthlyRecordId,
  savingsPot,
  allocations,
  locked,
}: {
  monthlyRecordId: string;
  savingsPot: number;
  allocations: SavingsAllocation[];
  locked: boolean;
}) {
  const [draft, setDraft] = useState({ goal_name: "", amount: "" });
  const [addError, setAddError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allocatedTotal = useMemo(
    () => allocations.reduce((sum, a) => sum + Number(a.amount), 0),
    [allocations],
  );
  const unallocated = savingsPot - allocatedTotal;

  const unallocatedColor =
    unallocated > 0 ? "text-surplus-ink" : unallocated === 0 ? "text-muted" : "text-shortfall";
  const unallocatedBg =
    unallocated > 0 ? "bg-surplus-soft" : unallocated === 0 ? "bg-canvas" : "bg-shortfall-soft";

  function handleAdd() {
    const amount = Number(draft.amount) || 0;
    if (!draft.goal_name || amount <= 0) return;
    if (amount > unallocated) {
      setAddError(`Dit is hoger dan het nog te verdelen bedrag (${currency(unallocated)}).`);
      return;
    }
    setAddError(null);
    startTransition(async () => {
      await addSavingsAllocation({ monthly_record_id: monthlyRecordId, goal_name: draft.goal_name, amount });
      setDraft({ goal_name: "", amount: "" });
    });
  }

  function handleSaveAmount(id: string, amount: number) {
    startTransition(async () => {
      await updateSavingsAllocation(id, amount);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteSavingsAllocation(id);
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-muted">
        Spaardoelen
      </h2>

      <div className={`mb-4 flex items-center justify-between rounded-xl px-4 py-3 ${unallocatedBg}`}>
        <span className="text-sm text-ink">Nog te verdelen</span>
        <span className={`font-display text-xl font-semibold tabular-nums ${unallocatedColor}`}>
          {currency(unallocated)}
        </span>
      </div>

      <ul className="mb-3 flex flex-col gap-2">
        {allocations.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl bg-canvas px-3 py-2.5 text-sm"
          >
            <span className="break-words">{a.goal_name}</span>
            <div className="flex items-center gap-3">
              <EditableAmount
                allocation={a}
                max={unallocated + Number(a.amount)}
                locked={locked}
                isPending={isPending}
                onSave={handleSaveAmount}
              />
              {!locked && (
                <button onClick={() => handleDelete(a.id)} className="press text-muted hover:text-shortfall">
                  Verwijderen
                </button>
              )}
            </div>
          </li>
        ))}
        {allocations.length === 0 && <li className="text-sm text-muted">Nog geen spaardoelen ingesteld.</li>}
      </ul>

      {!locked && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="text-muted">Doel</span>
              <input
                value={draft.goal_name}
                placeholder="bijv. Vakantie"
                onChange={(e) => {
                  setDraft((d) => ({ ...d, goal_name: e.target.value }));
                  setAddError(null);
                }}
                className="rounded-xl border border-border bg-card px-3 py-2 outline-none focus:border-dominant"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Bedrag</span>
              <input
                type="number"
                step="0.01"
                value={draft.amount}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, amount: e.target.value }));
                  setAddError(null);
                }}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 outline-none focus:border-dominant sm:w-28"
              />
            </label>
            <button
              onClick={handleAdd}
              disabled={isPending || !draft.goal_name || !draft.amount}
              className="press rounded-xl bg-dominant px-4 py-2 text-sm font-medium text-dominant-ink hover:bg-dominant-soft disabled:opacity-50"
            >
              Voeg toe
            </button>
          </div>
          {addError && <p className="text-sm text-shortfall">{addError}</p>}
        </div>
      )}
    </section>
  );
}
