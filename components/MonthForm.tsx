"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { calculate } from "@/lib/calc";
import type { Assignee, Expense, MonthlyRecord } from "@/lib/types";
import { addExpense, deleteExpense, saveMonthlyRecord, toggleLock } from "@/app/dashboard/actions";
import Avatar from "@/components/Avatar";
import Donut from "@/components/Donut";
import CountUp from "@/components/CountUp";
import NumberField from "@/components/NumberField";

const eur = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
function currency(n: number) {
  return eur.format(n);
}

const ASSIGNEE_LABEL: Record<string, string> = {
  user1: "Jairo",
  user2: "Naroa",
  joint: "Gezamenlijk",
};

const ASSIGNEE_DOT: Record<string, string> = {
  user1: "#1f3d33",
  user2: "#d19a3d",
  joint: "#6b6252",
};

function BudgetBar({
  label,
  amount,
  total,
  color,
  avatar,
}: {
  label: string;
  amount: number;
  total: number;
  color: string;
  avatar?: string;
}) {
  const pct = total > 0 ? Math.min(100, (amount / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-ink">
          {avatar && <Avatar name={avatar} size={18} />}
          {label}
        </span>
        <span className="font-medium text-ink">{currency(amount)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function PersonalFixedList({
  name,
  assignee,
  expenses,
  total,
  locked,
  onAdd,
  onDelete,
  isPending,
}: {
  name: string;
  assignee: Assignee;
  expenses: Expense[];
  total: number;
  locked: boolean;
  onAdd: (assignee: Assignee, description: string, amount: number) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const [draft, setDraft] = useState({ description: "", amount: "" });

  function handleAdd() {
    const amount = Number(draft.amount) || 0;
    if (!draft.description || amount === 0) return;
    onAdd(assignee, draft.description, amount);
    setDraft({ description: "", amount: "" });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-canvas p-3.5">
      <div className="flex items-center justify-between text-sm font-medium text-ink">
        <span className="flex items-center gap-2">
          <Avatar name={name} size={18} />
          Vaste kosten {name}
        </span>
        <span className="tabular-nums">{currency(total)}</span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {expenses.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-card px-3 py-2 text-sm">
            <span className="break-words">{e.description}</span>
            <div className="flex items-center gap-3">
              <span className="tabular-nums text-ink">{currency(Number(e.amount))}</span>
              {!locked && (
                <button onClick={() => onDelete(e.id)} className="press text-muted hover:text-shortfall">
                  Verwijderen
                </button>
              )}
            </div>
          </li>
        ))}
        {expenses.length === 0 && <li className="text-sm text-muted">Nog geen vaste lasten toegevoegd.</li>}
      </ul>
      {!locked && (
        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-muted">Omschrijving</span>
            <input
              value={draft.description}
              placeholder="bijv. Autoverzekering"
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              className="rounded-lg border border-border bg-card px-3 py-1.5 outline-none focus:border-dominant"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Bedrag</span>
            <input
              type="number"
              step="0.01"
              value={draft.amount}
              onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-1.5 outline-none focus:border-dominant sm:w-24"
            />
          </label>
          <button
            onClick={handleAdd}
            disabled={isPending}
            className="press rounded-lg bg-dominant px-3 py-1.5 text-sm font-medium text-dominant-ink hover:bg-dominant-soft"
          >
            + Voeg vaste last toe
          </button>
        </div>
      )}
    </div>
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
    joint_fixed: record.joint_fixed,
    joint_groceries: record.joint_groceries,
    credit_card_bill: record.credit_card_bill,
  });
  const [newExpense, setNewExpense] = useState({ description: "", amount: "", assignee: "joint" as const });
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const locked = record.locked_status;

  const extraExpenses = useMemo(() => expenses.filter((e) => e.type === "extra"), [expenses]);
  const personalFixedUser1 = useMemo(
    () => expenses.filter((e) => e.type === "personal_fixed" && e.assignee === "user1"),
    [expenses],
  );
  const personalFixedUser2 = useMemo(
    () => expenses.filter((e) => e.type === "personal_fixed" && e.assignee === "user2"),
    [expenses],
  );

  const extraTotal = useMemo(() => extraExpenses.reduce((sum, e) => sum + Number(e.amount), 0), [extraExpenses]);
  const user1FixedTotal = useMemo(
    () => personalFixedUser1.reduce((sum, e) => sum + Number(e.amount), 0),
    [personalFixedUser1],
  );
  const user2FixedTotal = useMemo(
    () => personalFixedUser2.reduce((sum, e) => sum + Number(e.amount), 0),
    [personalFixedUser2],
  );

  const result = useMemo(
    () =>
      calculate({
        user1Income: fields.user1_income,
        user2Income: fields.user2_income,
        user1Fixed: user1FixedTotal,
        user2Fixed: user2FixedTotal,
        jointFixed: fields.joint_fixed,
        jointGroceries: fields.joint_groceries,
        extraExpenses: extraTotal,
        creditCardBill: fields.credit_card_bill,
      }),
    [fields, extraTotal, user1FixedTotal, user2FixedTotal],
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
    const amount = Number(newExpense.amount) || 0;
    if (!newExpense.description || amount === 0) return;
    startTransition(async () => {
      await addExpense({
        monthly_record_id: record.id,
        description: newExpense.description,
        amount,
        assignee: newExpense.assignee,
      });
      setNewExpense({ description: "", amount: "", assignee: "joint" });
    });
  }

  function handleAddPersonalFixed(assignee: Assignee, description: string, amount: number) {
    startTransition(async () => {
      await addExpense({
        monthly_record_id: record.id,
        description,
        amount,
        assignee,
        type: "personal_fixed",
      });
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

  const isDeficit = result.deficit > 0;
  const heroValue = isDeficit ? result.deficit : result.user2Remaining;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-dominant px-6 py-8 text-dominant-ink shadow-sm sm:px-8">
        <svg
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-20"
          viewBox="0 0 200 200"
          fill="none"
        >
          <path
            d="M45.3,-58.5C58.6,-49.6,69.2,-35.5,73.9,-19.6C78.6,-3.7,77.3,14,69.9,28.4C62.5,42.8,49,53.9,34.3,61.4C19.6,68.9,3.6,72.8,-12.9,71.6C-29.4,70.4,-46.4,64.1,-58.3,52.4C-70.2,40.7,-77,23.6,-77.8,6.1C-78.6,-11.4,-73.4,-29.3,-62.4,-42.6C-51.4,-55.9,-34.6,-64.6,-17.9,-68.6C-1.2,-72.6,15.4,-71.9,31.9,-67.6C32,-67.6,45.3,-58.5,45.3,-58.5Z"
            fill="currentColor"
            transform="translate(100 100)"
          />
        </svg>
        <div className="relative flex flex-wrap items-center justify-between gap-y-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-dominant-ink/70">{monthLabel}</p>
            <p className="mt-1 text-sm text-dominant-ink/70">
              {isDeficit ? "Tekort deze maand" : "Overschot deze maand"}
            </p>
          </div>
          <button
            onClick={handleToggleLock}
            disabled={isPending}
            className="press rounded-full border border-dominant-ink/25 bg-dominant-ink/10 px-3 py-1.5 text-xs font-medium text-dominant-ink hover:bg-dominant-ink/20"
          >
            {locked ? "Ontgrendel maand" : "Vergrendel maand"}
          </button>
        </div>
        <p
          className={`relative mt-4 break-words font-display text-4xl font-semibold tabular-nums sm:text-5xl lg:text-6xl ${
            isDeficit ? "text-shortfall" : "text-dominant-ink"
          }`}
        >
          <CountUp value={heroValue} format={currency} />
        </p>
        <div className="relative mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-dominant-ink/80">
          <span className="flex items-center gap-2">
            <Avatar name="Jairo" size={20} />
            Saldo Jairo: <span className="font-medium text-dominant-ink">{currency(result.user1Balance)}</span>
          </span>
          <span>
            Totale lasten: <span className="font-medium text-dominant-ink">{currency(result.totalExpenses)}</span>
          </span>
        </div>
      </div>

      {/* Allocation */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-muted">Verdeling</h2>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-around">
          <Donut
            segments={[
              { label: "Spaarpot", value: result.savings, color: "#6f8f74" },
              { label: "Jairo", value: result.user1Payout, color: "#1f3d33" },
              { label: "Naroa", value: result.user2Payout, color: "#d19a3d" },
            ]}
          />
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#6f8f74" }} />
              <dt className="w-24 text-muted">Spaarpot (50%)</dt>
              <dd className="font-medium text-ink">{currency(result.savings)}</dd>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#1f3d33" }} />
              <dt className="w-24 text-muted">Jairo (25%)</dt>
              <dd className="font-medium text-ink">{currency(result.user1Payout)}</dd>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#d19a3d" }} />
              <dt className="w-24 text-muted">Naroa (25%)</dt>
              <dd className="font-medium text-ink">{currency(result.user2Payout)}</dd>
            </div>
          </dl>
        </div>
        {result.shortfall > 0 && (
          <p className="mt-4 rounded-lg bg-shortfall-soft px-3 py-2 text-sm text-shortfall-ink">
            Naroa vangt een tekort op van {currency(result.shortfall)} voordat de rest verdeeld wordt.
          </p>
        )}
        {isDeficit && (
          <p className="mt-4 rounded-lg bg-shortfall-soft px-3 py-2 text-sm text-shortfall-ink">
            Het inkomen van Naroa is niet genoeg om het tekort te dekken. Er blijft {currency(result.deficit)} tekort
            over — er is deze maand niets om te verdelen.
          </p>
        )}
      </section>

      {/* Income */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-muted">Inkomen</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="Inkomen Jairo"
            avatar="Jairo"
            value={fields.user1_income}
            disabled={locked}
            onChange={(v) => update("user1_income", v)}
            onBlur={handleSave}
          />
          <NumberField
            label="Inkomen Naroa"
            avatar="Naroa"
            value={fields.user2_income}
            disabled={locked}
            onChange={(v) => update("user2_income", v)}
            onBlur={handleSave}
          />
        </div>
      </section>

      {/* Fixed costs */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-muted">Vaste lasten</h2>
        <div className="mb-5 flex flex-col gap-4">
          <BudgetBar label="Gezamenlijke rekening" amount={fields.joint_fixed} total={result.totalExpenses} color="#1f3d33" />
          <BudgetBar label="Boodschappen" amount={fields.joint_groceries} total={result.totalExpenses} color="#d19a3d" />
          <BudgetBar label="Vaste kosten" avatar="Jairo" amount={user1FixedTotal} total={result.totalExpenses} color="#6f8f74" />
          <BudgetBar label="Vaste kosten" avatar="Naroa" amount={user2FixedTotal} total={result.totalExpenses} color="#bf6a4d" />
          <BudgetBar label="Creditcard" amount={fields.credit_card_bill} total={result.totalExpenses} color="#6b6252" />
        </div>
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField label="Gezamenlijke rekening (vast)" value={fields.joint_fixed} disabled={locked} onChange={(v) => update("joint_fixed", v)} onBlur={handleSave} />
          <NumberField label="Boodschappen" value={fields.joint_groceries} disabled={locked} onChange={(v) => update("joint_groceries", v)} onBlur={handleSave} />
          <NumberField label="Creditcard" value={fields.credit_card_bill} disabled={locked} onChange={(v) => update("credit_card_bill", v)} onBlur={handleSave} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PersonalFixedList
            name="Jairo"
            assignee="user1"
            expenses={personalFixedUser1}
            total={user1FixedTotal}
            locked={locked}
            onAdd={handleAddPersonalFixed}
            onDelete={handleDeleteExpense}
            isPending={isPending}
          />
          <PersonalFixedList
            name="Naroa"
            assignee="user2"
            expenses={personalFixedUser2}
            total={user2FixedTotal}
            locked={locked}
            onAdd={handleAddPersonalFixed}
            onDelete={handleDeleteExpense}
            isPending={isPending}
          />
        </div>
      </section>

      {/* Extra expenses */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted">
          Extra uitgaven ({currency(extraTotal)})
        </h2>
        <ul className="mb-3 flex flex-col gap-2">
          {extraExpenses.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl bg-canvas px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2.5 break-words">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ASSIGNEE_DOT[e.assignee] }} />
                {e.description} <span className="text-muted">· {ASSIGNEE_LABEL[e.assignee]}</span>
              </span>
              <div className="flex items-center gap-3">
                <span className="font-medium tabular-nums text-ink">{currency(Number(e.amount))}</span>
                {!locked && (
                  <button onClick={() => handleDeleteExpense(e.id)} className="press text-muted hover:text-shortfall">
                    Verwijderen
                  </button>
                )}
              </div>
            </li>
          ))}
          {extraExpenses.length === 0 && <li className="text-sm text-muted">Geen extra uitgaven deze maand.</li>}
        </ul>
        {!locked && (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="text-muted">Omschrijving</span>
              <input
                value={newExpense.description}
                onChange={(e) => setNewExpense((n) => ({ ...n, description: e.target.value }))}
                className="rounded-xl border border-border bg-card px-3 py-2 outline-none focus:border-dominant"
              />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-sm sm:flex-none">
                <span className="text-muted">Bedrag</span>
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense((n) => ({ ...n, amount: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 outline-none focus:border-dominant sm:w-28"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-sm sm:flex-none">
                <span className="text-muted">Wie</span>
                <select
                  value={newExpense.assignee}
                  onChange={(e) =>
                    setNewExpense((n) => ({ ...n, assignee: e.target.value as typeof n.assignee }))
                  }
                  className="rounded-xl border border-border bg-card px-3 py-2 outline-none focus:border-dominant"
                >
                  <option value="joint">Gezamenlijk</option>
                  <option value="user1">Jairo</option>
                  <option value="user2">Naroa</option>
                </select>
              </label>
            </div>
            <button
              onClick={handleAddExpense}
              disabled={isPending}
              className="press rounded-xl bg-dominant px-4 py-2 text-sm font-medium text-dominant-ink hover:bg-dominant-soft"
            >
              Toevoegen
            </button>
          </div>
        )}
      </section>

      {!locked && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="press rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink hover:brightness-95 disabled:opacity-50"
          >
            {isPending ? "Bezig met opslaan…" : "Maand opslaan"}
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
      )}
    </div>
  );
}
