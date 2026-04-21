"use client";

import { useState } from "react";

interface Props {
  isPro: boolean;
  hasSubscription: boolean;
}

export default function StripeButtons({ isPro, hasSubscription }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(plan: "beginner" | "pro") {
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Failed to start checkout");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  }

  async function handleManageBilling() {
    setLoading("portal");
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Failed to open billing portal");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {hasSubscription && (
        <button
          onClick={handleManageBilling}
          disabled={loading !== null}
          className="w-full rounded-lg border border-cf-violet/25 bg-cf-panel-alt py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-cf-panel-alt/80 hover:text-white disabled:opacity-50"
        >
          {loading === "portal" ? "Opening portal…" : "Manage Billing →"}
        </button>
      )}

      {!isPro && (
        <button
          onClick={() => handleUpgrade("pro")}
          disabled={loading !== null}
          className="btn-primary w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading === "pro" ? "Redirecting to Stripe…" : "Upgrade to Pro — $14/month →"}
        </button>
      )}

      {!isPro && !hasSubscription && (
        <button
          onClick={() => handleUpgrade("beginner")}
          disabled={loading !== null}
          className="w-full rounded-lg border border-cf-violet/25 bg-cf-panel-alt py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-cf-panel-alt/80 hover:text-white disabled:opacity-50"
        >
          {loading === "beginner" ? "Redirecting to Stripe…" : "Start Beginner plan — $7/month"}
        </button>
      )}
    </div>
  );
}
