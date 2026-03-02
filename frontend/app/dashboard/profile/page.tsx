import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EditNameForm from "@/components/dashboard/EditNameForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const displayName =
    (user.user_metadata?.full_name as string) || user.email || "Account";
  const initial = displayName[0].toUpperCase();
  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-zinc-100">Profile</h1>
      <p className="mb-8 text-sm text-zinc-500">Manage your account details.</p>

      {/* Avatar + info card */}
      <div className="mb-6 flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-violet-700 text-2xl font-bold text-white">
          {initial}
        </div>
        <div>
          <p className="text-base font-semibold text-zinc-100">{displayName}</p>
          <p className="text-sm text-zinc-400">{user.email}</p>
          <p className="mt-1 text-xs text-zinc-500">Member since {memberSince}</p>
        </div>
      </div>

      {/* Edit name */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-100">Edit profile</h2>
        <EditNameForm currentName={displayName} />

        <div className="mt-6 border-t border-zinc-800 pt-5">
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Email address
          </label>
          <p className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-400">
            {user.email}
          </p>
          <p className="mt-1.5 text-xs text-zinc-600">
            Email cannot be changed here. Contact support if needed.
          </p>
        </div>
      </div>
    </div>
  );
}
