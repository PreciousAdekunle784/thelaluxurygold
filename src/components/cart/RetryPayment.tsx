"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Re-open Paystack checkout for an order that is still awaiting payment. */
export function RetryPayment({ reference }: { reference: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retry = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/paystack/init", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.authorizationUrl) throw new Error(data.error ?? "We couldn't start the payment. Please try again.");
      window.location.assign(data.authorizationUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col items-center">
      <Button size="lg" onClick={retry} disabled={busy}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={14} strokeWidth={1.5} />} Pay now with Paystack
      </Button>
      {error && <p role="alert" className="mt-4 max-w-sm text-sm text-burgundy">{error}</p>}
    </div>
  );
}
