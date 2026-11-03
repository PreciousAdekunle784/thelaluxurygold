import { NextResponse } from "next/server";
import { forward } from "@/lib/server/forward";
import { addMessage } from "@/lib/repo/misc";

const s = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (s(body?.company, 100)) return NextResponse.json({ message: "Thank you." }, { status: 201 }); // honeypot
  const data = { name: s(body?.name, 100), email: s(body?.email, 160), phone: s(body?.phone, 40), topic: s(body?.topic, 60), message: s(body?.message, 3000) };
  const fields: Record<string, string> = {};
  if (!data.name) fields.name = "Please tell us your name.";
  if (!/^\S+@\S+\.\S+$/.test(data.email)) fields.email = "Enter a valid email address.";
  if (data.message.length < 10) fields.message = "Please add a few more details.";
  if (Object.keys(fields).length) return NextResponse.json({ error: "Please check the highlighted fields.", fields }, { status: 422 });
  try {
    await addMessage(data);
    await forward("CONTACT_WEBHOOK_URL", "contact.message", data);
    return NextResponse.json({ message: "Thank you — our team will be in touch shortly." }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "We couldn't send your message. Please try WhatsApp instead." }, { status: 502 });
  }
}
