import type { Metadata } from "next";
import { PageIntro } from "@/components/shop/PageIntro";
import { AccountView } from "@/components/forms/AccountView";

export const metadata: Metadata = { title: "My Account", robots: { index: false } };

export default function AccountPage() {
  return (
    <>
      <PageIntro crumbs={[{ name: "Home", href: "/" }, { name: "Account" }]} title={<>My <span className="font-light italic normal-case">account</span></>} />
      <AccountView />
    </>
  );
}
