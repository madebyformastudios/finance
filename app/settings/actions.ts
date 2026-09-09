"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveCoupleSettings(input: {
  joint_fixed: number;
  joint_groceries: number;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("couple_settings").update(input).eq("id", true);
  if (error) throw new Error(error.message);

  // Also push the new values into every unlocked month, not just future
  // ones — otherwise a change here silently has no visible effect until
  // the next month is created, which reads as "this setting does nothing".
  const { error: monthsError } = await supabase
    .from("monthly_records")
    .update(input)
    .eq("locked_status", false);
  if (monthsError) throw new Error(monthsError.message);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/history");
}
