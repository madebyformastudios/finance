import { createClient } from "@/lib/supabase/server";
import type { CoupleSettings, Expense, MonthlyRecord, SavingsAllocation } from "@/lib/types";

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

  const { data: existing, error: fetchError } = await supabase
    .from("monthly_records")
    .select("*")
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  if (existing) {
    await resolvePersonalFixedCarryForward(existing);
    return existing;
  }

  const settings = await getCoupleSettings();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: created, error: insertError } = await supabase
    .from("monthly_records")
    .insert({
      month,
      year,
      user1_income: 0,
      user2_income: 0,
      joint_fixed: settings.joint_fixed,
      joint_groceries: settings.joint_groceries,
      credit_card_bill: 0,
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();

  if (insertError) throw new Error(insertError.message);

  await resolvePersonalFixedCarryForward(created);
  return created;
}

// Carries personal_fixed expenses forward from the nearest prior month that
// has any, resolved lazily on first visit to a month (not just at creation
// time — months can get created empty by browsing forward before earlier
// months are filled in). Runs at most once per month: `personal_fixed_cloned`
// is set afterward regardless of whether anything was found, so a later
// deliberate deletion is never re-cloned back in.
async function resolvePersonalFixedCarryForward(record: MonthlyRecord): Promise<void> {
  if (record.personal_fixed_cloned) return;

  const supabase = await createClient();

  const { data: priorRecords, error: priorError } = await supabase
    .from("monthly_records")
    .select("id, month, year")
    .or(`year.lt.${record.year},and(year.eq.${record.year},month.lt.${record.month})`)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(24);

  if (priorError) throw new Error(priorError.message);

  if (priorRecords && priorRecords.length > 0) {
    const priorExpenses = await getExpensesForRecords(priorRecords.map((r) => r.id));
    const personalFixedByRecord = new Map<string, Expense[]>();
    for (const e of priorExpenses) {
      if (e.type !== "personal_fixed") continue;
      const list = personalFixedByRecord.get(e.monthly_record_id) ?? [];
      list.push(e);
      personalFixedByRecord.set(e.monthly_record_id, list);
    }

    const nearestWithItems = priorRecords.find((r) => (personalFixedByRecord.get(r.id)?.length ?? 0) > 0);
    if (nearestWithItems) {
      const items = personalFixedByRecord.get(nearestWithItems.id)!;
      const { error: insertError } = await supabase.from("expenses").insert(
        items.map((e) => ({
          monthly_record_id: record.id,
          type: "personal_fixed" as const,
          description: e.description,
          amount: e.amount,
          assignee: e.assignee,
        })),
      );
      if (insertError) throw new Error(insertError.message);
    }
  }

  const { error: flagError } = await supabase
    .from("monthly_records")
    .update({ personal_fixed_cloned: true })
    .eq("id", record.id);

  if (flagError) throw new Error(flagError.message);
  record.personal_fixed_cloned = true;
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

export async function getAllMonthlyRecords(): Promise<MonthlyRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_records")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getExpensesForRecords(recordIds: string[]): Promise<Expense[]> {
  if (recordIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .in("monthly_record_id", recordIds);

  if (error) throw new Error(error.message);
  return data;
}

export async function getSavingsAllocationsForRecord(recordId: string): Promise<SavingsAllocation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("savings_allocations")
    .select("*")
    .eq("monthly_record_id", recordId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
