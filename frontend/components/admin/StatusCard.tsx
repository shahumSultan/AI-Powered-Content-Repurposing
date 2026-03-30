"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/lib/config";

type Status = "loading" | "ok" | "error";

function StatusDot({ status }: { status: Status }) {
  return (
    <span
      className={
        status === "ok"
          ? "inline-block h-2.5 w-2.5 rounded-full bg-emerald-400"
          : status === "loading"
          ? "inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400"
          : "inline-block h-2.5 w-2.5 rounded-full bg-red-500"
      }
    />
  );
}

export default function StatusCard() {
  const [health, setHealth] = useState<Status>("loading");
  const [ready, setReady] = useState<Status>("loading");
  const base = BACKEND_URL;

  async function refresh() {
    setHealth("loading");
    setReady("loading");

    try {
      const res = await fetch(`${base}/health`, { cache: "no-store" });
      setHealth(res.ok ? "ok" : "error");
    } catch {
      setHealth("error");
    }

    try {
      const res = await fetch(`${base}/ready`, { cache: "no-store" });
      setReady(res.ok ? "ok" : "error");
    } catch {
      setReady("error");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const label: Record<Status, string> = {
    loading: "Checking…",
    ok: "OK",
    error: "Error",
  };

  const rows: { label: string; status: Status }[] = [
    { label: "Health (/health)", status: health },
    { label: "Model ready (/ready)", status: ready },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-300">Backend Status</h2>
        <button
          onClick={refresh}
          className="text-xs text-zinc-500 transition hover:text-zinc-300"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {rows.map(({ label: l, status }) => (
          <div key={l} className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{l}</span>
            <span className="flex items-center gap-2">
              <StatusDot status={status} />
              <span className="text-xs font-medium text-zinc-300">
                {label[status]}
              </span>
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 truncate text-xs text-zinc-600">{base}</p>
    </div>
  );
}
