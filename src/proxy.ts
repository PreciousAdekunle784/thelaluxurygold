import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/auth/session";

const PRIVATE_COOKIE = "llg_private";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Private Collection: visitors without a private session (or admin) go to the access page.
  // This is only a fast first gate — every private page and API re-validates the session in the database.
  if (pathname.startsWith("/private/")) {
    if (request.cookies.get(PRIVATE_COOKIE)?.value || (await verifyToken(request.cookies.get(ADMIN_COOKIE)?.value))) return NextResponse.next();
    return NextResponse.redirect(new URL("/private", request.url));
  }

  if (pathname === "/admin/login") return NextResponse.next();
  const ok = await verifyToken(request.cookies.get(ADMIN_COOKIE)?.value);
  if (ok) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const url = new URL("/admin/login", request.url);
  if (pathname !== "/admin") url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*", "/private/:path+"],
};
