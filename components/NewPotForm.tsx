"use client";

import { useState } from "react";
import { createSavingsPot } from "@/app/dashboard/actions";
import { useAction } from "@/components/useAction";

// "card" stands alone on the Spaardoelen page; "inline" sits inside the
// dashboard's savings card, separated by a rule.
export default function NewPotForm({ variant = "card" }: { variant?: "card" | "inline" }) {
  const [fields, setFields] = useState({ name: "", target_amount: "" });
  const { run, isPending, error } = useAction();

  function handleCreate() {
    if (!fields.name.trim()) return;
    const target = Number(fields.target_amount) || 0;
    run(
      () => createSavingsPot({ name: fields.name, target_amount: target > 0 ? target : null }),
      () => setFields({ name: "", target_amount: "" }),
    );
  }

  const wrapper =
    variant === "card"
      ? "rounded-2xl border border-border bg-card p-5"
      : "border-t border-border pt-3";
  const input = `${variant === "card" ? "bg-canvas" : "bg-card"} rounded-xl border border-border px-3 py-2 outline-none focus:border-dominant`;

  return (
    <div className={wrapper}>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="text-muted">Naam nieuw spaarpotje</span>
          <input
            value={fields.name}
            placeholder="bijv. Onderhoud Motor"
            onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Doelbedrag (optioneel)</span>
          <input
            type="number"
            step="0.01"
            value={fields.target_amount}
            onChange={(e) => setFields((f) => ({ ...f, target_amount: e.target.value }))}
            className={`${input} w-full sm:w-32`}
          />
        </label>
        <button
          onClick={handleCreate}
          disabled={isPending || !fields.name.trim()}
          className="press rounded-xl bg-dominant px-4 py-2 text-sm font-medium text-dominant-ink hover:bg-dominant-soft disabled:opacity-50"
        >
          + Nieuw spaarpotje
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-shortfall">
          {error}
        </p>
      )}
    </div>
  );
}
