import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHeader } from "@/components/admin/ui";
import { HeroSettings } from "@/components/admin/HeroSettings";
import { RateSettings } from "@/components/admin/RateSettings";
import { getSettings } from "@/lib/repo/settings";
import { DEFAULT_NGN_PER_USD } from "@/lib/config/store";

export const instant = false;
export const metadata: Metadata = { title: "Store settings" };

export default async function SettingsPage() {
  await connection();
  const s = await getSettings(["heroDesktop", "heroMobile", "ngnPerUsd"]);
  const rate = Number(s.ngnPerUsd) > 0 ? Number(s.ngnPerUsd) : DEFAULT_NGN_PER_USD;
  return (
    <>
      <PageHeader title="Store settings" subtitle="Exchange rate and homepage hero — changes are published immediately." />
      <div className="mb-8 max-w-3xl">
        <RateSettings rate={rate} />
      </div>
      <h2 className="mb-4 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone">Homepage hero</h2>
      <p className="mb-4 max-w-2xl text-sm text-stone">By default the homepage shows the LA Luxury Gold campaign image. Upload a photo — for example a campaign shot of a model wearing your pieces — to show it instead.</p>
      <HeroSettings desktop={s.heroDesktop || undefined} mobile={s.heroMobile || undefined} />
      <p className="mt-6 max-w-2xl text-xs leading-relaxed text-stone">
        A soft dark gradient is applied on the left (desktop) and bottom (phones) so the headline stays readable on any photo. JPG, PNG, WebP or AVIF up to 15 MB —
        large photos are resized automatically.
      </p>
    </>
  );
}
