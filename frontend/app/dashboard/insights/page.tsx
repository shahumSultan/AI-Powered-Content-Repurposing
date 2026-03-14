import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const metricCards = [
  { label: "Content Packs Generated", value: "0", unit: "packs" },
  { label: "YouTube Links Processed", value: "0", unit: "videos" },
  { label: "Blog Links Processed", value: "0", unit: "articles" },
  { label: "Total Posts Created", value: "0", unit: "posts" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const memberSince = formatDate(user.created_at);
  const lastSignIn = user.last_sign_in_at
    ? formatDate(user.last_sign_in_at)
    : "N/A";

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-zinc-100">Insights</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Your account activity and usage statistics.
      </p>

      {/* Account stats */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="mb-1 text-xs font-medium text-zinc-500">Member since</p>
          <p className="text-sm font-semibold text-zinc-100">{memberSince}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="mb-1 text-xs font-medium text-zinc-500">Last sign-in</p>
          <p className="text-sm font-semibold text-zinc-100">{lastSignIn}</p>
        </div>
      </div>

      {/* Usage metrics */}
      <div className="mb-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-100">Usage metrics</h2>
        <div className="grid grid-cols-2 gap-3">
          {metricCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <p className="mb-2 text-2xl font-bold text-zinc-100">{card.value}</p>
              <p className="text-xs font-medium text-zinc-400">{card.label}</p>
              <p className="text-xs text-zinc-600">{card.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Coming soon note */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <p className="text-xs text-zinc-500">
            Detailed analytics — including per-URL breakdowns, content type distribution, and generation history — are coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
