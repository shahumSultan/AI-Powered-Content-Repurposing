"use client";

import { useActionState } from "react";
import { updateDisplayName } from "@/app/dashboard/actions";

export default function EditNameForm({ currentName }: { currentName: string }) {
  const [state, action, pending] = useActionState(updateDisplayName, null);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
          Display name
        </label>
        <input
          type="text"
          name="name"
          required
          defaultValue={currentName}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-400">Name updated successfully.</p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
