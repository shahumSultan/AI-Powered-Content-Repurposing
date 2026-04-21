"use client";

import { useState } from "react";
import YouTubeForm from "./YouTubeForm";
import BlogForm from "./BlogForm";

type Tab = "youtube" | "blog";

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "youtube", label: "YouTube", icon: "▶" },
  { id: "blog", label: "Blog / Article", icon: "📄" },
];

export default function IngestTabs() {
  const [active, setActive] = useState<Tab>("youtube");

  return (
    <div className="rounded-xl border border-cf-violet/14 bg-cf-panel/50 p-6 backdrop-blur">
      <div className="mb-6 flex gap-1 rounded-lg bg-cf-panel-alt/60 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              active === tab.id
                ? "bg-cf-violet text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {active === "youtube" ? <YouTubeForm /> : <BlogForm />}
    </div>
  );
}
