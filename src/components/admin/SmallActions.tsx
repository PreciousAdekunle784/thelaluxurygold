"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleRead, unsubscribe } from "@/app/admin/(panel)/messages/actions";

export function ReadToggle({ id, read }: { id: string; read: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button type="button" disabled={pending} onClick={() => start(async () => { await toggleRead(id, !read); router.refresh(); })} className="text-xs underline underline-offset-4 disabled:opacity-40">
      {read ? "Mark unread" : "Mark as read"}
    </button>
  );
}

export function RemoveSubscriber({ email }: { email: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(`Remove ${email} from the newsletter list?`)) start(async () => { await unsubscribe(email); router.refresh(); });
      }}
      className="text-xs text-burgundy underline underline-offset-4 disabled:opacity-40"
    >
      Remove
    </button>
  );
}
