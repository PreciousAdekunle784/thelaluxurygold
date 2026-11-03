"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { login } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const next = useSearchParams().get("next") ?? "/admin";
  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="mb-2 block text-[0.66rem] font-semibold uppercase tracking-[0.18em]">Password</span>
        <input type="password" name="password" required autoFocus autoComplete="current-password" className="field-boxed" />
      </label>
      {state?.error && <p role="alert" className="text-sm text-burgundy">{state.error}</p>}
      <button type="submit" disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 bg-ink text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-forest disabled:opacity-60">
        {pending ? <Loader2 size={15} className="animate-spin" /> : <Lock size={14} />} Sign in
      </button>
    </form>
  );
}
