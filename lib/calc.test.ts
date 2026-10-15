import assert from "node:assert/strict";
import { test } from "node:test";
import { calculate, calculateMonth, type CalcInput } from "./calc.ts";

const base: CalcInput = {
  user1Income: 0,
  user2Income: 0,
  user1Fixed: 0,
  user2Fixed: 0,
  jointFixed: 0,
  jointGroceries: 0,
  extraExpenses: 0,
  creditCardBill: 0,
};

test("surplus: user 2 income is split 50/25/25", () => {
  const r = calculate({ ...base, user1Income: 3000, user2Income: 2000, jointFixed: 1000 });
  assert.equal(r.totalExpenses, 1000);
  assert.equal(r.user1Balance, 2000);
  assert.equal(r.shortfall, 0);
  assert.equal(r.user2Remaining, 2000);
  assert.deepEqual([r.savings, r.user1Payout, r.user2Payout, r.deficit], [1000, 500, 500, 0]);
});

test("shortfall: user 2 covers what user 1 can't, then splits the rest", () => {
  const r = calculate({ ...base, user1Income: 1000, user2Income: 2000, jointFixed: 1500 });
  assert.equal(r.shortfall, 500);
  assert.equal(r.user2Remaining, 1500);
  assert.deepEqual([r.savings, r.user1Payout, r.user2Payout], [750, 375, 375]);
});

test("deficit: user 2 can't cover the shortfall, nothing is split", () => {
  const r = calculate({ ...base, user1Income: 1000, user2Income: 200, jointFixed: 1500 });
  assert.equal(r.shortfall, 500);
  assert.equal(r.deficit, 300);
  assert.deepEqual([r.user2Remaining, r.savings, r.user1Payout, r.user2Payout], [0, 0, 0, 0]);
});

test("odd cents: the three parts always add up exactly and never hold half-cents", () => {
  for (const remaining of [100.01, 100.03, 0.01, 0.02, 0.03, 1234.57]) {
    const r = calculate({ ...base, user2Income: remaining });
    const cents = (n: number) => Math.round(n * 100);
    assert.equal(cents(r.savings) + cents(r.user1Payout) + cents(r.user2Payout), cents(remaining));
    for (const part of [r.savings, r.user1Payout, r.user2Payout]) {
      assert.equal(part, Math.round(part * 100) / 100);
    }
  }
  // The case from the audit: the amount shown as "to allocate" is allocatable.
  assert.equal(calculate({ ...base, user2Income: 100.01 }).savings, 50.01);
});

test("float noise does not leak into totals", () => {
  const r = calculate({ ...base, jointFixed: 0.1, jointGroceries: 0.2 });
  assert.equal(r.totalExpenses, 0.3);
});

test("a missing or invalid amount counts as 0, not NaN", () => {
  const r = calculate({ ...base, user1Income: NaN, user2Income: 100, jointFixed: Number("abc") });
  assert.equal(r.totalExpenses, 0);
  assert.equal(r.user2Remaining, 100);
});

test("calculateMonth sums expenses by type and assignee (amounts may arrive as strings)", () => {
  const r = calculateMonth(
    { user1_income: 3000, user2_income: 2000, joint_fixed: 1000, joint_groceries: 200, credit_card_bill: 100 },
    [
      { type: "personal_fixed", assignee: "user1", amount: 50.5 },
      { type: "personal_fixed", assignee: "user1", amount: 20 },
      { type: "personal_fixed", assignee: "user2", amount: "30" as unknown as number },
      { type: "extra", assignee: "joint", amount: 10 },
      { type: "extra", assignee: "user1", amount: 5 },
    ],
  );
  assert.equal(r.user1Fixed, 70.5);
  assert.equal(r.user2Fixed, 30);
  assert.equal(r.extraExpenses, 15);
  assert.equal(r.totalExpenses, 1000 + 200 + 100 + 70.5 + 30 + 15);
});
