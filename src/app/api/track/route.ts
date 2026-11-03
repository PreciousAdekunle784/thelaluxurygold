import { NextResponse, type NextRequest } from "next/server";
import { recordView } from "@/lib/repo/analytics";
import { ADMIN_COOKIE, verifyToken } from "@/lib/auth/session";

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|monitor|facebookexternalhit|embedly|whatsapp/i;

function device(ua: string) {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "Tablet";
  if (/mobi|iphone|android/i.test(ua)) return "Mobile";
  return "Desktop";
}
function browser(ua: string) {
  if (/edg\//i.test(ua)) return "Edge";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get("user-agent") ?? "";
    if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204 });
    if (await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value)) return new NextResponse(null, { status: 204 }); // don't count the owner
    const body = await req.json().catch(() => null);
    const path = clip(body?.path, 300);
    const vid = clip(body?.vid, 64);
    if (!path.startsWith("/") || path.startsWith("/admin") || !vid) return new NextResponse(null, { status: 204 });

    let referrer = "";
    try {
      const r = new URL(clip(body?.referrer, 500));
      if (r.host !== req.nextUrl.host) referrer = r.host.replace(/^www\./, "");
    } catch {
      /* no / invalid referrer */
    }
    const country =
      req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? req.headers.get("cloudfront-viewer-country") ?? req.headers.get("x-country-code") ?? "";

    await recordView({ visitorId: vid, sessionId: clip(body?.sid, 64), path, referrer: referrer || "Direct", country: country.toUpperCase().slice(0, 2), device: device(ua), browser: browser(ua) });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[track]", err);
    return new NextResponse(null, { status: 204 });
  }
}
