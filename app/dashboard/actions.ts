"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { actionError, INVALID_INPUT, isMoney, type ActionResult } from "@/lib/actions";
import { calculateMonth } from "@/lib/calc";

const RECORD_FIELDS = ["user1_income", "user2_income", "joint_fixed", "joint_groceries", "credit_card_bill"];
const ASSIGNEES = ["user1", "user2", "joint"];

export type RecordField =
  | "user1_income"
  | "user2_income"
  | "joint_fixed"
  | "joint_groceries"
  | "credit_card_bill";

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/history");
}

// Saves one field, never the whole row: a tab that has been open for a while
// must not overwrite what the other person changed in the meantime.
export async function saveMonthlyRecord(id: string, field: RecordField, value: number): Promise<ActionResult> {
  if (!RECORD_FIELDS.includes(field) || !isMoney(value)) return INVALID_INPUT;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_records")
    .update({ [field]: value })
    .eq("id", id)
    .eq("locked_status", false)
    .select("id");

  if (error) return actionError(error);
  if (data.length === 0) return { error: "Deze maand is vergrendeld." };
  refresh();
  return {};
}

export async function toggleLock(id: string, locked: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("monthly_records").update({ locked_status: locked }).eq("id", id);

  if (error) return actionError(error);
  refresh();
  return {};
}

export async function addExpense(input: {
  monthly_record_id: string;
  description: string;
  amount: number;
  assignee: "user1" | "user2" | "joint";
  type?: "extra" | "personal_fixed";
}): Promise<ActionResult> {
  const description = String(input.description ?? "").trim();
  const type = input.type ?? "extra";
  if (
    !description ||
    !isMoney(input.amount) ||
    input.amount === 0 ||
    !ASSIGNEES.includes(input.assignee) ||
    !["extra", "personal_fixed"].includes(type)
  ) {
    return INVALID_INPUT;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    monthly_record_id: input.monthly_record_id,
    type,
    description,
    amount: input.amount,
    assignee: input.assignee,
  });

  if (error) return actionError(error);
  if (type === "personal_fixed") {
    const result = await markPersonalFixedManaged(input.monthly_record_id);
    if (result.error) return result;
  }
  refresh();
  return {};
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: deleted, error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .select("monthly_record_id, type")
    .maybeSingle();

  if (error) return actionError(error);
  // No row back: it is already gone, or the month is locked (RLS hides it).
  if (!deleted) return { error: "Kon dit item niet verwijderen. Is de maand vergrendeld?" };
  if (deleted.type === "personal_fixed") {
    const result = await markPersonalFixedManaged(deleted.monthly_record_id);
    if (result.error) return result;
  }
  refresh();
  return {};
}

// Once someone edits a month's fixed costs by hand, carry-forward must never
// run for that month again (it would resurrect a deliberate deletion).
async function markPersonalFixedManaged(monthlyRecordId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_records")
    .update({ personal_fixed_cloned: true })
    .eq("id", monthlyRecordId);
  return error ? actionError(error) : {};
}

export async function createSavingsPot(input: {
  name: string;
  target_amount: number | null;
}): Promise<ActionResult> {
  const name = String(input.name ?? "").trim();
  const target = input.target_amount;
  if (!name || (target !== null && (!isMoney(target) || target <= 0))) return INVALID_INPUT;

  const supabase = await createClient();
  const { error } = await supabase.from("savings_pots").insert({ name, target_amount: target });

  if (error) return actionError(error);
  revalidatePath("/dashboard");
  revalidatePath("/spaardoelen");
  return {};
}

export async function allocateToSavingsPot(input: {
  pot_id: string;
  monthly_record_id: string;
  amount: number;
  description: string;
}): Promise<ActionResult> {
  if (!isMoney(input.amount) || input.amount <= 0) return INVALID_INPUT;

  const supabase = await createClient();

  // The browser also checks this, but a stale tab can't know what the other
  // person already allocated, so the limit is re-derived from saved data.
  const monthId = input.monthly_record_id;
  const [record, expenses, allocated] = await Promise.all([
    supabase.from("monthly_records").select("*").eq("id", monthId).maybeSingle(),
    supabase.from("expenses").select("type, assignee, amount").eq("monthly_record_id", monthId),
    supabase.from("savings_transactions").select("amount").eq("monthly_record_id", monthId),
  ]);
  const failed = record.error ?? expenses.error ?? allocated.error;
  if (failed) return actionError(failed);
  if (!record.data) return INVALID_INPUT;

  const toCents = (n: number) => Math.round(n * 100);
  const left =
    toCents(calculateMonth(record.data, expenses.data ?? []).savings) -
    (allocated.data ?? []).reduce((sum, t) => sum + toCents(Number(t.amount)), 0);
  if (toCents(input.amount) > left) return { error: "Dit is hoger dan het nog te verdelen bedrag." };

  const { error } = await supabase.from("savings_transactions").insert({
    pot_id: input.pot_id,
    monthly_record_id: input.monthly_record_id,
    amount: input.amount,
    description: String(input.description ?? ""),
  });

  if (error) return actionError(error);
  revalidatePath("/dashboard");
  revalidatePath("/spaardoelen");
  return {};
}
