"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface RecordFieldsInput {
  id: string;
  user1_income: number;
  user2_income: number;
  user1_fixed: number;
  user2_fixed: number;
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
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    monthly_record_id: input.monthly_record_id,
    type: "extra",
    description: input.description,
    amount: input.amount,
    assignee: input.assignee,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/history");
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/history");
}
