import { NextResponse } from "next/server";
import { getCatalogApiBase } from "@/lib/catalogApiBase";
import { createOrderAccessToken } from "@/lib/orderAccessToken";
import { getStripeBankTransferMode, isStripeLiveProductionRequest } from "@/lib/payments/stripeBankTransfer";
import { getOrderAccessTokenCookieName, getOrderAccessTokenCookiePath } from "@/lib/orderAccessTokenKey";
import { buildOrderAccessTokenCookie } from "@/lib/orderAccessTokenCookie";

export async function POST(request: Request) {
  const stripeMode = getStripeBankTransferMode();
  if (stripeMode === "live" && !isStripeLiveProductionRequest(request)) {
    return NextResponse.json({ error: "Order service is unavailable." }, { status: 403 });
  }

  const baseUrl = getCatalogApiBase();
  const body = await request.text();
  if (body.length > 64_000) return NextResponse.json({ error: "订单内容过大。" }, { status: 413 });
  const response = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({})) as { order?: { orderNumber?: string }; [key: string]: unknown };
  if (!response.ok || !result.order?.orderNumber) {
    return NextResponse.json(result, { status: response.status });
  }
  const orderNumber = result.order.orderNumber;
  const orderAccessToken = createOrderAccessToken(orderNumber);
  const stripeAccessCookieName = stripeMode === "live" ? getOrderAccessTokenCookieName(orderNumber, "stripe") : null;
  const confirmationAccessCookieName = stripeMode === "live" ? getOrderAccessTokenCookieName(orderNumber, "confirmation") : null;
  const stripeAccessCookiePath = stripeMode === "live" ? getOrderAccessTokenCookiePath(orderNumber, "stripe") : null;
  const confirmationAccessCookiePath = stripeMode === "live" ? getOrderAccessTokenCookiePath(orderNumber, "confirmation") : null;
  if (stripeMode === "live" && (
    !orderAccessToken
    || !stripeAccessCookieName
    || !confirmationAccessCookieName
    || !stripeAccessCookiePath
    || !confirmationAccessCookiePath
  )) {
    return NextResponse.json({ error: "Order payment access could not be prepared." }, { status: 503 });
  }

  const createdOrder = { ...result.order } as typeof result.order & { orderAccessToken?: unknown };
  delete createdOrder.orderAccessToken;
  const order = stripeMode === "live"
    ? createdOrder
    : { ...createdOrder, orderAccessToken };
  const nextResponse = NextResponse.json({ ...result, order }, { status: response.status });

  if (
    stripeMode === "live"
    && orderAccessToken
    && stripeAccessCookieName
    && confirmationAccessCookieName
    && stripeAccessCookiePath
    && confirmationAccessCookiePath
  ) {
    nextResponse.cookies.set(buildOrderAccessTokenCookie(stripeAccessCookieName, orderAccessToken, stripeAccessCookiePath));
    nextResponse.cookies.set(buildOrderAccessTokenCookie(confirmationAccessCookieName, orderAccessToken, confirmationAccessCookiePath));
  }
  return nextResponse;
}
