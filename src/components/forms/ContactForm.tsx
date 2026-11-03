"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

const topics = ["Product enquiry", "Gold bars", "Order & delivery", "Personalisation & engraving", "Something else"];

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setStatus("sending");
    setFields({});
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFields(json.fields ?? {});
        throw new Error(json.error ?? "Something went wrong.");
      }
      setStatus("sent");
      setMsg(json.message);
      e.currentTarget?.reset();
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const label = "mb-2 block text-[0.66rem] font-semibold uppercase tracking-[0.18em]";
  const err = (k: string) => fields[k] && <span className="mt-1.5 block text-xs text-burgundy">{fields[k]}</span>;

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 sm:grid-cols-2">
      <label className="block">
        <span className={label}>Name</span>
        <input name="name" autoComplete="name" required aria-invalid={!!fields.name} className="field-boxed" />
        {err("name")}
      </label>
      <label className="block">
        <span className={label}>Email</span>
        <input name="email" type="email" autoComplete="email" required aria-invalid={!!fields.email} className="field-boxed" />
        {err("email")}
      </label>
      <label className="block">
        <span className={label}>Telephone <span className="font-normal normal-case tracking-normal text-stone">— optional</span></span>
        <input name="phone" type="tel" autoComplete="tel" className="field-boxed" />
      </label>
      <label className="block">
        <span className={label}>Topic</span>
        <select name="topic" className="field-boxed" defaultValue={topics[0]}>
          {topics.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className={label}>Message</span>
        <textarea name="message" rows={6} required aria-invalid={!!fields.message} className="field-boxed resize-y" />
        {err("message")}
      </label>
      <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={status === "sending"}>
          {status === "sending" && <Loader2 size={15} className="animate-spin" />} Send message
        </Button>
        <p role="status" className={status === "error" ? "text-sm text-burgundy" : "text-sm text-forest"}>{status === "sent" || status === "error" ? msg : ""}</p>
      </div>
    </form>
  );
}
