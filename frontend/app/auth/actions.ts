"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AUTH_COOKIE } from "@/lib/auth";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
  secure: process.env.NODE_ENV === "production",
};

export async function signUp(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string).trim();
  const password = formData.get("password") as string;

  const res = await fetch(`${BACKEND}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name: name }),
  });

  const data = await res.json();
  if (!res.ok) return { error: data.detail ?? "Registration failed" };

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, data.access_token, COOKIE_OPTS);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signIn(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = (formData.get("email") as string).trim();
  const password = formData.get("password") as string;

  const res = await fetch(`${BACKEND}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) return { error: data.detail ?? "Login failed" };

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, data.access_token, COOKIE_OPTS);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  revalidatePath("/", "layout");
  redirect("/");
}
