"use server";

import { redirect } from "next/navigation";
import { redeemCode } from "@/lib/private/access";

export type UnlockState = { error?: string } | undefined;

export async function unlockPrivate(_prev: UnlockState, form: FormData): Promise<UnlockState> {
  const code = String(form.get("code") ?? "").slice(0, 64);
  if (!code.trim()) return { error: "Please enter your private access code." };
  const res = await redeemCode(code);
  if (!res.ok) {
    return {
      error:
        res.reason === "limited"
          ? "Too many attempts. Please wait a few minutes before trying again."
          : "We couldn't verify this access code. Please check it, or contact our team for assistance.",
    };
  }
  redirect("/private/collection");
}
