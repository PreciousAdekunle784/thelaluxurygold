import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductRow } from "@/lib/repo/products";
import { builtInMediaKeys } from "@/lib/data/media";
import { listMedia } from "@/lib/repo/misc";

export const instant = false;
export const metadata: Metadata = { title: "Edit product" };

export default async function EditProduct({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await connection();
  const { id } = await params;
  const sp = await searchParams;
  const [row, uploads] = await Promise.all([getProductRow(id), listMedia()]);
  if (!row) notFound();
  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-2 text-xs text-stone hover:text-ink"><ArrowLeft size={13} /> Products</Link>
      <PageHeader title={row.product.name} subtitle={sp.created ? "Product created and published." : row.archived ? "Hidden from the store" : "Live on the store"} />
      <ProductForm key={row.updatedAt} initial={row.product} archived={row.archived} library={[...uploads.map((m) => `uploads/${m.id}`), ...builtInMediaKeys.filter((k) => k.startsWith("products/"))]} />
    </>
  );
}
