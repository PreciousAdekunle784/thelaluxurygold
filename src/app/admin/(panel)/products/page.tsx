import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import { Card, Empty, PageHeader, Table, Tabs, adminBtnPrimary } from "@/components/admin/ui";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { MediaImage } from "@/components/ui/MediaImage";
import { listProductRows } from "@/lib/repo/products";
import { availabilityLabel } from "@/lib/data/catalogue";
import { getCategory } from "@/lib/data/categories";
import { formatMoney } from "@/lib/format";
import { formatDateTime } from "@/lib/time";

export const instant = false;
export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await connection();
  const sp = await searchParams;
  const view = sp.view === "archived" ? "archived" : "live";
  const all = await listProductRows({ includeArchived: true, visibility: "all" });
  const rows = all.filter((r) => (view === "archived" ? r.archived : !r.archived));

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Changes are published to the store immediately."
        actions={<Link href="/admin/products/new" className={adminBtnPrimary}><Plus size={14} /> New product</Link>}
      />
      <Tabs
        active={view}
        items={[
          { key: "live", label: "On the store", count: all.filter((r) => !r.archived).length, href: "/admin/products" },
          { key: "archived", label: "Hidden", count: all.filter((r) => r.archived).length, href: "/admin/products?view=archived" },
        ]}
      />
      <Card pad={false}>
        <Table head={["", "Product", "Category", "Purity", "Price", "Availability", "Updated", ""]} empty={!rows.length && <Empty>{view === "archived" ? "No hidden products." : "No products yet — add your first one."}</Empty>}>
          {rows.map(({ product: p, archived, updatedAt }) => (
            <tr key={p.id} className="hover:bg-linen/60">
              <td className="w-16 px-4 py-2.5">
                <Link href={`/admin/products/${p.id}`} className="relative block h-16 w-12 overflow-hidden bg-sand">
                  {p.images[0] && <MediaImage mediaKey={p.images[0].media} alt="" sizes="48px" className="object-cover" />}
                </Link>
              </td>
              <td className="px-4 py-2.5">
                <Link href={`/admin/products/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
                <span className="mt-0.5 flex flex-wrap gap-1.5 text-[0.62rem] font-semibold uppercase tracking-wide text-stone">
                  {p.private && <span className="bg-forest px-1.5 py-0.5 text-ivory">Private</span>}
                  {p.featured && <span className="bg-gold-pale px-1.5 py-0.5 text-ink">Featured</span>}
                  {p.isNew && <span className="bg-sage-mist px-1.5 py-0.5 text-forest">New</span>}
                </span>
              </td>
              <td className="px-4 py-2.5">{getCategory(p.category)?.name ?? p.category}</td>
              <td className="px-4 py-2.5">{p.purity}</td>
              <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">{p.price == null ? "On request" : formatMoney(p.price)}</td>
              <td className="whitespace-nowrap px-4 py-2.5">{availabilityLabel[p.availability]}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-xs text-stone">{formatDateTime(updatedAt)}</td>
              <td className="px-4 py-2.5 text-right"><ProductRowActions id={p.id} slug={p.slug} archived={archived} /></td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
