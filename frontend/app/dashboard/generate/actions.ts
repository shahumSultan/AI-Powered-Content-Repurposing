"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function recordGeneration(urls: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("generation_history").insert({ user_id: user.id, urls });

  const { data: plan } = await supabase
    .from("user_plans")
    .select("gens_used, period_start")
    .eq("user_id", user.id)
    .single();

  if (plan) {
    const daysSince =
      (Date.now() - new Date(plan.period_start).getTime()) / 86_400_000;
    if (daysSince > 30) {
      await supabase
        .from("user_plans")
        .update({ gens_used: 1, period_start: new Date().toISOString() })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("user_plans")
        .update({ gens_used: plan.gens_used + 1 })
        .eq("user_id", user.id);
    }
  }

  revalidatePath("/dashboard/generate");
  revalidatePath("/dashboard/plan");
  revalidatePath("/dashboard/insights");
}
