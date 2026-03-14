"use server";

import { createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function hash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const password = (formData.get("password") as string) ?? "";
  const expected = process.env.ADMIN_PASSWORD ?? "";

  if (!expected || hash(password) !== hash(expected)) {
    return { error: "Invalid password" };
  }

  (await cookies()).set("admin_token", hash(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete("admin_token");
  redirect("/");
}
