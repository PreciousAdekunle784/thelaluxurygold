"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { cx } from "@/lib/format";

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterForm({ tone = "ink", compact, source = "newsletter" }: { tone?: "ink" | "ivory"; compact?: boolean; source?: string }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    if (!consent) {
      setStatus("error");
      setMessage("Please confirm you would like to receive our emails.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, source }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setStatus("success");
      setMessage(data.message ?? "Thank you — you're on the list.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  const ivory = tone === "ivory";
  const id = `nl-${source}`;
  return (
    <form onSubmit={submit} noValidate className="w-full">
      <div className={cx("flex items-center border-b", ivory ? "border-ivory/40 focus-within:border-ivory" : "border-ink/40 focus-within:border-ink")}>
        <label htmlFor={id} className="sr-only">
          Email address
        </label>
        <input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          aria-invalid={status === "error"}
          aria-describedby={`${id}-msg`}
          className={cx("w-full bg-transparent py-3.5 text-[0.95rem] outline-none", ivory ? "placeholder:text-ivory/50" : "placeholder:text-stone")}
        />
        <button type="submit" disabled={status === "loading"} className={cx("flex shrink-0 items-center gap-2 py-3 pl-4 text-[0.66rem] font-semibold uppercase tracking-[0.24em] transition-opacity hover:opacity-70 disabled:opacity-50")}>
          {status === "loading" ? <Loader2 size={15} className="animate-spin" /> : status === "success" ? <Check size={15} /> : null}
          {compact ? <ArrowRight size={16} strokeWidth={1.3} aria-label="Subscribe" /> : "Subscribe"}
        </button>
      </div>
      <label className={cx("mt-4 flex cursor-pointer items-start gap-3 text-[0.75rem] leading-relaxed", ivory ? "text-ivory/65" : "text-stone")}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--color-champagne)]" />
        I would like to receive news about collections and releases. Unsubscribe at any time.
      </label>
      <p id={`${id}-msg`} role="status" className={cx("mt-3 min-h-5 text-[0.8rem]", status === "error" ? (ivory ? "text-gold-pale" : "text-burgundy") : ivory ? "text-ivory/80" : "text-forest")}>
        {status === "success" || status === "error" ? message : ""}
      </p>
    </form>
  );
}
