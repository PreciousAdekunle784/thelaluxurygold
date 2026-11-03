import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { LiveProvider } from "@/components/admin/LiveProvider";
import { requireAdmin } from "@/lib/auth/admin";
import { databaseInfo, databaseStatus } from "@/lib/db/client";

async function Guard({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const db = await databaseStatus();
  if (!db.ok) {
    return (
      <div className="border-l-2 border-burgundy bg-white p-6">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-burgundy">Database not connected</p>
        <p className="mt-3 text-sm">
          The admin could not reach {db.dialect === "postgres" ? `PostgreSQL at ${db.host}` : "the local database"}
          {db.user ? ` as user “${db.user}”` : ""}.
        </p>
        <p className="mt-2 break-words font-mono text-xs text-stone">{db.message}</p>
        {db.hints.length > 0 && (
          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm">
            {db.hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-stone">Check the <code>DATABASE_URL</code> environment variable on your host, then redeploy. See “Connecting Supabase” in the README.</p>
      </div>
    );
  }
  return (
    <>
      <p className="mb-6 flex items-center gap-2 text-xs text-stone">
        <span className="h-2 w-2 rounded-full bg-forest" /> Database connected · {db.dialect === "postgres" ? (db.host.includes("supabase") ? `Supabase (${db.host})` : `PostgreSQL (${db.host})`) : "local SQLite file"}
      </p>
      {children}
    </>
  );
}

function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-10 w-60 animate-pulse bg-white" />
      <div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse bg-white" />)}</div>
      <div className="h-72 animate-pulse bg-white" />
    </div>
  );
}

/** The admin is always rendered on request (private, live data). */
export const instant = false;

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  const db = databaseInfo();
  const notice = db.ephemeralRisk
    ? "Warning: no DATABASE_URL is set on this host, so data is stored in a temporary local file and may be lost. Connect a PostgreSQL database for production."
    : db.dialect === "sqlite" && process.env.NODE_ENV === "production"
      ? "Data is stored in a local SQLite file (.data/llg.sqlite). Back it up regularly, or set DATABASE_URL to use PostgreSQL."
      : null;
  return (
    <LiveProvider>
      <AdminShell dbNotice={notice}>
        <Suspense fallback={<Loading />}>
          <Guard>{children}</Guard>
        </Suspense>
      </AdminShell>
    </LiveProvider>
  );
}
