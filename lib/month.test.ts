import assert from "node:assert/strict";
import { test } from "node:test";
import { currentMonth, parseMonthParams } from "./month.ts";

test("currentMonth uses Amsterdam time, not UTC", () => {
  // 23:30 UTC on 31 Oct is already 00:30 on 1 Nov in Amsterdam (CET, UTC+1).
  assert.deepEqual(currentMonth(new Date("2026-10-31T23:30:00Z")), { month: 11, year: 2026 });
  // Summer time (CEST, UTC+2): 22:30 UTC on 31 Jul is 00:30 on 1 Aug.
  assert.deepEqual(currentMonth(new Date("2026-07-31T22:30:00Z")), { month: 8, year: 2026 });
  assert.deepEqual(currentMonth(new Date("2026-12-31T23:30:00Z")), { month: 1, year: 2027 });
});

test("parseMonthParams falls back to the current month", () => {
  const now = new Date("2026-10-15T12:00:00Z");
  assert.deepEqual(parseMonthParams({}, now), { month: 10, year: 2026 });
  assert.deepEqual(parseMonthParams({ month: "3" }, now), { month: 3, year: 2026 });
  assert.deepEqual(parseMonthParams({ month: "2", year: "2027" }, now), { month: 2, year: 2027 });
});

test("parseMonthParams rejects values the database would refuse", () => {
  const now = new Date("2026-10-15T12:00:00Z");
  for (const params of [
    { month: "0" },
    { month: "13" },
    { month: "abc" },
    { month: "1.5" },
    { month: "-1" },
    { month: "" },
    { year: "1999" },
    { year: "2101" },
    { year: "20260" },
    { year: "NaN" },
  ]) {
    assert.equal(parseMonthParams(params, now), null, JSON.stringify(params));
  }
});
