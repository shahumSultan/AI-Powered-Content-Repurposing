import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import DashboardNav from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const displayName =
    (user.user_metadata?.full_name as string) || user.email || "Account";
  const initial = displayName[0].toUpperCase();
  const email = user.email ?? "";

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Top bar on mobile */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-pink-500">
            <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-zinc-100">ContentFlow</span>
        </Link>
        <span className="text-xs text-zinc-400">{displayName.split(" ")[0]}</span>
      </div>

      <div className="flex">
        {/* Sidebar — desktop */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 md:flex" style={{ minHeight: "100vh" }}>
          {/* Logo */}
          <div className="border-b border-zinc-800 px-5 py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-pink-500">
                <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-zinc-100">ContentFlow</span>
            </Link>
          </div>

          {/* User info */}
          <div className="border-b border-zinc-800 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-700 text-sm font-bold text-white">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-100">{displayName}</p>
                <p className="truncate text-xs text-zinc-500">{email}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div className="flex-1 px-3 py-4">
            <DashboardNav />
          </div>

          {/* Sign out */}
          <div className="border-t border-zinc-800 px-5 py-4">
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-100"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
                Sign out
              </button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
          {children}
        </main>
      </div>

      {/* Bottom nav on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-zinc-800 bg-zinc-900 md:hidden">
        {[
          { href: "/dashboard/profile", label: "Profile" },
          { href: "/dashboard/plan", label: "Plan" },
          { href: "/dashboard/billing", label: "Billing" },
          { href: "/dashboard/insights", label: "Insights" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center py-3 text-xs text-zinc-400 hover:text-zinc-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
