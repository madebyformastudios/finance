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
  revalidatePath("/settings");
}
