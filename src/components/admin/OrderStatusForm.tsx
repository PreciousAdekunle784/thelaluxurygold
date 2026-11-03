"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { setOrderStatus } from "@/app/admin/(panel)/orders/actions";
import { adminBtnPrimary } from "./ui";

const statuses = [
  { id: "pending_confirmation", label: "Awaiting confirmation" },
  { id: "confirmed", label: "Confirmed" },
  { id: "paid", label: "Paid" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export function OrderStatusForm({ reference, status }: { reference: string; status: string }) {
  const [state, action, pending] = useActionState(setOrderStatus, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="reference" value={reference} />
      <label className="block text-xs font-semibold uppercase tracking-[0.14em]">
        Status
        <select name="status" defaultValue={status} className="field-boxed mt-1.5 text-sm normal-case tracking-normal">
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-semibold uppercase tracking-[0.14em]">
        Note <span className="font-normal normal-case tracking-normal text-stone">(optional, e.g. tracking number)</span>
        <input name="note" className="field-boxed mt-1.5 text-sm normal-case tracking-normal" />
      </label>
      <button type="submit" disabled={pending} className={`${adminBtnPrimary} w-full`}>
        {pending && <Loader2 size={14} className="animate-spin" />} Update status
      </button>
      {state?.error && <p className="text-sm text-burgundy">{state.error}</p>}
      {state?.ok && <p className="text-sm text-forest">Status updated.</p>}
      <p className="text-xs leading-relaxed text-stone">Marking an order as Paid, Shipped or Delivered counts it towards revenue received.</p>
    </form>
  );
}
