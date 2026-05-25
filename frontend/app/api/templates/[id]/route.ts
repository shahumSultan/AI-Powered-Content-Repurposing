import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { BACKEND_URL } from "@/lib/config";

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const res = await fetch(`${BACKEND_URL}/user/templates/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const res = await fetch(`${BACKEND_URL}/user/templates/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
