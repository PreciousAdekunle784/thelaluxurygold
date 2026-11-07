import { NextResponse } from "next/server";
import { hasPrivateAccess } from "@/lib/private/access";
import { listProductRows } from "@/lib/repo/products";

/** Private Collection products — only for visitors with a valid private session (or an admin). */
export async function GET() {
  if (!(await hasPrivateAccess())) return NextResponse.json({ error: "Private access required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const products = (await listProductRows({ visibility: "private" })).map((r) => r.product);
  return NextResponse.json({ products }, { headers: { "Cache-Control": "private, no-store" } });
}
