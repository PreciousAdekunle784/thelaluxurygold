import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ExternalLink } from "lucide-react";
import { PageHeader, Stat } from "@/components/admin/ui";
import { PrivateAccessManager, type CodeRow } from "@/components/admin/PrivateAccessManager";
import { activeSessionCounts, displayStatus, listCodes } from "@/lib/private/access";
import { listProductRows } from "@/lib/repo/products";

export const instant = false;
export const metadata: Metadata = { title: "Private Access" };

export default async function PrivateAccessPage() {
  await connection();
  const [codes, sessions, privateProducts] = await Promise.all([listCodes(), activeSessionCounts(), listProductRows({ visibility: "private", includeArchived: true })]);
  const rows: CodeRow[] = codes.map((c) => ({
    id: c.id,
    hint: c.hint,
    name: c.name,
    email: c.email,
    reference: c.reference,
    singleUse: c.singleUse,
    state: displayStatus(c),
    expiresAt: c.expiresAt,
    createdAt: c.createdAt,
    uses: c.uses,
    firstUsedAt: c.firstUsedAt,
    lastUsedAt: c.lastUsedAt,
    sessions: sessions.get(c.id) ?? 0,
  }));
  const count = (s: CodeRow["state"]) => rows.filter((r) => r.state === s).length;

  return (
    <>
      <PageHeader
        title="Private Access Management"
        subtitle="Invite selected customers to The Private Collection. Each code is unique, shown once, and stored only as a secure fingerprint."
        actions={
          <Link href="/private/collection" target="_blank" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] hover:text-forest">
            Preview the collection <ExternalLink size={13} />
          </Link>
        }
      />
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Stat label="Active invitations" value={count("active")} accent />
        <Stat label="Used codes" value={rows.filter((r) => r.uses > 0).length} hint="Redeemed at least once" />
        <Stat label="Expired" value={count("expired")} />
        <Stat label="Revoked" value={count("revoked")} />
        <Stat
          label="Private products"
          value={privateProducts.length}
          hint={
            <Link href="/admin/products" className="underline underline-offset-2">
              Manage products
            </Link>
          }
        />
      </div>
      <PrivateAccessManager codes={rows} />
      <p className="mt-8 max-w-3xl text-xs leading-relaxed text-stone">
        Customers enter their code at <strong>/private</strong>. Deactivating, revoking or regenerating a code signs its holder out immediately; access also ends at
        the expiry date. To add a piece to the collection, open it in Products and tick <em>Private Collection only</em> — it disappears from the public store.
      </p>
    </>
  );
}
