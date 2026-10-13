"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface RecordFieldsInput {
  id: string;
  user1_income: number;
  user2_income: number;
  joint_fixed: number;
  joint_groceries: number;
  credit_card_bill: number;
}

export async function saveMonthlyRecord(input: RecordFieldsInput) {
  const supabase = await createClient();
  const { id, ...fields } = input;

  const { error } = await supabase
    .from("monthly_records")
    .update(fields)
    .eq("id", id)
    .eq("locked_status", false);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/history");
}

export async function toggleLock(id: string, locked: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_records")
    .update({ locked_status: locked })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/history");
}

export async function addExpense(input: {
  monthly_record_id: string;
  description: string;
  amount: number;
  assignee: "user1" | "user2" | "joint";
  type?: "extra" | "personal_fixed";
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    monthly_record_id: input.monthly_record_id,
    type: input.type ?? "extra",
    description: input.description,
    amount: input.amount,
    assignee: input.assignee,
  });

  if (error) throw new Error(error.message);
  if (input.type === "personal_fixed") await markPersonalFixedManaged(input.monthly_record_id);
  revalidatePath("/dashboard");
  revalidatePath("/history");
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { data: deleted, error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .select("monthly_record_id, type")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (deleted?.type === "personal_fixed") await markPersonalFixedManaged(deleted.monthly_record_id);
  revalidatePath("/dashboard");
  revalidatePath("/history");
}

// Once someone edits a month's fixed costs by hand, carry-forward must never
// run for that month again (it would resurrect a deliberate deletion).
async function markPersonalFixedManaged(monthlyRecordId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_records")
    .update({ personal_fixed_cloned: true })
    .eq("id", monthlyRecordId);
  if (error) throw new Error(error.message);
}

export async function createSavingsPot(input: { name: string; target_amount: number | null }) {
  const supabase = await createClient();
  const { error } = await supabase.from("savings_pots").insert(input);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/spaardoelen");
}

export async function allocateToSavingsPot(input: {
  pot_id: string;
  monthly_record_id: string;
  amount: number;
  description: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("savings_transactions").insert(input);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/spaardoelen");
}
