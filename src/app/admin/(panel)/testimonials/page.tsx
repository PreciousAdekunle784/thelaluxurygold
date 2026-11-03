import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHeader } from "@/components/admin/ui";
import { TestimonialsManager } from "@/components/admin/TestimonialsManager";
import { getSettings } from "@/lib/repo/settings";
import { parseTestimonials } from "@/lib/data/testimonials";

export const instant = false;
export const metadata: Metadata = { title: "Testimonials" };

export default async function TestimonialsPage() {
  await connection();
  const s = await getSettings(["testimonials"]);
  return (
    <>
      <PageHeader
        title="Testimonials"
        subtitle="Words from real clients, shown on the homepage. Only publish feedback a client actually gave, credited the way they agreed to."
      />
      <TestimonialsManager items={parseTestimonials(s.testimonials)} />
    </>
  );
}
