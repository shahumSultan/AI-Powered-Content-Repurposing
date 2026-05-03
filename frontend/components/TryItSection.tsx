import AnimateOnScroll from "./AnimateOnScroll";
import TryItForm from "./TryItForm";

export default function TryItSection() {
  return (
    <section id="try-it" className="relative overflow-hidden px-6 py-24">
      {/* Background radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(169,46,46,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <AnimateOnScroll delay="0ms" className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cf-cyan/30 bg-cf-cyan/10 px-3 py-1 text-xs font-medium text-cf-cyan">
              Live Demo
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll delay="100ms">
            <h2 className="display-font mt-4 text-3xl font-extrabold tracking-tight text-zinc-100 md:text-4xl">Try It Now</h2>
            <p className="mt-3 text-zinc-400">
              Paste a link below and see your content pack in under a minute — no account needed.
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              You&apos;ll get hooks, LinkedIn posts, Instagram captions and Shorts ideas — all written and ready to copy.
            </p>
          </AnimateOnScroll>
        </div>

        {/* Product UI frame */}
        <AnimateOnScroll delay="200ms">
          <div
            className="rounded-2xl border border-cf-violet/14 bg-cf-panel/80 p-2 backdrop-blur-sm"
            style={{ boxShadow: "0 25px 80px rgba(169,46,46,0.1)" }}
          >
            {/* Fake browser chrome */}
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-cf-panel-alt/60 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-cf-pink/60" />
              <div className="h-3 w-3 rounded-full bg-cf-cyan/60" />
              <div className="ml-4 flex-1 rounded-md bg-cf-panel/80 px-3 py-1 font-mono text-xs text-zinc-600">
                contentcube.ai/generate
              </div>
            </div>

            {/* Actual form */}
            <div className="p-6">
              <TryItForm />
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
