"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ExternalLink, Pencil } from "lucide-react";
import { setArchivedAction } from "@/app/admin/(panel)/products/actions";

export function ProductRowActions({ id, slug, archived }: { id: string; slug: string; archived: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/admin/products/${id}`} className="p-2 text-stone hover:text-ink" aria-label="Edit">
        <Pencil size={15} />
      </Link>
      {!archived && (
        <a href={`/product/${slug}`} target="_blank" className="p-2 text-stone hover:text-ink" aria-label="View on store">
          <ExternalLink size={15} />
        </a>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { await setArchivedAction(id, !archived); router.refresh(); })}
        className="p-2 text-stone hover:text-ink disabled:opacity-40"
        aria-label={archived ? "Show on store" : "Hide from store"}
        title={archived ? "Show on store" : "Hide from store"}
      >
        {archived ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>
    </div>
  );
}
