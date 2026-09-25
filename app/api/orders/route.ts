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
  const processingAccessCookieName = stripeMode === "live" || (stripeMode === "test" && isLoopbackRequest(request))
    ? getOrderAccessTokenCookieName(orderNumber, "processing")
    : null;
  const localStripeAccessCookieName = stripeMode === "test" && isLoopbackRequest(request)
    ? getOrderAccessTokenCookieName(orderNumber, "stripe")
    : null;
  const stripeAccessCookiePath = stripeMode === "live" ? getOrderAccessTokenCookiePath(orderNumber, "stripe") : null;
  const confirmationAccessCookiePath = stripeMode === "live" ? getOrderAccessTokenCookiePath(orderNumber, "confirmation") : null;
  const processingAccessCookiePath = processingAccessCookieName
    ? getOrderAccessTokenCookiePath(orderNumber, "processing")
    : null;
  const localStripeAccessCookiePath = localStripeAccessCookieName
    ? getOrderAccessTokenCookiePath(orderNumber, "stripe")
    : null;
  if (stripeMode === "live" && (
    !orderAccessToken
    || !stripeAccessCookieName
    || !confirmationAccessCookieName
    || !processingAccessCookieName
    || !stripeAccessCookiePath
    || !confirmationAccessCookiePath
    || !processingAccessCookiePath
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
    && processingAccessCookieName
    && stripeAccessCookiePath
    && confirmationAccessCookiePath
    && processingAccessCookiePath
  ) {
    nextResponse.cookies.set(buildOrderAccessTokenCookie(stripeAccessCookieName, orderAccessToken, stripeAccessCookiePath));
    nextResponse.cookies.set(buildOrderAccessTokenCookie(confirmationAccessCookieName, orderAccessToken, confirmationAccessCookiePath));
    nextResponse.cookies.set(buildOrderAccessTokenCookie(processingAccessCookieName, orderAccessToken, processingAccessCookiePath));
  } else if (
    stripeMode === "test"
    && orderAccessToken
    && localStripeAccessCookieName
    && localStripeAccessCookiePath
    && processingAccessCookieName
    && processingAccessCookiePath
  ) {
    nextResponse.cookies.set(buildOrderAccessTokenCookie(localStripeAccessCookieName, orderAccessToken, localStripeAccessCookiePath));
    nextResponse.cookies.set(buildOrderAccessTokenCookie(processingAccessCookieName, orderAccessToken, processingAccessCookiePath));
  }
  return nextResponse;
}

function isLoopbackRequest(request: Request) {
  try {
    const requestHost = request.headers.get("host");
    if (!requestHost || !isLoopbackHostname(new URL(`http://${requestHost}`).hostname)) return false;
    const origin = request.headers.get("origin");
    return !origin || isLoopbackHostname(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function isLoopbackHostname(hostname: string) {
  const normalisedHostname = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return new Set(["localhost", "127.0.0.1", "::1"]).has(normalisedHostname);
}
