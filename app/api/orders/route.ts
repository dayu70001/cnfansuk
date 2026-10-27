import { NextResponse } from "next/server";
import { getCatalogApiBase } from "@/lib/catalogApiBase";
import { createOrderAccessToken } from "@/lib/orderAccessToken";

export async function POST(request: Request) {
  let baseUrl: string;
  if (process.env.NODE_ENV === "development") {
    if (!isLoopbackRequest(request)) {
      return NextResponse.json({ error: "Order service is unavailable." }, { status: 403 });
    }
    const localBaseUrl = process.env.LOCAL_ORDER_API_BASE?.trim();
    if (!localBaseUrl || !isSafeLocalOrderApiBase(localBaseUrl)) {
      return NextResponse.json({ error: "Local order service is not configured." }, { status: 503 });
    }
    baseUrl = localBaseUrl.replace(/\/+$/, "");
  } else {
    baseUrl = getCatalogApiBase();
  }
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

  const createdOrder = { ...result.order } as typeof result.order & { orderAccessToken?: unknown };
  delete createdOrder.orderAccessToken;
  return NextResponse.json({ ...result, order: { ...createdOrder, orderAccessToken } }, { status: response.status });
}

function isLoopbackRequest(request: Request) {
  try {
    if (!isLoopbackHostname(new URL(request.url).hostname)) return false;
    const requestHost = request.headers.get("host");
    if (requestHost && !isLoopbackHostname(new URL(`http://${requestHost}`).hostname)) return false;
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

function isSafeLocalOrderApiBase(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:"
      && !url.username
      && !url.password
      && !url.search
      && !url.hash
      && isLoopbackHostname(url.hostname);
  } catch {
    return false;
  }
}
