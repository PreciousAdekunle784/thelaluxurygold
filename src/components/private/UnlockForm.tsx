"use client";

import { useActionState } from "react";
import { Loader2, Lock } from "lucide-react";
import { unlockPrivate, type UnlockState } from "@/app/(store)/private/actions";

export function UnlockForm() {
  const [state, action, pending] = useActionState<UnlockState, FormData>(unlockPrivate, undefined);
  return (
    <form action={action} className="mx-auto mt-10 w-full max-w-md">
      <label htmlFor="private-code" className="sr-only">
        Private access code
      </label>
      <input
        id="private-code"
        name="code"
        autoComplete="one-time-code"
        autoCapitalize="characters"
        spellCheck={false}
        required
        placeholder="Enter your private access code"
        aria-invalid={!!state?.error}
        aria-describedby={state?.error ? "private-error" : undefined}
        className="h-14 w-full border border-ivory/30 bg-ivory/5 px-5 text-center font-display text-xl tracking-[0.12em] text-ivory outline-none transition-colors placeholder:font-sans placeholder:text-[0.8rem] placeholder:tracking-[0.14em] placeholder:text-ivory/45 focus:border-gold-pale"
      />
      <button
        type="submit"
        disabled={pending}
        className="mt-4 inline-flex h-14 w-full items-center justify-center gap-3 bg-champagne text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-ink transition-colors hover:bg-gold disabled:opacity-60"
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Lock size={14} strokeWidth={1.5} />} Unlock private access
      </button>
      <p role="alert" id="private-error" className="mt-5 min-h-5 text-center text-sm leading-relaxed text-gold-pale">
        {state?.error}
      </p>
    </form>
  );
}
