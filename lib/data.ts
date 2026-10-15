import { createClient } from "@/lib/supabase/server";
import type { CoupleSettings, Expense, MonthlyRecord, SavingsPot, SavingsTransaction } from "@/lib/types";

// The proxy already verified the session; this only reads the email for display.
export async function getUserEmail(): Promise<string | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.email;
}

export async function getCoupleSettings(): Promise<CoupleSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("couple_settings")
    .select("*")
    .eq("id", true)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getOrCreateMonthlyRecord(
  month: number,
  year: number,
): Promise<MonthlyRecord> {
  const supabase = await createClient();
  const fetchRecord = () =>
    supabase.from("monthly_records").select("*").eq("month", month).eq("year", year).maybeSingle();

  let { data: record, error } = await fetchRecord();
  if (error) throw new Error(error.message);

  if (!record) {
    const settings = await getCoupleSettings();
    const { error: insertError } = await supabase.from("monthly_records").insert({
      month,
      year,
      user1_income: 0,
      user2_income: 0,
      joint_fixed: settings.joint_fixed,
      joint_groceries: settings.joint_groceries,
      credit_card_bill: 0,
    });
    // 23505 = unique violation: another request created this month first, so
    // just read the row it made.
    if (insertError && insertError.code !== "23505") throw new Error(insertError.message);

    ({ data: record, error } = await fetchRecord());
    if (error || !record) throw new Error(error?.message ?? "Maand kon niet worden aangemaakt.");
  }

  await resolvePersonalFixedCarryForward(record);
  return record;
}

// Carries personal_fixed expenses forward from the nearest prior month that
// has any, resolved lazily on visit (not just at creation time — months can
// get created empty by browsing forward before earlier months are filled in).
// `personal_fixed_cloned` is only set once the month has its own items
// (cloned, or already present), never when there was simply nothing to clone
// yet — otherwise a month visited before its predecessor was filled in would
// stay empty forever. It's also set when the user adds/deletes a fixed cost
// by hand, so a deliberate deletion is never re-cloned back in.
// Locked months are never touched: their expenses can no longer change.
async function resolvePersonalFixedCarryForward(record: MonthlyRecord): Promise<void> {
  if (record.personal_fixed_cloned || record.locked_status) return;

  const supabase = await createClient();

  const { count: ownCount, error: ownError } = await supabase
    .from("expenses")
    .select("id", { count: "exact", head: true })
    .eq("monthly_record_id", record.id)
    .eq("type", "personal_fixed");

  if (ownError) throw new Error(ownError.message);

  if ((ownCount ?? 0) === 0) {
    const items = await findPersonalFixedToClone(record);
    if (!items) return;

    // Claim the month before inserting: the update only changes a row for one
    // request, so two simultaneous visits can't both clone.
    if (!(await claimPersonalFixed(record.id))) return;

    const { error: insertError } = await supabase.from("expenses").insert(
      items.map((e) => ({
        monthly_record_id: record.id,
        type: "personal_fixed" as const,
        description: e.description,
        amount: e.amount,
        assignee: e.assignee,
      })),
    );
    if (insertError) {
      await supabase.from("monthly_records").update({ personal_fixed_cloned: false }).eq("id", record.id);
      throw new Error(insertError.message);
    }
  } else {
    await claimPersonalFixed(record.id);
  }

  record.personal_fixed_cloned = true;
}

async function claimPersonalFixed(recordId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_records")
    .update({ personal_fixed_cloned: true })
    .eq("id", recordId)
    .eq("personal_fixed_cloned", false)
    .select("id");

  if (error) throw new Error(error.message);
  return data.length > 0;
}

async function findPersonalFixedToClone(record: MonthlyRecord): Promise<Expense[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_records")
    .select("id, expenses(*)")
    .or(`year.lt.${record.year},and(year.eq.${record.year},month.lt.${record.month})`)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(24);

  if (error) throw new Error(error.message);

  for (const prior of (data ?? []) as { id: string; expenses: Expense[] }[]) {
    const items = prior.expenses.filter((e) => e.type === "personal_fixed");
    if (items.length > 0) return items;
  }
  return null;
}

export async function getExpensesForRecord(recordId: string): Promise<Expense[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("monthly_record_id", recordId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export type MonthlyRecordWithExpenses = MonthlyRecord & { expenses: Expense[] };

// One query with the expenses embedded: no long id list in the URL, and the
// API's row cap applies to months, not to every expense row.
export async function getAllMonthlyRecords(): Promise<MonthlyRecordWithExpenses[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_records")
    .select("*, expenses(*)")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getSavingsPots(): Promise<SavingsPot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("savings_pots").select("*").order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getSavingsTransactionsForRecord(recordId: string): Promise<SavingsTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("savings_transactions")
    .select("*")
    .eq("monthly_record_id", recordId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getRecentSavingsTransactions(limit = 100): Promise<SavingsTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("savings_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}
