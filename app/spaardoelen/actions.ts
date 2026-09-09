"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function withdrawFromSavingsPot(input: { pot_id: string; amount: number; description: string }) {
  if (input.amount <= 0) throw new Error("Bedrag moet groter dan 0 zijn.");

  const supabase = await createClient();
  const { error } = await supabase.from("savings_transactions").insert({
    pot_id: input.pot_id,
    amount: -input.amount,
    description: input.description,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/spaardoelen");
  revalidatePath("/dashboard");
}
