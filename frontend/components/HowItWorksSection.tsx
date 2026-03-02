import AnimateOnScroll from "./AnimateOnScroll";

const STEPS = [
  {
    number: "01",
    title: "Paste Your Links",
    description:
      "Drop in a YouTube video or blog link. You can mix both in the same run.",
    detail: "youtube.com, youtu.be, and any article URL",
  },
  {
    number: "02",
    title: "We Pull Out the Best Parts",
    description:
      "We extract the transcript or text, find the strongest ideas and turn them into platform-ready drafts.",
    detail: "No copy-pasting. No formatting. No manual rewriting.",
  },
  {
    number: "03",
    title: "Download Your Content Pack",
    description:
      "Get hooks, LinkedIn posts, Instagram captions and short-video ideas - ready to publish.",
    detail: "Export as CSV or JSON in one click.",
  },
];

const DELAYS = ["0ms", "150ms", "300ms"];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-6 py-24">
      {/* Section header */}
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <AnimateOnScroll delay="0ms">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-400">
            How It Works
          </p>
          <h2 className="text-3xl font-bold text-zinc-100 md:text-4xl">
            From long-form content to ready-to-post social content
          </h2>
          <p className="mt-4 text-zinc-400">Three steps. No setup.</p>
        </AnimateOnScroll>
      </div>

      {/* Steps */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <AnimateOnScroll key={step.number} delay={DELAYS[i]}>
            <div className="flex flex-col items-start">
              {/* Number bubble */}
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 font-mono text-lg font-bold text-violet-400">
                {step.number}
              </div>
              <h3 className="mb-3 text-lg font-semibold text-zinc-100">{step.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{step.description}</p>
              <p className="mt-3 text-xs text-zinc-600">{step.detail}</p>
            </div>
          </AnimateOnScroll>
        ))}
      </div>
    </section>
  );
}
