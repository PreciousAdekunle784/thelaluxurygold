"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { databaseDiagnostics } from "@/app/admin/actions";
import { DatabaseError, type DatabaseProblem } from "@/components/admin/DatabaseError";
import { adminBtnOutline } from "@/components/admin/ui";

/** A page's data couldn't be loaded: show why (database diagnostics when the database is the cause) and offer a retry. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [db, setDb] = useState<(DatabaseProblem & { ok: boolean }) | null>(null);
  useEffect(() => {
    console.error(error);
    let alive = true;
    databaseDiagnostics()
      .then((d) => alive && setDb(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [error]);
  return (
    <div className="space-y-5">
      {db && !db.ok ? (
        <DatabaseError db={db} />
      ) : (
        <div className="border-l-2 border-burgundy bg-white p-6">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-burgundy">This page couldn&rsquo;t be loaded</p>
          <p className="mt-3 text-sm">Something went wrong while loading this section. Your data is safe. Please try again.</p>
        </div>
      )}
      <button
        type="button"
        onClick={() =>
          startTransition(() => {
            router.refresh(); // fetch the page's data again, then re-render it
            reset();
          })
        }
        className={adminBtnOutline}
      >
        <RotateCcw size={14} /> Try again
      </button>
    </div>
  );
}
