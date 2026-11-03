"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { getSettings, setSetting } from "@/lib/repo/settings";
import { publishSettings } from "@/lib/server/publish-settings";
import { parseTestimonials, type Testimonial } from "@/lib/data/testimonials";

async function readTestimonials() {
  const s = await getSettings(["testimonials"]);
  return parseTestimonials(s.testimonials);
}

async function writeTestimonials(list: Testimonial[]) {
  await setSetting("testimonials", JSON.stringify(list));
  publishSettings("/admin/testimonials");
}

export interface TestimonialInput {
  id?: string;
  quote: string;
  name: string;
  detail?: string;
  published: boolean;
}

export async function saveTestimonial(input: TestimonialInput): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const quote = String(input.quote ?? "").trim();
  const name = String(input.name ?? "").trim();
  const detail = String(input.detail ?? "").trim();
  if (quote.length < 10) return { ok: false, error: "The testimonial is too short." };
  if (quote.length > 600) return { ok: false, error: "Keep the testimonial under 600 characters." };
  if (!name || name.length > 60) return { ok: false, error: "Add the client's name as they agreed to be credited (max 60 characters)." };
  if (detail.length > 80) return { ok: false, error: "Keep the detail under 80 characters." };
  const list = await readTestimonials();
  const entry: Testimonial = { id: input.id || `t${Date.now().toString(36)}`, quote, name, detail: detail || undefined, published: !!input.published };
  const i = list.findIndex((t) => t.id === entry.id);
  if (i >= 0) list[i] = entry;
  else list.unshift(entry);
  await writeTestimonials(list);
  return { ok: true };
}

export async function removeTestimonial(id: string) {
  await requireAdmin();
  const list = await readTestimonials();
  await writeTestimonials(list.filter((t) => t.id !== id));
}

export async function setTestimonialPublished(id: string, published: boolean) {
  await requireAdmin();
  const list = await readTestimonials();
  await writeTestimonials(list.map((t) => (t.id === id ? { ...t, published } : t)));
}
