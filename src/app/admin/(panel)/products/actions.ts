"use server";

import { updateTag, revalidatePath, revalidateTag } from "next/cache";
import { processUpload, UnreadableImageError } from "@/lib/server/images";
import { requireAdmin } from "@/lib/auth/admin";
import { CATALOGUE_TAG } from "@/lib/data/store-catalogue";
import { deleteProduct, getProductRow, saveProduct, setArchived, slugTaken } from "@/lib/repo/products";
import { saveMedia, saveUploadChunk, takeUploadChunks } from "@/lib/repo/misc";
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

type UploadResult = { ok: true; key: string } | { ok: false; error: string };

/** Largest file accepted (in pieces); bigger than any phone or camera JPEG/HEIC, and most TIFFs. */
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const MAX_CHUNK_BYTES = 4 * 1024 * 1024;

async function storeUpload(bytes: Buffer, purpose: FormDataEntryValue | null, name: string): Promise<UploadResult> {
  try {
    const img = await processUpload(bytes, { large: purpose === "hero" });
    const id = await saveMedia(img.data, "image/webp", img.width, img.height);
    return { ok: true, key: `uploads/${id}` };
  } catch (err) {
    if (!(err instanceof UnreadableImageError)) console.error("[upload]", err);
    const label = name ? `\u201c${name.slice(0, 80)}\u201d` : "That file";
    return { ok: false, error: `${label} couldn\u2019t be read as a picture. If it opens on your device, export or screenshot it as a JPG or PNG and try again.` };
  }
}

/** Upload one picture (any format) in a single request. The admin page uses this for files under ~3.5 MB. */
export async function uploadImageAction(form: FormData): Promise<UploadResult> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof Blob) || !file.size) return { ok: false, error: "Choose an image to upload." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Images must be under 100 MB." };
  return storeUpload(Buffer.from(await file.arrayBuffer()), form.get("purpose"), String(form.get("name") ?? ""));
}

/**
 * Upload a large picture in pieces (hosting platforms cap a single request at ~4.5 MB). Pieces are sent in
 * order; the last one joins them, converts the picture and returns its key. Unfinished uploads expire after an hour.
 */
export async function uploadImageChunkAction(form: FormData): Promise<UploadResult | { ok: true; key: null }> {
  await requireAdmin();
  const uploadId = String(form.get("uploadId") ?? "");
  const index = Number(form.get("index"));
  const total = Number(form.get("total"));
  const chunk = form.get("chunk");
  if (!/^[a-f0-9]{32}$/.test(uploadId) || !Number.isInteger(index) || !Number.isInteger(total) || total < 1 || index < 0 || index >= total)
    return { ok: false, error: "Upload failed. Please try again." };
  if (total * MAX_CHUNK_BYTES > MAX_UPLOAD_BYTES + MAX_CHUNK_BYTES) return { ok: false, error: "Images must be under 100 MB." };
  if (!(chunk instanceof Blob) || !chunk.size || chunk.size > MAX_CHUNK_BYTES) return { ok: false, error: "Upload failed. Please try again." };
  await saveUploadChunk(uploadId, index, Buffer.from(await chunk.arrayBuffer()));
  if (index < total - 1) return { ok: true, key: null };
  const parts = await takeUploadChunks(uploadId);
  if (parts.length !== total) return { ok: false, error: "Part of the upload went missing. Please try again." };
  return storeUpload(Buffer.concat(parts), form.get("purpose"), String(form.get("name") ?? ""));
}
