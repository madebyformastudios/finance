"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import type { CoupleSettings } from "@/lib/types";
import { saveCoupleSettings } from "@/app/settings/actions";

export default function SettingsForm({ settings }: { settings: CoupleSettings }) {
  const [fields, setFields] = useState({
    joint_fixed: settings.joint_fixed,
    joint_groceries: settings.joint_groceries,
    user1_fixed_default: settings.user1_fixed_default,
    user2_fixed_default: settings.user2_fixed_default,
  });
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function update<K extends keyof typeof fields>(key: K, value: number) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      await saveCoupleSettings(fields);
      setSavedAt(Date.now());
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="mb-4 text-sm text-muted">
        Deze standaardwaarden vullen nieuwe maanden automatisch in. Een lopende maand aanpassen verandert niets aan
        eerdere maanden.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Gezamenlijke rekening (vast)</span>
          <input
            type="number"
            step="0.01"
            value={fields.joint_fixed}
            onChange={(e) => update("joint_fixed", Number(e.target.value))}
            className="rounded-xl border border-border bg-card px-3 py-2 outline-none focus:border-dominant"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Boodschappen</span>
          <input
            type="number"
            step="0.01"
            value={fields.joint_groceries}
            onChange={(e) => update("joint_groceries", Number(e.target.value))}
            className="rounded-xl border border-border bg-card px-3 py-2 outline-none focus:border-dominant"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Standaard vaste kosten Jairo</span>
          <input
            type="number"
            step="0.01"
            value={fields.user1_fixed_default}
            onChange={(e) => update("user1_fixed_default", Number(e.target.value))}
            className="rounded-xl border border-border bg-card px-3 py-2 outline-none focus:border-dominant"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Standaard vaste kosten Naroa</span>
          <input
            type="number"
            step="0.01"
            value={fields.user2_fixed_default}
            onChange={(e) => update("user2_fixed_default", Number(e.target.value))}
            className="rounded-xl border border-border bg-card px-3 py-2 outline-none focus:border-dominant"
          />
        </label>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="press rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink hover:brightness-95 disabled:opacity-50"
        >
          {isPending ? "Bezig met opslaan…" : "Standaardwaarden opslaan"}
        </button>
        {savedAt && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-surplus-ink"
          >
            Opgeslagen
          </motion.span>
        )}
      </div>
    </section>
  );
}
