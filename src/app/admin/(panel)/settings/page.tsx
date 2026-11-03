import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHeader } from "@/components/admin/ui";
import { HeroSettings } from "@/components/admin/HeroSettings";
import { getSettings } from "@/lib/repo/settings";

export const instant = false;
export const metadata: Metadata = { title: "Homepage hero" };

export default async function SettingsPage() {
  await connection();
  const s = await getSettings(["heroDesktop", "heroMobile"]);
  return (
    <>
      <PageHeader title="Homepage hero" subtitle="Change the large background photo at the top of the homepage. Uploads are published immediately." />
      <HeroSettings desktop={s.heroDesktop || undefined} mobile={s.heroMobile || undefined} />
      <p className="mt-6 max-w-2xl text-xs leading-relaxed text-stone">
        A soft dark gradient is applied on the left (desktop) and top (phones) so the headline stays readable on any photo. JPG, PNG, WebP or AVIF up to 15 MB —
        large photos are resized automatically.
      </p>
    </>
  );
}
