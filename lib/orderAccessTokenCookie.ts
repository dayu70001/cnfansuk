import "server-only";

import {
  getOrderAccessTokenCookieName,
  type OrderAccessTokenCookiePurpose,
} from "@/lib/orderAccessTokenKey";

export function getOrderAccessTokenFromCookieHeader(
  cookieHeader: string | null,
  orderNumber: string,
  purpose: OrderAccessTokenCookiePurpose = "confirmation",
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
