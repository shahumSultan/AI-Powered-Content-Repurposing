import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { BACKEND_URL } from "@/lib/config";

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${BACKEND_URL}/user/templates`, { headers: authHeaders(token) });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const res = await fetch(`${BACKEND_URL}/user/templates`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
