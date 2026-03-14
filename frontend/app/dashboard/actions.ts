"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateDisplayName(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const name = (formData.get("name") as string).trim();
  if (!name) return { error: "Name cannot be empty." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { full_name: name },
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/profile");
  return { success: true };
}
