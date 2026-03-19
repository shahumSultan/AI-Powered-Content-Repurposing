import { NextRequest, NextResponse } from "next/server";

const TRIAL_LIMIT = 1;
const COOKIE_NAME = "cf_trial";

export async function POST(req: NextRequest) {
  const count = parseInt(req.cookies.get(COOKIE_NAME)?.value ?? "0", 10);

  if (count >= TRIAL_LIMIT) {
    return NextResponse.json({ detail: "trial_limit_reached" }, { status: 429 });
  }

  const body = await req.json();
  const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  let upstream: Response;
  try {
    upstream = await fetch(`${backendUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }

  const data = await upstream.json();
  if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });

  const res = NextResponse.json(data);
  res.cookies.set(COOKIE_NAME, String(count + 1), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
