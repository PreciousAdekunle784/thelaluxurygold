"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImagePlus, Images, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import type { Product, ProductVariant } from "@/lib/data/types";
import { categories, collections, purities } from "@/lib/data/categories";
import { MediaImage } from "@/components/ui/MediaImage";
import { deleteProductAction, saveProductAction, setArchivedAction } from "@/app/admin/(panel)/products/actions";
import { IMAGE_ACCEPT, uploadImage } from "./upload-image";
import { adminBtnOutline, adminBtnPrimary } from "./ui";
import { cx } from "@/lib/format";
import { productHref } from "@/lib/links";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

const variantNames: ProductVariant["name"][] = ["Ring size", "Chain length", "Bracelet size", "Weight"];
const variantDefaults: Record<string, string[]> = {
  "Ring size": ["48", "50", "52", "54", "56", "58", "60"],
  "Chain length": ["42 cm", "45 cm", "50 cm"],
  "Bracelet size": ["S · 16 cm", "M · 17.5 cm", "L · 19 cm"],
  Weight: ["5 g", "10 g", "20 g"],
};

export const emptyProduct: Product = {
  id: "",
  slug: "",
  name: "",
  category: "rings",
  collections: [],
  purity: "18K",
  price: null,
  availability: "in_stock",
  tagline: "",
  description: [],
  specs: [{ label: "Gold purity", value: "" }],
  images: [],
  createdAt: "",
  popularity: 50,
};

function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[0.66rem] font-semibold uppercase tracking-[0.16em]">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-stone">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-burgundy">{error}</span>}
    </label>
  );
}

function Section({ title, children, desc }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-white">
      <div className="border-b border-line px-5 py-3.5">
        <h2 className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]">{title}</h2>
        {desc && <p className="mt-1 text-xs text-stone">{desc}</p>}
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

export function ProductForm({ initial, archived = false, library }: { initial: Product; archived?: boolean; library: string[] }) {
  const router = useRouter();
  const isNew = !initial.id;
  const [p, setP] = useState<Product>(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [description, setDescription] = useState(initial.description.join("\n\n"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, startSave] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [picker, setPicker] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));
  const variant = p.variants?.[0];

  const save = () =>
    startSave(async () => {
      setMessage(null);
      const res = await saveProductAction({ ...p, description: description.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean) });
      if (!res.ok) {
        setErrors(res.fields ?? {});
        setMessage({ kind: "error", text: res.error });
        return;
      }
      setErrors({});
      setMessage({ kind: "ok", text: "Saved and published to the store." });
      if (isNew) router.replace(`/admin/products/${res.id}?created=1`);
      else router.refresh();
    });

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setMessage(null);
    const list = Array.from(files);
    const failed: string[] = [];
    for (const [i, file] of list.entries()) {
      if (list.length > 1) setMessage({ kind: "ok", text: `Uploading ${i + 1} of ${list.length}\u2026` });
      const res = await uploadImage(file, "product");
      if (res.ok) setP((x) => ({ ...x, images: [...x.images, { media: res.key, alt: x.name }] }));
      else failed.push(res.error);
    }
    setMessage(failed.length ? { kind: "error", text: failed.join(" ") } : list.length > 1 ? { kind: "ok", text: `${list.length} images added. Save to publish them.` } : null);
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const moveImage = (i: number, d: -1 | 1) =>
    setP((x) => {
      const imgs = [...x.images];
      const j = i + d;
      if (j < 0 || j >= imgs.length) return x;
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
      return { ...x, images: imgs };
    });

  return (
    <div className="pb-28">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Section title="Basics">
            <Field label="Product name" error={errors.name}>
              <input
                className="field-boxed"
                value={p.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setP((x) => ({ ...x, name, slug: slugTouched ? x.slug : slugify(name) }));
                }}
                placeholder="e.g. Aurelia Classic Band"
              />
            </Field>
            <Field label="Web address" error={errors.slug} hint={`laluxurygold.com/product/${p.slug || "…"}`}>
              <input className="field-boxed font-mono text-sm" value={p.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Category" error={errors.category}>
                <select className="field-boxed" value={p.category} onChange={(e) => set("category", e.target.value as Product["category"])}>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Gold purity" error={errors.purity}>
                <select className="field-boxed" value={p.purity} onChange={(e) => set("purity", e.target.value as Product["purity"])}>
                  {purities.map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Price (USD)" error={errors.price} hint="Leave empty to show “Price on request”.">
                <input className="field-boxed" inputMode="numeric" value={p.price ?? ""} onChange={(e) => set("price", e.target.value === "" ? null : Number(e.target.value.replace(/[^\d]/g, "")))} placeholder="Price on request" />
              </Field>
              <Field label="Weight (grams)" error={errors.weightGrams}>
                <input className="field-boxed" inputMode="decimal" value={p.weightGrams ?? ""} onChange={(e) => set("weightGrams", e.target.value === "" ? undefined : (e.target.value.replace(/[^\d.]/g, "") as unknown as number))} placeholder="Optional" />
              </Field>
              <Field label="Availability" error={errors.availability}>
                <select className="field-boxed" value={p.availability} onChange={(e) => set("availability", e.target.value as Product["availability"])}>
                  <option value="in_stock">In stock</option>
                  <option value="low_stock">Only a few left</option>
                  <option value="made_to_order">Made to order</option>
                  <option value="out_of_stock">Unavailable (cannot be ordered)</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Description">
            <Field label="Short tagline" hint="One line shown under the product name.">
              <input className="field-boxed" value={p.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </Field>
            <Field label="Full description" hint="Leave a blank line between paragraphs.">
              <textarea className="field-boxed min-h-40 resize-y" value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
          </Section>

          <Section title="Images" desc="The first image is the main one; the second appears when shoppers hover over the product. Portrait (4:5) photos look best. Any picture format works (JPG, PNG, HEIC from iPhone, WebP, AVIF, GIF, TIFF, BMP, SVG); large photos are resized automatically.">
            {errors.images && <p className="text-xs text-burgundy">{errors.images}</p>}
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {p.images.map((img, i) => (
                <li key={`${img.media}-${i}`} className="border border-line">
                  <div className="relative aspect-[4/5] bg-sand">
                    <MediaImage mediaKey={img.media} alt="" sizes="200px" className="object-cover" />
                    {i === 0 && <span className="absolute left-2 top-2 bg-ink px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase text-ivory">Main</span>}
                  </div>
                  <div className="space-y-2 p-2">
                    <input className="w-full border border-line px-2 py-1.5 text-xs" value={img.alt} placeholder="Image description" onChange={(e) => set("images", p.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} aria-label="Image description" />
                    <div className="flex justify-between">
                      <span className="flex">
                        <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="p-1.5 disabled:opacity-30" aria-label="Move earlier"><ArrowUp size={14} /></button>
                        <button type="button" onClick={() => moveImage(i, 1)} disabled={i === p.images.length - 1} className="p-1.5 disabled:opacity-30" aria-label="Move later"><ArrowDown size={14} /></button>
                      </span>
                      <button type="button" onClick={() => set("images", p.images.filter((_, j) => j !== i))} className="p-1.5 text-burgundy" aria-label="Remove image"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </li>
              ))}
              <li className="flex aspect-[4/5] flex-col items-center justify-center gap-3 border border-dashed border-ink/30 p-3 text-center">
                <input ref={fileInput} type="file" accept={IMAGE_ACCEPT} multiple className="hidden" onChange={(e) => upload(e.target.files)} />
                <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className={adminBtnOutline}>
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
                </button>
                <button type="button" onClick={() => setPicker(true)} className="flex items-center gap-1.5 text-xs underline underline-offset-4">
                  <Images size={13} /> Choose existing
                </button>
              </li>
            </ul>
          </Section>

          <Section title="Options" desc="e.g. ring sizes or chain lengths the customer must choose from.">
            <Field label="Option type">
              <select
                className="field-boxed"
                value={variant?.name ?? ""}
                onChange={(e) => {
                  const name = e.target.value as ProductVariant["name"];
                  set("variants", name ? [{ name, options: (variant?.options.length ? variant.options : variantDefaults[name].map((value) => ({ value }))) }] : undefined);
                }}
              >
                <option value="">No options</option>
                {variantNames.map((n) => <option key={n}>{n}</option>)}
              </select>
            </Field>
            {variant && (
              <div>
                <div className="grid grid-cols-[1fr_140px_90px_32px] gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-stone">
                  <span>Option</span><span>Price difference (USD)</span><span>Available</span><span />
                </div>
                {variant.options.map((o, i) => {
                  const upd = (patch: Partial<typeof o>) => set("variants", [{ ...variant, options: variant.options.map((x, j) => (j === i ? { ...x, ...patch } : x)) }]);
                  return (
                    <div key={i} className="mt-2 grid grid-cols-[1fr_140px_90px_32px] items-center gap-2">
                      <input className="border border-line px-2 py-2 text-sm" value={o.value} onChange={(e) => upd({ value: e.target.value })} />
                      <input className="border border-line px-2 py-2 text-sm" inputMode="numeric" value={o.priceDelta ?? ""} placeholder="0" onChange={(e) => upd({ priceDelta: e.target.value === "" ? undefined : Number(e.target.value.replace(/[^\d-]/g, "")) || 0 })} />
                      <input type="checkbox" className="h-4 w-4" checked={o.available !== false} onChange={(e) => upd({ available: e.target.checked ? undefined : false })} aria-label={`${o.value} available`} />
                      <button type="button" onClick={() => set("variants", [{ ...variant, options: variant.options.filter((_, j) => j !== i) }])} className="text-burgundy" aria-label="Remove option"><X size={15} /></button>
                    </div>
                  );
                })}
                <button type="button" onClick={() => set("variants", [{ ...variant, options: [...variant.options, { value: "" }] }])} className="mt-3 flex items-center gap-1.5 text-xs underline underline-offset-4"><Plus size={13} /> Add option</button>
              </div>
            )}
          </Section>

          <Section title="Specifications" desc="Shown under “Details & specifications” on the product page.">
            {p.specs.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1.4fr_32px] items-center gap-2">
                <input className="border border-line px-2 py-2 text-sm" placeholder="Label, e.g. Chain length" value={s.label} onChange={(e) => set("specs", p.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <input className="border border-line px-2 py-2 text-sm" placeholder="Value" value={s.value} onChange={(e) => set("specs", p.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                <button type="button" onClick={() => set("specs", p.specs.filter((_, j) => j !== i))} className="text-burgundy" aria-label="Remove specification"><X size={15} /></button>
              </div>
            ))}
            <button type="button" onClick={() => set("specs", [...p.specs, { label: "", value: "" }])} className="flex items-center gap-1.5 text-xs underline underline-offset-4"><Plus size={13} /> Add specification</button>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Visibility & labels">
            <label className="flex items-start gap-3 border border-forest/30 bg-sage-mist/40 p-3 text-sm">
              <input type="checkbox" name="private" className="mt-0.5 h-4 w-4" checked={!!p.private} onChange={(e) => set("private", e.target.checked)} />
              <span>
                <strong className="font-semibold">Private Collection only</strong>
                <span className="block text-xs text-stone">Hidden from the public store, search and sitemap. Only invited customers with an access code can see and buy it.</span>
              </span>
            </label>
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4" checked={!!p.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured on the homepage</label>
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4" checked={!!p.isNew} onChange={(e) => set("isNew", e.target.checked)} /> Show “New” label</label>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4" checked={!!p.illustrativeImages} onChange={(e) => set("illustrativeImages", e.target.checked)} />
              <span>
                Images are studio renders, not photos of this piece
                <span className="block text-xs text-stone">Shows a short note on the product page. Untick once you upload real photographs.</span>
              </span>
            </label>
            <Field label="Popularity (for “Most popular” sorting)">
              <input className="field-boxed" inputMode="numeric" value={p.popularity} onChange={(e) => set("popularity", Number(e.target.value.replace(/\D/g, "")) || 0)} />
            </Field>
          </Section>
          <Section title="Collections">
            {collections.map((c) => (
              <label key={c.slug} className="flex items-center gap-3 text-sm">
                <input type="checkbox" className="h-4 w-4" checked={p.collections.includes(c.slug)} onChange={(e) => set("collections", e.target.checked ? [...p.collections, c.slug] : p.collections.filter((x) => x !== c.slug))} />
                {c.name}
              </label>
            ))}
          </Section>
          {!isNew && (
            <Section title="Manage">
              <p className="text-sm text-stone">{archived ? "This product is hidden from the store." : initial.private ? "This product is live in the Private Collection (invited customers only)." : "This product is live on the store."}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={adminBtnOutline} onClick={() => startSave(async () => { await setArchivedAction(p.id, !archived); router.refresh(); })}>
                  {archived ? "Show on store" : "Hide from store"}
                </button>
                <button
                  type="button"
                  className={`${adminBtnOutline} text-burgundy`}
                  onClick={() => {
                    if (!window.confirm(`Delete “${p.name}” permanently? Past orders keep their details.`)) return;
                    startSave(async () => { await deleteProductAction(p.id); router.replace("/admin/products"); });
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </Section>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:left-[250px]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 md:px-8">
          <p role="status" className={cx("text-sm", message?.kind === "error" ? "text-burgundy" : "text-forest")}>{message?.text}</p>
          <div className="flex gap-2">
            {!isNew && !archived && <a href={productHref(initial)} target="_blank" className={adminBtnOutline}>View</a>}
            <button type="button" onClick={save} disabled={saving || uploading} className={adminBtnPrimary}>
              {saving && <Loader2 size={14} className="animate-spin" />} {isNew ? "Create product" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      {picker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal="true" aria-label="Choose an image">
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]">Choose an image</p>
              <button type="button" onClick={() => setPicker(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <ul className="grid flex-1 grid-cols-3 gap-3 overflow-y-auto p-5 sm:grid-cols-5">
              {library.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => { setP((x) => ({ ...x, images: [...x.images, { media: key, alt: x.name }] })); setPicker(false); }}
                    className="group relative block aspect-[4/5] w-full overflow-hidden bg-sand outline-offset-2 hover:outline hover:outline-1 hover:outline-ink"
                    title={key}
                  >
                    <MediaImage mediaKey={key} alt="" sizes="150px" className="object-cover" />
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-ink/70 py-1 text-[0.6rem] text-ivory opacity-0 group-hover:opacity-100"><ImagePlus size={11} /> Add</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
