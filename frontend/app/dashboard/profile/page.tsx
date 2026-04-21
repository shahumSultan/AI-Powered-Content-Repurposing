import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import EditNameForm from "@/components/dashboard/EditNameForm";

export default async function ProfilePage() {
  const res = await apiFetch("/auth/me");
  if (!res.ok) redirect("/auth/login");
  const user: AuthUser = await res.json();

  const displayName = user.full_name || user.email || "Account";
  const initial = displayName[0].toUpperCase();
  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 display-font text-2xl font-bold text-zinc-100">Profile</h1>
      <p className="mb-8 text-sm text-zinc-500">Manage your account details.</p>

      <div className="mb-6 flex items-center gap-4 rounded-xl border border-cf-violet/14 bg-cf-panel p-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cf-violet to-cf-pink text-2xl font-bold text-white">
          {initial}
        </div>
        <div>
          <p className="text-base font-semibold text-zinc-100">{displayName}</p>
          <p className="text-sm text-zinc-400">{user.email}</p>
          <p className="mt-1 text-xs text-zinc-500">Member since {memberSince}</p>
        </div>
      </div>

      <div className="rounded-xl border border-cf-violet/14 bg-cf-panel p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-100">Edit profile</h2>
        <EditNameForm currentName={displayName} />
        <div className="mt-6 border-t border-cf-violet/14 pt-5">
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email address</label>
          <p className="rounded-lg border border-cf-violet/25 bg-cf-panel-alt/50 px-4 py-2.5 text-sm text-zinc-400">{user.email}</p>
          <p className="mt-1.5 text-xs text-zinc-600">Email cannot be changed here. Contact support if needed.</p>
        </div>
      </div>
    </div>
  );
}
