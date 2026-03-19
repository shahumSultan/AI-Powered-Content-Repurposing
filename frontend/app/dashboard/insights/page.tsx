import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
  const lastSignIn = user.last_sign_in_at ? formatDate(user.last_sign_in_at) : "N/A";

  // Fetch generation history
  const { data: history } = await supabase
    .from("generation_history")
    .select("urls, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = history ?? [];
  const totalPacks = rows.length;
  const allUrls = rows.flatMap((r) => r.urls as string[]);
  const youtubeCount = allUrls.filter(
    (u) => u.includes("youtube.com") || u.includes("youtu.be"),
  ).length;
  const blogCount = allUrls.length - youtubeCount;
  // Each pack generates hooks(10) + linkedin(5) + twitter(10) + ig(5) + shorts(10) = 40
  const totalPosts = totalPacks * 40;

  const metricCards = [
    { label: "Content Packs Generated", value: String(totalPacks), unit: "packs" },
    { label: "YouTube Links Processed", value: String(youtubeCount), unit: "videos" },
    { label: "Blog Links Processed", value: String(blogCount), unit: "articles" },
    { label: "Total Posts Created", value: String(totalPosts), unit: "posts" },
  ];

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
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-zinc-100">Usage metrics</h2>
        <div className="grid grid-cols-2 gap-3">
          {metricCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="mb-2 text-2xl font-bold text-zinc-100">{card.value}</p>
              <p className="text-xs font-medium text-zinc-400">{card.label}</p>
              <p className="text-xs text-zinc-600">{card.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent history */}
      {rows.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-100">Recent generations</h2>
          <div className="space-y-2">
            {rows.slice(0, 10).map((row, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="mb-1 text-xs text-zinc-500">{formatDate(row.created_at)}</p>
                {(row.urls as string[]).map((url, j) => (
                  <p key={j} className="truncate text-xs text-zinc-400">{url}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
