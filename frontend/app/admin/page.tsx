import { logoutAction } from "./actions";
import StatusCard from "@/components/admin/StatusCard";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#8500FA] to-[#DD578B]">
            <svg viewBox="0 0 20 20" fill="white" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-100">Admin Dashboard</h1>
            <p className="text-xs text-zinc-500">ContentFlow</p>
          </div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-cf-violet/14 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-cf-violet/25 hover:text-zinc-200"
          >
            Sign out
          </button>
        </form>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatusCard />
      </div>
    </div>
  );
}
