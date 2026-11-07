"use server";

import { updateTag, revalidatePath, revalidateTag } from "next/cache";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth/admin";
import { CATALOGUE_TAG } from "@/lib/data/store-catalogue";
import { deleteProduct, getProductRow, saveProduct, setArchived, slugTaken } from "@/lib/repo/products";
import { saveMedia } from "@/lib/repo/misc";
import { builtInMediaKeys } from "@/lib/data/media";
import { categories, collections, purities } from "@/lib/data/categories";
import { newId } from "@/lib/db/client";
import type { Availability, Product, ProductVariant } from "@/lib/data/types";

const availability: Availability[] = ["in_stock", "low_stock", "made_to_order", "out_of_stock"];
const variantNames: ProductVariant["name"][] = ["Ring size", "Chain length", "Bracelet size", "Weight"];

export type SaveResult = { ok: true; id: string; slug: string } | { ok: false; error: string; fields?: Record<string, string> };

function refreshStore(slug?: string) {
  updateTag(CATALOGUE_TAG);
  // Also expire every cached store page immediately (no stale-while-revalidate),
  // so hidden/deleted products disappear for the very next visitor.
  revalidateTag(CATALOGUE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/product/${slug}`);
}

export async function saveProductAction(input: Product): Promise<SaveResult> {
  await requireAdmin();
  const f: Record<string, string> = {};
  const str = (v: unknown, n = 300) => (typeof v === "string" ? v.trim().slice(0, n) : "");

  const name = str(input.name, 120);
  const slug = str(input.slug, 120).toLowerCase();
  if (!name) f.name = "Name is required.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) f.slug = "Use lowercase letters, numbers and hyphens only.";
  if (!categories.some((c) => c.slug === input.category)) f.category = "Choose a category.";
  if (!purities.includes(input.purity)) f.purity = "Choose a gold purity.";
  if (!availability.includes(input.availability)) f.availability = "Choose availability.";
  const price = input.price == null || (input.price as unknown) === "" ? null : Math.round(Number(input.price));
  if (price != null && (!Number.isFinite(price) || price < 0)) f.price = "Enter a valid price, or leave empty for price on request.";
  const weight = input.weightGrams == null || (input.weightGrams as unknown) === "" ? undefined : Number(input.weightGrams);
  if (weight != null && (!Number.isFinite(weight) || weight <= 0)) f.weightGrams = "Enter a valid weight in grams.";
  const images = (input.images ?? [])
    .map((i) => ({ media: str(i.media, 120), alt: str(i.alt, 200) || name }))
    .filter((i) => builtInMediaKeys.includes(i.media) || /^uploads\/m[a-f0-9]{16}$/.test(i.media));
  if (!images.length) f.images = "Add at least one image.";
  const id = /^[\w-]{3,60}$/.test(input.id ?? "") ? input.id : newId("p-");
  if (!f.slug && (await slugTaken(slug, id))) f.slug = "Another product already uses this web address.";
  if (Object.keys(f).length) return { ok: false, error: "Please check the highlighted fields.", fields: f };

  const existing = await getProductRow(id);
  const product: Product = {
    id,
    slug,
    name,
    category: input.category,
    collections: (input.collections ?? []).filter((c) => collections.some((x) => x.slug === c)),
    purity: input.purity,
    weightGrams: weight,
    price: price,
    availability: input.availability,
    tagline: str(input.tagline, 240),
    description: (input.description ?? []).map((d) => str(d, 2000)).filter(Boolean),
    specs: (input.specs ?? []).map((s) => ({ label: str(s.label, 80), value: str(s.value, 200) })).filter((s) => s.label && s.value),
    variants: (input.variants ?? [])
      .filter((v) => variantNames.includes(v.name))
      .map((v) => ({ name: v.name, options: (v.options ?? []).map((o) => ({ value: str(o.value, 40), ...(o.priceDelta ? { priceDelta: Math.round(Number(o.priceDelta)) || 0 } : {}), ...(o.available === false ? { available: false } : {}) })).filter((o) => o.value) }))
      .filter((v) => v.options.length),
    images,
    createdAt: existing?.product.createdAt ?? new Date().toISOString().slice(0, 10),
    popularity: Number.isFinite(Number(input.popularity)) ? Number(input.popularity) : 50,
    featured: !!input.featured,
    isNew: !!input.isNew,
    illustrativeImages: !!input.illustrativeImages,
    private: !!input.private,
  };
  if (!product.variants?.length) delete product.variants;
  await saveProduct(product);
  refreshStore(existing && existing.product.slug !== slug ? existing.product.slug : slug);
  if (existing && existing.product.slug !== slug) revalidatePath(`/product/${slug}`);
  return { ok: true, id, slug };
}

export async function setArchivedAction(id: string, archived: boolean) {
  await requireAdmin();
  const row = await getProductRow(id);
  await setArchived(id, archived);
  refreshStore(row?.product.slug);
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  const row = await getProductRow(id);
  await deleteProduct(id);
  refreshStore(row?.product.slug);
}

export async function uploadImageAction(form: FormData): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  const large = form.get("purpose") === "hero";
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { ok: false, error: "Choose an image to upload." };
  if (file.size > 15 * 1024 * 1024) return { ok: false, error: "Images must be under 15 MB." };
  if (!/^image\/(jpeg|png|webp|avif|heic|heif)$/.test(file.type)) return { ok: false, error: "Upload a JPG, PNG, WebP or AVIF image." };
  try {
    const { data, info } = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize(large ? { width: 2800, height: 2800, fit: "inside", withoutEnlargement: true } : { width: 1600, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer({ resolveWithObject: true });
    const id = await saveMedia(data, "image/webp", info.width, info.height);
    return { ok: true, key: `uploads/${id}` };
  } catch (err) {
    console.error("[upload]", err);
    return { ok: false, error: "That file could not be processed as an image." };
  }
}
