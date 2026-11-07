import { NextResponse } from "next/server";
import { endPrivateSession } from "@/lib/private/access";

/** Leave the Private Collection on this device (ends the session server-side). */
export async function POST(request: Request) {
  await endPrivateSession();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
