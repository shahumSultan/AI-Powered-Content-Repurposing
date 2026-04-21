"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AUTH_COOKIE } from "@/lib/auth";

interface UserInfo {
  id: string;
  email: string;
  full_name: string | null;
}

export default function NavbarAuthButtons() {
  const [user, setUser] = useState<UserInfo | null | undefined>(undefined);

  useEffect(() => {
    // Check auth by calling the Next.js API proxy (reads httpOnly cookie server-side)
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) {
    return <div className="h-9 w-24 animate-pulse rounded-lg bg-cf-panel-alt" />;
  }

  if (user) {
    const displayName = user.full_name || user.email || "Account";
    const initial = displayName[0].toUpperCase();
    const firstName = displayName.split(" ")[0];

    return (
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="hidden text-xs text-zinc-400 transition hover:text-zinc-100 md:block">
          {firstName}
        </Link>
        <Link href="/dashboard">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cf-violet text-xs font-bold text-white transition hover:bg-cf-violet/80">
            {initial}
          </div>
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/";
          }}
          className="text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/auth/login" className="btn-gradient rounded-lg px-4 py-2 text-sm font-semibold text-white">
        Sign in
      </Link>
      <Link href="/auth/signup" className="btn-gradient rounded-lg px-4 py-2 text-sm font-semibold text-white">
        Sign up free
      </Link>
    </div>
  );
}
