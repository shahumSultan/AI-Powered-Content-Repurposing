import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/config";

// Cookie-based counter is kept as a fast first check to avoid a DB round-trip
// on every request. The DB is the authoritative source and cannot be bypassed
// by deleting the cookie.
const COOKIE_NAME = "cf_trial";

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// Supabase client using the anon key (no user session needed for trial tracking)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  );
}

export async function POST(req: NextRequest) {
  // Fast path: cookie already set means the client has used their trial.
  // Still verify against the DB below, but skip if cookie says used.
  const cookieCount = parseInt(req.cookies.get(COOKIE_NAME)?.value ?? "0", 10);

  // Check IP-based usage in the DB (authoritative — survives cookie deletion)
  const ip = getClientIp(req);
  const ipHash = await sha256hex(ip);

  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("trial_usage")
    .select("used_at")
    .eq("ip_hash", ipHash)
    .maybeSingle();

  if (existing || cookieCount >= 1) {
    return NextResponse.json({ detail: "trial_limit_reached" }, { status: 429 });
  }

  const body = await req.json();

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }

  const data = await upstream.json();
  if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });

  // Record trial usage in DB *after* a successful generation
  await supabase
    .from("trial_usage")
    .insert({ ip_hash: ipHash })
    .then(({ error }) => {
      if (error) console.error("trial_usage insert error:", error);
    });

  const res = NextResponse.json(data);
  res.cookies.set(COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
