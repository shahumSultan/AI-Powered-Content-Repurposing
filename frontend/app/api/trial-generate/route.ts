import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/config";

const COOKIE_NAME = "cf_trial";

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getClientIp(req: NextRequest): string {
  // Trust the rightmost non-private IP in x-forwarded-for (Vercel/Railway inject this)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((s) => s.trim());
    return ips[0] ?? "unknown";
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  // Fast cookie check before hitting the DB
  const cookieUsed = req.cookies.get(COOKIE_NAME)?.value === "1";

  const ip = getClientIp(req);
  const ipHash = await sha256hex(ip);

  const checkRes = await fetch(`${BACKEND_URL}/trial/check?ip_hash=${encodeURIComponent(ipHash)}`);
  const { used: dbUsed } = checkRes.ok ? await checkRes.json() : { used: false };

  if (dbUsed || cookieUsed) {
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

  fetch(`${BACKEND_URL}/trial/record`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ip_hash: ipHash }),
  }).catch(() => {});

  const res = NextResponse.json(data);
  res.cookies.set(COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
