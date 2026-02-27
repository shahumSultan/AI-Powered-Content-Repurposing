import GenerateForm from "@/components/GenerateForm";
import IngestTabs from "@/components/IngestTabs";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-2 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Content Repurposer
          </h1>
          <p className="text-sm text-zinc-500">
            Paste YouTube or blog URLs to generate a full content pack
          </p>
        </div>

        {/* Primary — generate */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
          <GenerateForm />
        </section>

        {/* Secondary — raw ingestion testing */}
        <details className="group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition select-none">
              <svg
                className="h-3 w-3 transition-transform group-open:rotate-90"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Test Ingestion Endpoints
            </div>
          </summary>
          <div className="mt-4">
            <IngestTabs />
          </div>
        </details>
      </div>
    </main>
  );
}
