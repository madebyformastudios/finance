"use client";

import { useState, useTransition } from "react";
import { createSavingsPot } from "@/app/dashboard/actions";

export default function NewPotForm() {
  const [fields, setFields] = useState({ name: "", target_amount: "" });
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!fields.name) return;
    const target = Number(fields.target_amount) || 0;
    startTransition(async () => {
      await createSavingsPot({ name: fields.name, target_amount: target > 0 ? target : null });
      setFields({ name: "", target_amount: "" });
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="flex flex-1 flex-col gap-1 text-sm">
        <span className="text-muted">Naam nieuw spaarpotje</span>
        <input
          value={fields.name}
          placeholder="bijv. Onderhoud Motor"
          onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
          className="rounded-xl border border-border bg-canvas px-3 py-2 outline-none focus:border-dominant"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Doelbedrag (optioneel)</span>
        <input
          type="number"
          step="0.01"
          value={fields.target_amount}
          onChange={(e) => setFields((f) => ({ ...f, target_amount: e.target.value }))}
          className="w-full rounded-xl border border-border bg-canvas px-3 py-2 outline-none focus:border-dominant sm:w-32"
        />
      </label>
      <button
        onClick={handleCreate}
        disabled={isPending || !fields.name}
        className="press rounded-xl bg-dominant px-4 py-2 text-sm font-medium text-dominant-ink hover:bg-dominant-soft disabled:opacity-50"
      >
        + Nieuw spaarpotje
      </button>
    </div>
  );
}
