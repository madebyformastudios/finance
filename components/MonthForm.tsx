"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { calculate } from "@/lib/calc";
import type { Expense, MonthlyRecord } from "@/lib/types";
import { addExpense, deleteExpense, saveMonthlyRecord, toggleLock } from "@/app/dashboard/actions";

function currency(n: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(n);
}

function NumberField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <input
        type="number"
        step="0.01"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
      />
    </label>
  );
}

export default function MonthForm({
  record,
  expenses,
  monthLabel,
}: {
  record: MonthlyRecord;
  expenses: Expense[];
  monthLabel: string;
}) {
  const [fields, setFields] = useState({
    user1_income: record.user1_income,
    user2_income: record.user2_income,
    user1_fixed: record.user1_fixed,
    user2_fixed: record.user2_fixed,
    joint_fixed: record.joint_fixed,
    joint_groceries: record.joint_groceries,
    credit_card_bill: record.credit_card_bill,
  });
  const [newExpense, setNewExpense] = useState({ description: "", amount: 0, assignee: "joint" as const });
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const locked = record.locked_status;
  const extraTotal = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount), 0), [expenses]);

  const result = useMemo(
    () =>
      calculate({
        user1Income: fields.user1_income,
        user2Income: fields.user2_income,
        user1Fixed: fields.user1_fixed,
        user2Fixed: fields.user2_fixed,
        jointFixed: fields.joint_fixed,
        jointGroceries: fields.joint_groceries,
        extraExpenses: extraTotal,
        creditCardBill: fields.credit_card_bill,
      }),
    [fields, extraTotal],
  );

  function update<K extends keyof typeof fields>(key: K, value: number) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      await saveMonthlyRecord({ id: record.id, ...fields });
      setSavedAt(Date.now());
    });
  }

  function handleAddExpense() {
    if (!newExpense.description || newExpense.amount === 0) return;
    startTransition(async () => {
      await addExpense({ monthly_record_id: record.id, ...newExpense });
      setNewExpense({ description: "", amount: 0, assignee: "joint" });
    });
  }

  function handleDeleteExpense(id: string) {
    startTransition(async () => {
      await deleteExpense(id);
    });
  }

  function handleToggleLock() {
    startTransition(async () => {
      await toggleLock(record.id, !locked);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{monthLabel}</h1>
        <button
          onClick={handleToggleLock}
          disabled={isPending}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            locked
              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {locked ? "Unlock month" : "Lock month"}
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Income</h2>
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="User 1 income" value={fields.user1_income} disabled={locked} onChange={(v) => update("user1_income", v)} />
          <NumberField label="User 2 income" value={fields.user2_income} disabled={locked} onChange={(v) => update("user2_income", v)} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Fixed & shared costs</h2>
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Joint account (fixed)" value={fields.joint_fixed} disabled={locked} onChange={(v) => update("joint_fixed", v)} />
          <NumberField label="Groceries" value={fields.joint_groceries} disabled={locked} onChange={(v) => update("joint_groceries", v)} />
          <NumberField label="User 1 personal fixed" value={fields.user1_fixed} disabled={locked} onChange={(v) => update("user1_fixed", v)} />
          <NumberField label="User 2 personal fixed" value={fields.user2_fixed} disabled={locked} onChange={(v) => update("user2_fixed", v)} />
          <NumberField label="Credit card bill" value={fields.credit_card_bill} disabled={locked} onChange={(v) => update("credit_card_bill", v)} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Extra expenses ({currency(extraTotal)})
        </h2>
        <ul className="mb-3 flex flex-col gap-2">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span>
                {e.description} <span className="text-slate-400">· {e.assignee}</span>
              </span>
              <div className="flex items-center gap-3">
                <span className="font-medium">{currency(Number(e.amount))}</span>
                {!locked && (
                  <button onClick={() => handleDeleteExpense(e.id)} className="text-slate-400 hover:text-red-500">
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
          {expenses.length === 0 && <li className="text-sm text-slate-400">No extra expenses this month.</li>}
        </ul>
        {!locked && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">Description</span>
              <input
                value={newExpense.description}
                onChange={(e) => setNewExpense((n) => ({ ...n, description: e.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">Amount</span>
              <input
                type="number"
                step="0.01"
                value={newExpense.amount}
                onChange={(e) => setNewExpense((n) => ({ ...n, amount: Number(e.target.value) }))}
                className="w-28 rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">Assignee</span>
              <select
                value={newExpense.assignee}
                onChange={(e) =>
                  setNewExpense((n) => ({ ...n, assignee: e.target.value as typeof n.assignee }))
                }
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="joint">Joint</option>
                <option value="user1">User 1</option>
                <option value="user2">User 2</option>
              </select>
            </label>
            <button
              onClick={handleAddExpense}
              disabled={isPending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Add
            </button>
          </div>
        )}
      </section>

      {!locked && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save month"}
          </button>
          {savedAt && <span className="text-sm text-emerald-600">Saved</span>}
        </div>
      )}

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl border border-slate-200 bg-white p-5"
      >
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Breakdown</h2>
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-slate-500">Total expenses</dt>
          <dd className="text-right font-medium">{currency(result.totalExpenses)}</dd>

          <dt className="text-slate-500">User 1 balance (income − expenses)</dt>
          <dd className={`text-right font-medium ${result.user1Balance < 0 ? "text-red-600" : ""}`}>
            {currency(result.user1Balance)}
          </dd>

          {result.shortfall > 0 && (
            <>
              <dt className="text-slate-500">Shortfall covered by User 2</dt>
              <dd className="text-right font-medium text-red-600">{currency(result.shortfall)}</dd>
            </>
          )}

          <dt className="text-slate-500">User 2 remaining to distribute</dt>
          <dd className="text-right font-medium">{currency(result.user2Remaining)}</dd>

          {result.deficit > 0 && (
            <>
              <dt className="text-red-600">Couple deficit this month</dt>
              <dd className="text-right font-semibold text-red-600">{currency(result.deficit)}</dd>
            </>
          )}
        </dl>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-emerald-50 p-4 text-center">
            <p className="text-xs font-medium uppercase text-emerald-700">Savings</p>
            <p className="mt-1 text-lg font-semibold text-emerald-900">{currency(result.savings)}</p>
          </div>
          <div className="rounded-xl bg-sky-50 p-4 text-center">
            <p className="text-xs font-medium uppercase text-sky-700">User 1 payout</p>
            <p className="mt-1 text-lg font-semibold text-sky-900">{currency(result.user1Payout)}</p>
          </div>
          <div className="rounded-xl bg-violet-50 p-4 text-center">
            <p className="text-xs font-medium uppercase text-violet-700">User 2 payout</p>
            <p className="mt-1 text-lg font-semibold text-violet-900">{currency(result.user2Payout)}</p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
