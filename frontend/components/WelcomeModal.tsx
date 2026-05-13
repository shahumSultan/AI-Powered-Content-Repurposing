"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "cc_welcome_seen";

const STEPS = [
  {
    icon: (
      <svg className="h-8 w-8 text-cf-violet" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
      </svg>
    ),
    title: "Add your API key",
    body: (
      <>
        <p className="text-sm text-zinc-400 leading-relaxed">
          ContentCube uses your own AI key to generate content — nothing is shared. Head to{" "}
          <strong className="text-zinc-200">Settings</strong> and paste in your{" "}
          <strong className="text-zinc-200">Groq</strong> or{" "}
          <strong className="text-zinc-200">OpenAI</strong> key. Your key is encrypted at rest.
        </p>
        <a
          href="https://console.groq.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-cf-violet hover:underline"
        >
          Get a free Groq key →
        </a>
      </>
    ),
  },
  {
    icon: (
      <svg className="h-8 w-8 text-cf-cyan" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
      </svg>
    ),
    title: "Paste your content",
    body: (
      <p className="text-sm text-zinc-400 leading-relaxed">
        On the <strong className="text-zinc-200">Generate</strong> page you have three input options:
        <br /><br />
        <span className="text-zinc-300">URLs</span> — paste a YouTube video or any blog/article link.
        <br />
        <span className="text-zinc-300">Raw Text</span> — paste a transcript, notes, or any text.
        <br />
        <span className="text-zinc-300">Audio</span> — upload an MP3/WAV/M4A file (up to 25 MB).
      </p>
    ),
  },
  {
    icon: (
      <svg className="h-8 w-8 text-cf-pink" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    ),
    title: "Generate & export",
    body: (
      <p className="text-sm text-zinc-400 leading-relaxed">
        Hit <strong className="text-zinc-200">Generate Content Pack →</strong> and wait a few seconds. You&apos;ll get:
        <br /><br />
        <span className="text-zinc-300">Hooks</span> — attention-grabbing opening lines.
        <br />
        <span className="text-zinc-300">LinkedIn posts</span> — professional posts with a CTA.
        <br />
        <span className="text-zinc-300">Instagram captions</span> — short captions with hashtags.
        <br />
        <span className="text-zinc-300">Shorts ideas</span> — scripted video concepts.
        <br /><br />
        Copy individual items or download the full pack as <strong className="text-zinc-200">CSV / JSON</strong>.
      </p>
    ),
  },
];

export default function WelcomeModal() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
      router.push("/dashboard/settings");
    }
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-cf-violet/20 bg-cf-panel p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 text-zinc-500 transition hover:text-zinc-300"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-cf-violet">
          Welcome to ContentCube
        </p>

        {/* Step dots */}
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-6 bg-cf-violet"
                  : i < step
                  ? "w-2 bg-cf-violet/50"
                  : "w-2 bg-cf-panel-alt"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-cf-violet/15 bg-cf-panel-alt">
            {current.icon}
          </div>
          <h2 className="text-lg font-bold text-zinc-100">{current.title}</h2>
          <div>{current.body}</div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={dismiss}
            className="text-sm text-zinc-500 transition hover:text-zinc-300"
          >
            Skip tour
          </button>
          <button
            onClick={handleNext}
            className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            {isLast ? "Go to Settings →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
