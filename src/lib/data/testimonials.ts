/** Client testimonials, managed in Admin → Testimonials and stored in site settings. */
export interface Testimonial {
  id: string;
  quote: string;
  /** How the client is credited, e.g. "Amaka O." */
  name: string;
  /** Optional detail, e.g. "Lagos · Signet ring". */
  detail?: string;
  published: boolean;
}

export function parseTestimonials(raw?: string): Testimonial[] {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list)
      ? list
          .filter((t) => t && typeof t.quote === "string" && typeof t.name === "string")
          .map((t) => ({ id: String(t.id), quote: t.quote, name: t.name, detail: t.detail || undefined, published: !!t.published }))
      : [];
  } catch {
    return [];
  }
}
