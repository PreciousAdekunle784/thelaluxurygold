import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm, emptyProduct } from "@/components/admin/ProductForm";
import { builtInMediaKeys } from "@/lib/data/media";
import { listMedia } from "@/lib/repo/misc";

export const instant = false;
export const metadata: Metadata = { title: "New product" };

export default async function NewProduct() {
  await connection();
  const uploads = await listMedia();
  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-2 text-xs text-stone hover:text-ink"><ArrowLeft size={13} /> Products</Link>
      <PageHeader title="New product" />
      <ProductForm initial={emptyProduct} library={[...uploads.map((m) => `uploads/${m.id}`), ...builtInMediaKeys.filter((k) => k.startsWith("products/"))]} />
    </>
  );
}
