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
          className="w-full rounded-lg border border-cf-violet/25 bg-cf-panel-alt px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-cf-violet focus:ring-2 focus:ring-cf-violet/20"
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
          className="btn-primary rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
