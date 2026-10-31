import { NextResponse } from "next/server";
import { resolveOrderApiTarget } from "@/lib/orderApiProxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > 64_000) {
    return NextResponse.json({ error: "Quote request is too large." }, { status: 413, headers: noStoreHeaders });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Quote request is invalid." }, { status: 400, headers: noStoreHeaders });
  }
  if (!isRecord(payload) || !Array.isArray(payload.items) || payload.items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400, headers: noStoreHeaders });
  }

  const target = resolveOrderApiTarget(request);
  if (!target.ok) {
    return NextResponse.json({ error: target.error }, { status: target.status, headers: noStoreHeaders });
  }
  const localQaTarget = process.env.NODE_ENV === "development" && isLoopbackBaseUrl(target.baseUrl);

  try {
    const response = await fetch(`${target.baseUrl}/orders/quote`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    const responseBody = isRecord(result) && result.error === "订单包含不存在或已下架商品"
      ? localQaTarget
        ? {
            ...result,
            error: "This item isn't available in the local QA catalogue yet. Prepare it locally before testing checkout.",
            code: "LOCAL_QA_ITEM_UNAVAILABLE",
          }
        : {
            ...result,
            error: "One or more items in your cart are no longer available. Please review your cart.",
            code: "ITEM_UNAVAILABLE",
          }
      : result;
    return NextResponse.json(responseBody, { status: response.status, headers: noStoreHeaders });
  } catch {
    return NextResponse.json({ error: "Unable to verify the current order total." }, { status: 502, headers: noStoreHeaders });
  }
}

const noStoreHeaders = { "Cache-Control": "no-store" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isLoopbackBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname.replace(/^\[|\]$/g, ""));
  } catch {
    return false;
  }
}
