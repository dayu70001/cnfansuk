import "server-only";

import {
  getOrderAccessTokenCookieName,
  type OrderAccessTokenCookiePurpose,
} from "@/lib/orderAccessTokenKey";

export function getOrderAccessTokenFromCookieHeader(
  cookieHeader: string | null,
  orderNumber: string,
  purpose: OrderAccessTokenCookiePurpose = "stripe",
) {
  const cookieName = getOrderAccessTokenCookieName(orderNumber, purpose);
  if (!cookieHeader || !cookieName) return "";

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== cookieName) continue;
    return part.slice(separator + 1).trim();
  }
  return "";
}

export function buildOrderAccessTokenCookie(name: string, value: string, path: string) {
  return {
    name,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path,
    maxAge: 7 * 24 * 60 * 60,
  };
}
