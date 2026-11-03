import type { Metadata } from "next";
import { PageIntro } from "@/components/shop/PageIntro";
import { AccountView } from "@/components/forms/AccountView";

export const metadata: Metadata = { title: "Track Your Order", robots: { index: false } };

export default function AccountPage() {
  return (
    <>
      <PageIntro crumbs={[{ name: "Home", href: "/" }, { name: "Track your order" }]} title={<>Track your <span className="script">order</span></>} />
      <AccountView />
    </>
  );
}
