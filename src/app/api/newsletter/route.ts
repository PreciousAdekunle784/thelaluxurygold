import { NextResponse } from "next/server";
import { forward } from "@/lib/server/forward";
import { addSubscriber } from "@/lib/repo/misc";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().slice(0, 160) : "";
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 422 });
  try {
    const source = String(body?.source ?? "site").slice(0, 40);
    await addSubscriber(email, source);
    await forward("NEWSLETTER_WEBHOOK_URL", "newsletter.subscribe", { email, source: String(body?.source ?? "site").slice(0, 40) });
    return NextResponse.json({ message: "Thank you — you're on the list." }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "We couldn't subscribe you just now. Please try again shortly." }, { status: 502 });
  }
}
