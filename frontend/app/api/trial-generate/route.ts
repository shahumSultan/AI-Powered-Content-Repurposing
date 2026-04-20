import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/config";

const COOKIE_NAME = "cf_trial";

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  // Admin preview bypass
  const bypassSecret = process.env.ADMIN_PREVIEW_SECRET;
  const providedSecret = req.headers.get("x-preview-secret");
  if (bypassSecret && providedSecret === bypassSecret) {
    const body = await req.json();
    try {
      const upstream = await fetch(`${BACKEND_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await upstream.json();
      if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
    }
  }

  // Fast cookie check
  const cookieUsed = req.cookies.get(COOKIE_NAME)?.value === "1";

  const ip = getClientIp(req);
  const ipHash = await sha256hex(ip);

  // Check DB via backend
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

  // Record trial usage in DB after successful generation
  fetch(`${BACKEND_URL}/trial/record`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ip_hash: ipHash }),
  }).catch(() => {});

  const res = NextResponse.json(data);
  res.cookies.set(COOKIE_NAME, "1", { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return res;
}
