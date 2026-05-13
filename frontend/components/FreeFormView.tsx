"use client";

import { useState } from "react";

export default function FreeFormView({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-content.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-xl border border-cf-violet/20 bg-cf-panel overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cf-violet/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-300">Custom Output</span>
          <span className="rounded-full bg-cf-violet/10 px-2 py-0.5 text-xs text-cf-violet">
            Free-form
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-3 py-1.5 text-xs text-zinc-400 transition hover:border-cf-violet/50 hover:text-zinc-200"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download .txt
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-3 py-1.5 text-xs text-zinc-400 transition hover:border-cf-violet/50 hover:text-zinc-200"
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copy all
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[36rem] overflow-y-auto px-5 py-4">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-200">
          {text}
        </pre>
      </div>
    </div>
  );
}
