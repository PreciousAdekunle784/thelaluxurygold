"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, Loader2, Mail, RefreshCw } from "lucide-react";
import { changeExpiry, changeStatus, issueCode, regenerate, type IssueResult } from "@/app/admin/(panel)/private/actions";
import { adminBtnOutline, adminBtnPrimary } from "./ui";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { cx } from "@/lib/format";

export interface CodeRow {
  id: string;
  hint: string;
  name: string;
  email: string;
  reference: string;
  singleUse: boolean;
  state: "active" | "inactive" | "revoked" | "expired" | "used";
  expiresAt: number | null;
  createdAt: number;
  uses: number;
  firstUsedAt: number | null;
  lastUsedAt: number | null;
  sessions: number;
}

const field = "w-full border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ink";
const label = "mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-stone";
const fmt = (t: number | null) => (t ? new Date(t).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const day = (t: number | null) => (t ? new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "No expiry");

const stateStyle: Record<CodeRow["state"], string> = {
  active: "bg-forest text-ivory",
  inactive: "border border-stone/40 text-stone",
  used: "bg-gold-pale text-ink",
  expired: "bg-sand text-stone",
  revoked: "bg-burgundy/10 text-burgundy",
};
const stateLabel: Record<CodeRow["state"], string> = { active: "Active", inactive: "Inactive", used: "Used", expired: "Expired", revoked: "Revoked" };

function shareText(code: string) {
  return `You have been invited to the LaLuxuryGold Private Collection.\n\nVisit https://${typeof window !== "undefined" ? window.location.host : "laluxurygoldworld.com"}/private and enter your private access code:\n\n${code}\n\nThis code is personal to you — please don't share it.`;
}

/** Shows a freshly issued code once — it is never stored, so it can't be shown again. */
function CodeCard({ code, name, onClose }: { code: string; name: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="border border-forest bg-forest p-6 text-ivory" role="status">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-gold-pale">Access code for {name}</p>
      <p data-testid="issued-code" className="mt-3 select-all font-mono text-2xl tracking-[0.12em] md:text-3xl">{code}</p>
      <p className="mt-3 text-xs text-ivory/70">Copy it now — for security it is stored only as a fingerprint and can&rsquo;t be shown again. (You can always regenerate a new one.)</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="inline-flex h-10 items-center gap-2 bg-ivory px-4 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink">
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy code"}
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(shareText(code))}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 border border-ivory/50 px-4 text-[0.68rem] font-semibold uppercase tracking-[0.16em]">
          <WhatsAppIcon width={14} height={14} /> Send on WhatsApp
        </a>
        <a href={`mailto:?subject=${encodeURIComponent("Your LaLuxuryGold Private Collection invitation")}&body=${encodeURIComponent(shareText(code))}`} className="inline-flex h-10 items-center gap-2 border border-ivory/50 px-4 text-[0.68rem] font-semibold uppercase tracking-[0.16em]">
          <Mail size={14} /> Email
        </a>
        <button type="button" onClick={onClose} className="ml-auto text-[0.68rem] uppercase tracking-[0.16em] text-ivory/70 hover:text-ivory">
          Done
        </button>
      </div>
    </div>
  );
}

function IssueForm({ onIssued }: { onIssued: (code: string, name: string) => void }) {
  const [state, action, pending] = useActionState<IssueResult | undefined, FormData>(async (prev, form) => {
    const res = await issueCode(prev, form);
    if (res.ok) onIssued(res.code, res.name);
    return res;
  }, undefined);
  return (
    <form action={action} className="grid gap-4 border border-line bg-white p-5 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
      <label className="block">
        <span className={label}>Customer name</span>
        <input name="name" className={field} placeholder="e.g. Amaka Okafor" />
      </label>
      <label className="block">
        <span className={label}>Email (optional)</span>
        <input name="email" type="email" className={field} placeholder="customer@example.com" />
      </label>
      <label className="block">
        <span className={label}>Invitation reference (optional)</span>
        <input name="reference" className={field} placeholder="e.g. VIP-2026-01" />
      </label>
      <label className="block">
        <span className={label}>Expires (optional)</span>
        <input name="expires" type="date" className={field} />
      </label>
      <label className="flex items-center gap-3 text-sm md:col-span-2 lg:col-span-3">
        <input type="checkbox" name="singleUse" className="h-4 w-4" /> Single use — the code works once, on one device
      </label>
      <button type="submit" disabled={pending} className={cx(adminBtnPrimary, "lg:justify-self-end")}>
        {pending ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Generate access code
      </button>
      {state && !state.ok && <p className="text-sm text-burgundy md:col-span-2 lg:col-span-4">{state.error}</p>}
    </form>
  );
}

function Row({ c, onCode }: { c: CodeRow; onCode: (code: string, name: string) => void }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const who = c.name || c.email || c.reference || "Invitation";
  const run = (fn: () => Promise<unknown>) => start(async () => {
    await fn();
    router.refresh();
  });
  return (
    <tr className="align-top">
      <td className="px-4 py-3">
        <p className="font-semibold">{who}</p>
        <p className="text-xs text-stone">{[c.name && c.email, c.reference].filter(Boolean).join(" · ")}</p>
      </td>
      <td className="px-4 py-3 font-mono text-xs">•••• {c.hint}</td>
      <td className="px-4 py-3">
        <span className={cx("inline-flex whitespace-nowrap px-2 py-0.5 text-[0.68rem] font-semibold", stateStyle[c.state])}>{stateLabel[c.state]}</span>
        <p className="mt-1 text-[0.68rem] text-stone">{c.singleUse ? "Single use" : "Reusable"}</p>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs">
        {editing ? (
          <form
            className="flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              const v = (e.currentTarget.elements.namedItem("d") as HTMLInputElement).value;
              run(() => changeExpiry(c.id, v));
              setEditing(false);
            }}
          >
            <input name="d" type="date" className="border border-line px-1 py-1 text-xs" defaultValue={c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : ""} />
            <button className="px-1 text-forest" aria-label="Save expiry">✓</button>
          </form>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="underline decoration-dotted underline-offset-4" title="Change expiry">
            {day(c.expiresAt)}
          </button>
        )}
      </td>
      <td className="px-4 py-3 text-xs tabular-nums">
        {c.uses} {c.uses === 1 ? "use" : "uses"}
        {c.sessions > 0 && <span className="block text-stone">{c.sessions} active {c.sessions === 1 ? "session" : "sessions"}</span>}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs">
        <span className="block">Issued {fmt(c.createdAt)}</span>
        <span className="block text-stone">First used {fmt(c.firstUsedAt)}</span>
        <span className="block text-stone">Last access {fmt(c.lastUsedAt)}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap justify-end gap-1.5">
          {c.state !== "revoked" && (
            <button type="button" disabled={busy} onClick={() => run(() => changeStatus(c.id, c.state === "inactive" ? "active" : "inactive"))} className={cx(adminBtnOutline, "h-8 px-3")}>
              {c.state === "inactive" ? "Activate" : "Deactivate"}
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!confirm(`Replace ${who}'s code with a new one? The current code and any open sessions stop working.`)) return;
              start(async () => {
                const { code } = await regenerate(c.id);
                onCode(code, who);
                router.refresh();
              });
            }}
            className={cx(adminBtnOutline, "h-8 px-3")}
          >
            <RefreshCw size={12} /> Regenerate
          </button>
          {c.state !== "revoked" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => confirm(`Revoke ${who}'s access? They will be signed out of the Private Collection immediately.`) && run(() => changeStatus(c.id, "revoked"))}
              className={cx(adminBtnOutline, "h-8 px-3 text-burgundy")}
            >
              Revoke
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function PrivateAccessManager({ codes }: { codes: CodeRow[] }) {
  const [issued, setIssued] = useState<{ code: string; name: string } | null>(null);
  const [filter, setFilter] = useState<"all" | CodeRow["state"]>("all");
  const shown = filter === "all" ? codes : codes.filter((c) => c.state === filter);
  return (
    <div className="space-y-6">
      {issued ? <CodeCard code={issued.code} name={issued.name} onClose={() => setIssued(null)} /> : <IssueForm onIssued={(code, name) => setIssued({ code, name })} />}

      <div className="flex flex-wrap gap-2">
        {(["all", "active", "used", "inactive", "expired", "revoked"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={cx("h-8 border px-3 text-[0.66rem] font-semibold uppercase tracking-[0.14em]", filter === f ? "border-ink bg-ink text-ivory" : "border-line bg-white")}>
            {f === "all" ? "All" : stateLabel[f]} ({f === "all" ? codes.length : codes.filter((c) => c.state === f).length})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-line bg-linen text-[0.62rem] uppercase tracking-[0.16em] text-stone">
            <tr>
              {["Invitation", "Code", "Status", "Expires", "Usage", "Activity", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((c) => (
              <Row key={c.id} c={c} onCode={(code, name) => setIssued({ code, name })} />
            ))}
            {!shown.length && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-stone">
                  {codes.length ? "No invitations with this status." : "No invitations yet. Generate the first access code above."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
