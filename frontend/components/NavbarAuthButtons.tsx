"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/auth/actions";

export default function zNavbarAuthButtons() {
  // undefined = still loading, null = not logged in, User = logged in
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Render a placeholder while we check session to avoid layout shift
  if (user === undefined) {
    return <div className="h-9 w-24 animate-pulse rounded-lg bg-zinc-800" />;
  }

  if (user) {
    const displayName =
      (user.user_metadata?.full_name as string) || user.email || "Account";
    const initial = displayName[0].toUpperCase();
    const firstName = displayName.split(" ")[0];

    return (
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="hidden text-xs text-zinc-400 transition hover:text-zinc-100 md:block"
        >
          {firstName}
        </Link>
        <Link href="/dashboard">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white transition hover:bg-orange-500">
            {initial}
          </div>
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-zinc-400 transition hover:text-zinc-200"
          >
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/auth/login"
        className="btn-gradient rounded-lg px-4 py-2 text-sm font-semibold text-white"
      >
        Sign in
      </Link>
      <Link
        href="/auth/signup"
        className="btn-gradient rounded-lg px-4 py-2 text-sm font-semibold text-white"
      >
        Sign up free
      </Link>
    </div>
  );
}
