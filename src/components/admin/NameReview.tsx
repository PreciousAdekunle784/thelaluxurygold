"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, RefreshCw, Sparkles } from "lucide-react";
import { MediaImage } from "@/components/ui/MediaImage";
import { getCategory } from "@/lib/data/categories";
import type { Product } from "@/lib/data/types";
import { adminBtnOutline, adminBtnPrimary } from "./ui";
import { cx } from "@/lib/format";

export type NamingState =
  | { status: "idle" }
  | { status: "loading"; photo: string; previous?: Suggestion }
  | ({ status: "ready"; photo: string } & Suggestion)
  | { status: "error"; photo: string; error: string; unavailable?: boolean; previous?: Suggestion };

export interface Suggestion {
  name: string;
  kind: string;
  kindLabel: string;
  category: Product["category"] | null;
  features: string;
}

/**
 * "Suggested product name" review card. The AI only suggests: the product's name changes only when the admin
 * clicks "Use this name" (or saves an edited version). Regenerating never touches the product's name.
 */
export function NameReview({
  naming,
  productName,
  approvedName,
  category,
  onApprove,
  onRegenerate,
  onSetCategory,
}: {
  naming: NamingState;
  productName: string;
  /** the name currently in the product that came from an approved suggestion (null if typed by the admin) */
  approvedName: string | null;
  category: Product["category"];
  onApprove: (name: string) => void;
  onRegenerate: () => void;
  onSetCategory: (c: Product["category"]) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  if (naming.status === "idle") return null;
  const loading = naming.status === "loading";
  const shown: Suggestion | undefined = naming.status === "ready" ? naming : naming.previous;
  const isCurrent = !!shown && productName.trim() === shown.name && approvedName === shown.name;
  const categoryName = shown?.category ? getCategory(shown.category)?.name : null;

  return (
    <section className="border border-line bg-white" aria-labelledby="name-review-title" data-testid="name-review">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div>
          <h2 id="name-review-title" className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
            <Sparkles size={13} className="text-champagne" /> Product name suggestion
          </h2>
          <p className="mt-1 text-xs text-stone">Suggested from the main photo. Nothing is used until you approve it.</p>
        </div>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[120px_1fr]">
        <div className="relative aspect-[4/5] w-[120px] overflow-hidden bg-sand">
          <MediaImage mediaKey={naming.photo} alt="Selected product photo" sizes="120px" className="object-cover" />
        </div>
        <div className="min-w-0 space-y-4">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">Suggested product name</p>
            {draft !== null ? (
              <form
                className="mt-2 flex flex-wrap items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draft.trim()) return;
                  onApprove(draft.trim());
                  setDraft(null);
                }}
              >
                <input
                  autoFocus
                  aria-label="Edit the product name"
                  className="field-boxed max-w-sm flex-1 font-display text-2xl"
                  value={draft}
                  maxLength={120}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className={adminBtnPrimary} disabled={!draft.trim()}>
                  <Check size={14} /> Save name
                </button>
                <button type="button" className="text-xs underline underline-offset-4" onClick={() => setDraft(null)}>
                  Cancel
                </button>
              </form>
            ) : shown ? (
              <p data-testid="suggested-name" className={cx("mt-1 font-display text-3xl leading-tight transition-opacity", loading && "opacity-40")}>
                {shown.name}
              </p>
            ) : loading ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-stone" role="status">
                <Loader2 size={14} className="animate-spin" /> Looking at the photo&hellip;
              </p>
            ) : null}
            {shown && draft === null && (
              <p className="mt-1 text-xs text-stone">
                {shown.kindLabel}
                {shown.features ? <> &middot; {shown.features}</> : null}
              </p>
            )}
            {naming.status === "error" && (
              <p role="alert" className={cx("mt-2 text-sm", naming.unavailable ? "text-stone" : "text-burgundy")}>
                {naming.error}
              </p>
            )}
          </div>

          {draft === null && (
            <div className="flex flex-wrap items-center gap-2">
              {shown && (
                <button type="button" className={adminBtnPrimary} disabled={loading || isCurrent} onClick={() => onApprove(shown.name)}>
                  <Check size={14} /> {isCurrent ? "Approved" : productName.trim() ? "Use this name instead" : "Use this name"}
                </button>
              )}
              {shown && (
                <button type="button" className={adminBtnOutline} disabled={loading} onClick={() => setDraft(shown.name)}>
                  <Pencil size={13} /> Edit name
                </button>
              )}
              {!(naming.status === "error" && naming.unavailable) && (
                <button type="button" className={adminBtnOutline} disabled={loading} onClick={onRegenerate}>
                  <RefreshCw size={13} className={cx(loading && "animate-spin")} /> {shown ? "Regenerate" : "Try again"}
                </button>
              )}
              {shown?.category && categoryName && shown.category !== category && (
                <button type="button" className="text-xs underline underline-offset-4" onClick={() => onSetCategory(shown.category!)}>
                  Set category to {categoryName}
                </button>
              )}
            </div>
          )}

          <p className="border-t border-line pt-3 text-xs text-stone" data-testid="name-status">
            {productName.trim() ? (
              <>
                Product name: <strong className="font-semibold text-ink">{productName.trim()}</strong>
                {isCurrent ? " · approved suggestion" : approvedName === productName.trim() ? " · approved" : " · your own name (kept unless you choose to replace it)"}
              </>
            ) : (
              shown ? "No product name yet. Approve the suggestion, edit it, or type your own in Product name below." : "No product name yet. Type it in Product name below."
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
