import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "./session";

export async function isAdmin() {
  await connection();
  const jar = await cookies();
  return verifyToken(jar.get(ADMIN_COOKIE)?.value);
}

/** Guard for admin pages and server actions (the proxy is the first line, this is the second). */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
