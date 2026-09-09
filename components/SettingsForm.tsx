"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import type { CoupleSettings } from "@/lib/types";
import { saveCoupleSettings } from "@/app/settings/actions";
import NumberField from "@/components/NumberField";

export default function SettingsForm({ settings }: { settings: CoupleSettings }) {
  const [fields, setFields] = useState({
    joint_fixed: settings.joint_fixed,
    joint_groceries: settings.joint_groceries,
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
        Deze standaardwaarden vullen nieuwe maanden automatisch in. Persoonlijke vaste lasten (Auto, Verzekering,
        ...) worden per maand ingesteld op het dashboard en nemen automatisch de vorige maand over.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Gezamenlijke rekening (vast)"
          value={fields.joint_fixed}
          onChange={(v) => update("joint_fixed", v)}
        />
        <NumberField
          label="Boodschappen"
          value={fields.joint_groceries}
          onChange={(v) => update("joint_groceries", v)}
        />
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
