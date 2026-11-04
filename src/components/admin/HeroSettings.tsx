"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Upload } from "lucide-react";
import { MediaImage } from "@/components/ui/MediaImage";
import { uploadImageAction } from "@/app/admin/(panel)/products/actions";
import { setHeroImage } from "@/app/admin/(panel)/settings/actions";
import { adminBtnOutline, adminBtnPrimary } from "./ui";

type SlotKey = "heroDesktop" | "heroMobile";

function Slot({ slot, title, hint, current, fallback, aspect }: { slot: SlotKey; title: string; hint: string; current?: string; fallback: string; aspect: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const upload = (file: File | undefined) => {
    if (!file) return;
    start(async () => {
      setMsg(null);
      const fd = new FormData();
      fd.set("file", file);
      fd.set("purpose", "hero");
      const res = await uploadImageAction(fd);
      if (!res.ok) {
        setMsg({ ok: false, text: res.error });
        return;
      }
      await setHeroImage(slot, res.key);
      setMsg({ ok: true, text: "Published — the homepage now uses this image." });
      router.refresh();
    });
  };

  const reset = () =>
    start(async () => {
      await setHeroImage(slot, null);
      setMsg({ ok: true, text: "Restored the campaign image." });
      router.refresh();
    });

  return (
    <section className="border border-line bg-white">
      <div className="border-b border-line px-5 py-3.5">
        <h2 className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]">{title}</h2>
        <p className="mt-1 text-xs text-stone">{hint}</p>
      </div>
      <div className="space-y-4 p-5">
        <div className={`relative overflow-hidden bg-forest ${aspect}`}>
          <MediaImage mediaKey={current ?? fallback} alt="" sizes="600px" className="object-cover" />
          <span className="absolute left-3 top-3 bg-ink/70 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-ivory">
            {current ? "Your photo" : "Default: campaign image"}
          </span>
        </div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" aria-label={`Upload ${title}`} onChange={(e) => upload(e.target.files?.[0])} />
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className={adminBtnPrimary}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload new image
          </button>
          {current && (
            <button type="button" disabled={busy} onClick={reset} className={adminBtnOutline}>
              <RotateCcw size={14} /> Use the campaign image
            </button>
          )}
        </div>
        {msg && <p className={msg.ok ? "text-sm text-forest" : "text-sm text-burgundy"}>{msg.text}</p>}
      </div>
    </section>
  );
}

export function HeroSettings({ desktop, mobile }: { desktop?: string; mobile?: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <Slot
        slot="heroDesktop"
        title="Hero background — desktop"
        hint="Landscape photo, at least 2400 px wide. The headline sits on the left, so keep the subject towards the right."
        current={desktop}
        fallback="campaign/hero-desktop"
        aspect="aspect-[12/7]"
      />
      <Slot
        slot="heroMobile"
        title="Hero background — phones (optional)"
        hint="Portrait photo, at least 1080 × 1600 px. If empty, the desktop image is used. The headline sits at the bottom on phones, so keep the subject in the upper half."
        current={mobile}
        fallback={desktop ?? "campaign/hero-mobile"}
        aspect="aspect-[27/40]"
      />
    </div>
  );
}
