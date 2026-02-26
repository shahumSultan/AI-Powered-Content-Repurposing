import IngestTabs from "@/components/IngestTabs";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 text-center">
          <h1 className="mb-2 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Content Repurposer
          </h1>
          <p className="text-sm text-zinc-500">
            Extract transcripts and article text from any URL
          </p>
        </div>
        <IngestTabs />
      </div>
    </main>
  );
}
