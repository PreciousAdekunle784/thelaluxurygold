"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { Testimonial } from "@/lib/data/testimonials";
import { removeTestimonial, saveTestimonial, setTestimonialPublished } from "@/app/admin/(panel)/testimonials/actions";
import { adminBtnOutline, adminBtnPrimary } from "./ui";

const field = "w-full border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ink";
const label = "mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-stone";

type Draft = { id?: string; quote: string; name: string; detail: string; published: boolean };
const blank: Draft = { quote: "", name: "", detail: "", published: true };

function Editor({ initial, onDone }: { initial: Draft; onDone: () => void }) {
  const router = useRouter();
  const [d, setD] = useState(initial);
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await saveTestimonial(d);
      if (!res.ok) return setError(res.error);
      router.refresh();
      onDone();
    });

  return (
    <form
      className="space-y-4 border border-line bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label className="block">
        <span className={label}>Testimonial</span>
        <textarea name="quote" rows={4} maxLength={600} value={d.quote} onChange={(e) => setD({ ...d, quote: e.target.value })} className={field} placeholder="In the client's own words" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Credited as</span>
          <input name="name" maxLength={60} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className={field} placeholder="e.g. Amaka O." />
        </label>
        <label className="block">
          <span className={label}>Detail (optional)</span>
          <input name="detail" maxLength={80} value={d.detail} onChange={(e) => setD({ ...d, detail: e.target.value })} className={field} placeholder="e.g. Lagos · Signet ring" />
        </label>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" className="h-4 w-4" checked={d.published} onChange={(e) => setD({ ...d, published: e.target.checked })} /> Show on the homepage
      </label>
      {error && <p className="text-sm text-burgundy">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={adminBtnPrimary}>
          {busy && <Loader2 size={14} className="animate-spin" />} Save testimonial
        </button>
        <button type="button" onClick={onDone} className={adminBtnOutline}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Row({ t, onEdit }: { t: Testimonial; onEdit: () => void }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const act = (fn: () => Promise<void>) =>
    start(async () => {
      await fn();
      router.refresh();
    });
  return (
    <li className="flex flex-col gap-4 border border-line bg-white p-5 sm:flex-row sm:items-start">
      <div className="flex-1">
        <p className="text-sm leading-relaxed">“{t.quote}”</p>
        <p className="mt-2 text-xs text-stone">
          — {t.name}
          {t.detail && ` · ${t.detail}`}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className={t.published ? "bg-forest/10 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-forest" : "bg-sand px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-stone"}>
          {t.published ? "Live" : "Hidden"}
        </span>
        <button type="button" disabled={busy} onClick={() => act(() => setTestimonialPublished(t.id, !t.published))} className={adminBtnOutline} aria-label={t.published ? "Hide" : "Publish"}>
          {t.published ? <EyeOff size={14} /> : <Eye size={14} />} {t.published ? "Hide" : "Publish"}
        </button>
        <button type="button" disabled={busy} onClick={onEdit} className={adminBtnOutline} aria-label="Edit">
          <Pencil size={14} />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => confirm("Delete this testimonial?") && act(() => removeTestimonial(t.id))}
          className={adminBtnOutline}
          aria-label="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

export function TestimonialsManager({ items }: { items: Testimonial[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  return (
    <div className="max-w-4xl space-y-6">
      {editing === "new" ? (
        <Editor key="new" initial={blank} onDone={() => setEditing(null)} />
      ) : (
        <button type="button" onClick={() => setEditing("new")} className={adminBtnPrimary}>
          <Plus size={14} /> Add testimonial
        </button>
      )}
      {items.length === 0 ? (
        <p className="border border-dashed border-line bg-white p-8 text-center text-sm text-stone">
          No testimonials yet. The homepage section stays hidden until you publish one.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((t) =>
            editing === t.id ? (
              <li key={t.id}>
                <Editor initial={{ id: t.id, quote: t.quote, name: t.name, detail: t.detail ?? "", published: t.published }} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <Row key={t.id} t={t} onEdit={() => setEditing(t.id)} />
            ),
          )}
        </ul>
      )}
    </div>
  );
}
