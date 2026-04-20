"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/auth";

export async function updateDisplayName(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const name = (formData.get("name") as string).trim();
  if (!name) return { error: "Name cannot be empty." };

  const res = await apiFetch("/auth/me", {
    method: "PATCH",
    body: JSON.stringify({ full_name: name }),
  });

  if (!res.ok) {
    const data = await res.json();
    return { error: data.detail ?? "Failed to update name." };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}
