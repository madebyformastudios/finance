"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { actionError, INVALID_INPUT, isMoney, type ActionResult } from "@/lib/actions";

export async function withdrawFromSavingsPot(input: {
  pot_id: string;
  amount: number;
  description: string;
}): Promise<ActionResult> {
  if (!isMoney(input.amount) || input.amount <= 0) return INVALID_INPUT;

  // A withdrawal larger than the balance is refused by the database
  // (savings_pots.current_balance >= 0), even if two tabs race.
  const supabase = await createClient();
  const { error } = await supabase.from("savings_transactions").insert({
    pot_id: input.pot_id,
    amount: -input.amount,
    description: String(input.description ?? ""),
  });

  if (error) return actionError(error);
  revalidatePath("/spaardoelen");
  revalidatePath("/dashboard");
  return {};
}
