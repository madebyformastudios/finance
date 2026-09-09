"use client";

import { useState, useTransition } from "react";
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
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="mb-4 text-sm text-slate-500">
        These defaults pre-fill new months. Editing a month directly won&apos;t change past months.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Joint account (fixed)</span>
          <input
            type="number"
            step="0.01"
            value={fields.joint_fixed}
            onChange={(e) => update("joint_fixed", Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Groceries</span>
          <input
            type="number"
            step="0.01"
            value={fields.joint_groceries}
            onChange={(e) => update("joint_groceries", Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">User 1 personal fixed default</span>
          <input
            type="number"
            step="0.01"
            value={fields.user1_fixed_default}
            onChange={(e) => update("user1_fixed_default", Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">User 2 personal fixed default</span>
          <input
            type="number"
            step="0.01"
            value={fields.user2_fixed_default}
            onChange={(e) => update("user2_fixed_default", Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save defaults"}
        </button>
        {savedAt && <span className="text-sm text-emerald-600">Saved</span>}
      </div>
    </section>
  );
}
