"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setNgnRate } from "@/app/admin/(panel)/settings/actions";
import { adminBtnPrimary } from "./ui";

export function RateSettings({ rate }: { rate: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(rate));
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const n = Number(value);

  const save = () =>
    start(async () => {
      setMsg(null);
      const res = await setNgnRate(n);
      setMsg(res.ok ? { ok: true, text: "Saved — naira prices across the store now use this rate." } : { ok: false, text: res.error });
      if (res.ok) router.refresh();
    });

  return (
    <section className="border border-line bg-white">
      <div className="border-b border-line px-5 py-3.5">
        <h2 className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]">Currency — US dollar / Naira</h2>
        <p className="mt-1 text-xs text-stone">
          Product prices are set in US dollars. Shoppers can switch to naira; this rate converts the prices they see (naira amounts are rounded to the nearest ₦100).
        </p>
      </div>
      <form
        className="flex flex-wrap items-end gap-3 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-stone">Naira per US$1</span>
          <span className="flex h-10 items-center border border-line bg-white focus-within:border-ink">
            <span className="px-3 text-sm text-stone">₦</span>
            <input
              name="ngnPerUsd"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))}
              className="h-full w-32 bg-transparent pr-3 text-sm outline-none"
              aria-label="Naira per US dollar"
            />
          </span>
        </label>
        <button type="submit" disabled={busy || !(n > 0)} className={adminBtnPrimary}>
          {busy && <Loader2 size={14} className="animate-spin" />} Save rate
        </button>
        {n > 0 && <p className="w-full text-xs text-stone">Example: a $925 piece shows as ₦{(Math.round((925 * n) / 100) * 100).toLocaleString("en-NG")}.</p>}
        {msg && <p className={msg.ok ? "w-full text-sm text-forest" : "w-full text-sm text-burgundy"}>{msg.text}</p>}
      </form>
    </section>
  );
}
