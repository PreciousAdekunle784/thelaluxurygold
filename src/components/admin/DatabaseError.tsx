/** The "Database not connected" panel: what failed and how to fix it (never includes the password). */
export interface DatabaseProblem {
  dialect: "sqlite" | "postgres";
  host: string;
  user?: string;
  message?: string;
  hints: string[];
}

export function DatabaseError({ db }: { db: DatabaseProblem }) {
  return (
    <div className="border-l-2 border-burgundy bg-white p-6">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-burgundy">Database not connected</p>
      <p className="mt-3 text-sm">
        The admin could not reach {db.dialect === "postgres" ? `PostgreSQL at ${db.host}` : "the local database"}
        {db.user ? ` as user “${db.user}”` : ""}.
      </p>
      {db.message && <p className="mt-2 break-words font-mono text-xs text-stone">{db.message}</p>}
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
