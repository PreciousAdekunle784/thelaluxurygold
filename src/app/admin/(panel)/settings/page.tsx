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
      <PageHeader title="Homepage hero" subtitle="By default the homepage plays the looping LA Luxury Gold film. Upload a photo to show it instead — changes are published immediately." />
      <HeroSettings desktop={s.heroDesktop || undefined} mobile={s.heroMobile || undefined} />
      <p className="mt-6 max-w-2xl text-xs leading-relaxed text-stone">
        A soft dark gradient is applied on the left (desktop) and bottom (phones) so the headline stays readable on any photo. JPG, PNG, WebP or AVIF up to 15 MB —
        large photos are resized automatically.
      </p>
    </>
  );
}
