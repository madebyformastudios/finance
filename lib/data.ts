import { createClient } from "@/lib/supabase/server";
import type { CoupleSettings, Expense, MonthlyRecord } from "@/lib/types";

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
  if (existing) return existing;

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
      user1_fixed: settings.user1_fixed_default,
      user2_fixed: settings.user2_fixed_default,
      joint_fixed: settings.joint_fixed,
      joint_groceries: settings.joint_groceries,
      credit_card_bill: 0,
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();

  if (insertError) throw new Error(insertError.message);
  return created;
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
