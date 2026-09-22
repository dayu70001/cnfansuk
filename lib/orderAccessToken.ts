import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getAdminWorkerToken } from "@/lib/adminAuth";

const ORDER_ACCESS_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function encodePayload(payload: { orderNumber: string; exp: number }) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createOrderAccessToken(orderNumber: string) {
  const secret = getAdminWorkerToken();
  const normalisedOrderNumber = orderNumber.trim();
  if (!secret || !normalisedOrderNumber) return null;

  const payload = encodePayload({
    orderNumber: normalisedOrderNumber,
    exp: Math.floor(Date.now() / 1000) + ORDER_ACCESS_TOKEN_TTL_SECONDS,
  });
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyOrderAccessToken(token: string, orderNumber: string) {
  const secret = getAdminWorkerToken();
  if (!secret || !token || !orderNumber) return false;

  const [encodedPayload, encodedSignature, extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra) return false;

  let payload: { orderNumber?: unknown; exp?: unknown };
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as typeof payload;
  } catch {
    return false;
  }

  if (payload.orderNumber !== orderNumber || typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = Buffer.from(sign(encodedPayload, secret), "utf8");
  const received = Buffer.from(encodedSignature, "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
