"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { actionError, INVALID_INPUT, isMoney, type ActionResult } from "@/lib/actions";
import { currentMonth } from "@/lib/month";

export async function saveCoupleSettings(input: {
  joint_fixed: number;
  joint_groceries: number;
}): Promise<ActionResult> {
  const { joint_fixed, joint_groceries } = input;
  if (!isMoney(joint_fixed) || !isMoney(joint_groceries)) return INVALID_INPUT;
  const values = { joint_fixed, joint_groceries };

  const supabase = await createClient();
  const { error } = await supabase.from("couple_settings").update(values).eq("id", true);
  if (error) return actionError(error);

  // Also push the new values into the current and upcoming unlocked months,
  // not just future ones — otherwise a change here silently has no visible
  // effect until the next month is created. Past months keep what they had,
  // so history doesn't change after the fact.
  const { month, year } = currentMonth();
  const { error: monthsError } = await supabase
    .from("monthly_records")
    .update(values)
    .eq("locked_status", false)
    .or(`year.gt.${year},and(year.eq.${year},month.gte.${month})`);
  if (monthsError) return actionError(monthsError);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  return {};
}
