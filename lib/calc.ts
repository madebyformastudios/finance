// Couple Finance Tracker — calculation engine (PRD §3.3)
//
// User 1 pays every bill out of their income first. Whatever User 2 has left
// after covering any shortfall gets split: 50% savings, 25% back to User 1,
// 25% back to User 2. If User 2's income can't cover the shortfall, savings
// and payouts drop to zero and the remainder is reported as a couple-level
// deficit for the month instead of going negative.

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

export function calculate(input: CalcInput): CalcResult {
  const {
    user1Income,
    user2Income,
    user1Fixed,
    user2Fixed,
    jointFixed,
    jointGroceries,
    extraExpenses,
    creditCardBill,
  } = input;

  // Step 1: Total Liability
  const totalExpenses =
    jointFixed + jointGroceries + user1Fixed + user2Fixed + extraExpenses + creditCardBill;

  // Step 2: User 1 (primary payer) position
  const user1Balance = user1Income - totalExpenses;

  // Step 3: Shortfall & User 2 distribution
  const shortfall = user1Balance < 0 ? Math.abs(user1Balance) : 0;
  const user2RemainingRaw = user1Balance < 0 ? user2Income - shortfall : user2Income;

  // Edge case not specified by the PRD: User 2's income can't absorb the
  // shortfall. Floor the distributable amount at 0 and surface the gap as a
  // deficit rather than paying out/saving a negative number.
  const user2Remaining = Math.max(0, user2RemainingRaw);
  const deficit = user2RemainingRaw < 0 ? Math.abs(user2RemainingRaw) : 0;

  const savings = user2Remaining * 0.5;
  const user1Payout = user2Remaining * 0.25;
  const user2Payout = user2Remaining * 0.25;

  return {
    totalExpenses,
    user1Balance,
    shortfall,
    user2Remaining,
    savings,
    user1Payout,
    user2Payout,
    deficit,
  };
}
