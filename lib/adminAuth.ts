import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_SESSION_COOKIE = "cnfans_admin_session";

export function getAdminLoginSecret() {
  return process.env.ADMIN_PASSWORD?.trim() || process.env.ADMIN_TOKEN?.trim() || "";
}

export function getAdminWorkerToken() {
  return process.env.ADMIN_TOKEN?.trim() || process.env.ADMIN_PASSWORD?.trim() || "";
}

export function createAdminSessionValue(secret: string) {
  return createHash("sha256").update(`cnfans-admin:${secret}`).digest("hex");
}

export function safeEqualText(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export async function isAdminAuthenticated() {
  const secret = getAdminLoginSecret();
  if (!secret) return false;
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value || "";
  return Boolean(session) && safeEqualText(session, createAdminSessionValue(secret));
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
}
