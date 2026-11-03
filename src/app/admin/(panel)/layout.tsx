import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { LiveProvider } from "@/components/admin/LiveProvider";
import { requireAdmin } from "@/lib/auth/admin";
import { databaseInfo } from "@/lib/db/client";

async function Guard({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
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
