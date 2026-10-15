// Couple Finance Tracker — calculation engine (PRD §3.3)
//
// User 1 pays every bill out of their income first. Whatever User 2 has left
// after covering any shortfall gets split: 50% savings, 25% back to User 1,
// 25% back to User 2. If User 2's income can't cover the shortfall, savings
// and payouts drop to zero and the remainder is reported as a couple-level
// deficit for the month instead of going negative.
//
// All maths runs in whole cents so amounts never carry half-cents and the
// three parts of the split always add up exactly to what was left over.

import type { Expense, MonthlyRecord } from "./types";

export interface CalcInput {
  user1Income: number;
  user2Income: number;
  user1Fixed: number;
  user2Fixed: number;
  jointFixed: number;
  jointGroceries: number;
  extraExpenses: number;
  creditCardBill: number;
}

export interface CalcResult {
  totalExpenses: number;
  user1Balance: number;
  shortfall: number;
  user2Remaining: number;
  savings: number;
  user1Payout: number;
  user2Payout: number;
  deficit: number; // > 0 when User 2's income can't cover the shortfall
}

const cents = (n: number) => Math.round(n * 100);

export function calculate(input: CalcInput): CalcResult {
  // Step 1: Total Liability
  const totalExpenses =
    cents(input.jointFixed) +
    cents(input.jointGroceries) +
    cents(input.user1Fixed) +
    cents(input.user2Fixed) +
    cents(input.extraExpenses) +
    cents(input.creditCardBill);

  // Step 2: User 1 (primary payer) position
  const user1Balance = cents(input.user1Income) - totalExpenses;

  // Step 3: Shortfall & User 2 distribution
  const shortfall = Math.max(0, -user1Balance);
  const user2RemainingRaw = cents(input.user2Income) - shortfall;

  // Edge case not specified by the PRD: User 2's income can't absorb the
  // shortfall. Floor the distributable amount at 0 and surface the gap as a
  // deficit rather than paying out/saving a negative number.
  const user2Remaining = Math.max(0, user2RemainingRaw);
  const deficit = Math.max(0, -user2RemainingRaw);

  // Odd cents go to savings first, then to User 1, so the parts sum exactly.
  const savings = Math.round(user2Remaining / 2);
  const rest = user2Remaining - savings;
  const user2Payout = Math.floor(rest / 2);
  const user1Payout = rest - user2Payout;

  return {
    totalExpenses: totalExpenses / 100,
    user1Balance: user1Balance / 100,
    shortfall: shortfall / 100,
    user2Remaining: user2Remaining / 100,
    savings: savings / 100,
    user1Payout: user1Payout / 100,
    user2Payout: user2Payout / 100,
    deficit: deficit / 100,
  };
}

type MonthFields = Pick<
  MonthlyRecord,
  "user1_income" | "user2_income" | "joint_fixed" | "joint_groceries" | "credit_card_bill"
>;

export interface MonthCalc extends CalcResult {
  user1Fixed: number;
  user2Fixed: number;
  extraExpenses: number;
}

// The one place that turns a month's fields + expense rows into numbers, used
// by both the dashboard and the history page so they can never disagree.
export function calculateMonth(
  fields: MonthFields,
  expenses: Pick<Expense, "type" | "assignee" | "amount">[],
): MonthCalc {
  const sum = (match: (e: Pick<Expense, "type" | "assignee">) => boolean) =>
    expenses.filter(match).reduce((total, e) => total + cents(Number(e.amount)), 0) / 100;

  const user1Fixed = sum((e) => e.type === "personal_fixed" && e.assignee === "user1");
  const user2Fixed = sum((e) => e.type === "personal_fixed" && e.assignee === "user2");
  const extraExpenses = sum((e) => e.type === "extra");

  return {
    ...calculate({
      user1Income: Number(fields.user1_income),
      user2Income: Number(fields.user2_income),
      user1Fixed,
      user2Fixed,
      jointFixed: Number(fields.joint_fixed),
      jointGroceries: Number(fields.joint_groceries),
      extraExpenses,
      creditCardBill: Number(fields.credit_card_bill),
    }),
    user1Fixed,
    user2Fixed,
    extraExpenses,
  };
}
