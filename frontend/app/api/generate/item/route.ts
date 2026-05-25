import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { BACKEND_URL } from "@/lib/config";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  // Fetch user settings to forward API keys
  const settingsRes = await fetch(`${BACKEND_URL}/user/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const settings = settingsRes.ok ? await settingsRes.json() : null;

  const backendHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const usingOpenai = settings?.preferred_provider === "openai";
  if (usingOpenai && settings?.openai_api_key) {
    backendHeaders["X-Openai-Api-Key"] = settings.openai_api_key;
  } else if (settings?.groq_api_key) {
    backendHeaders["X-Groq-Api-Key"] = settings.groq_api_key;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/generate/item`, {
      method: "POST",
      headers: backendHeaders,
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
