// OAuth callback no longer needed — auth is handled by FastAPI.
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.redirect("/auth/login");
}
