import { NextResponse } from "next/server";
import { createOrderAccessToken } from "@/lib/orderAccessToken";
import { resolveOrderApiTarget } from "@/lib/orderApiProxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > 64_000) return NextResponse.json({ error: "We couldn't process your order. Please try again." }, { status: 413 });
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Your order details are invalid. Please review them and try again." }, { status: 400 });
  }
  if (!isRecord(payload) || !Array.isArray(payload.items) || payload.items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty. Add items before placing an order." }, { status: 400 });
  }

  const target = resolveOrderApiTarget(request);
  if (!target.ok) return NextResponse.json({ error: "We couldn't process your order. Please try again." }, { status: target.status });

  let response: Response;
  try {
    response = await fetch(`${target.baseUrl}/orders`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "We couldn't reach the order service. Please check your connection and try again." }, {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const rawResult = await response.json().catch(() => ({}));
  const result = rawResult as { order?: { orderNumber?: string }; [key: string]: unknown };
  if (!response.ok || !result.order?.orderNumber) {
    return NextResponse.json(translateOrderError(rawResult), { status: response.status, headers: { "Cache-Control": "no-store" } });
  }
  const orderNumber = result.order.orderNumber;
  const orderAccessToken = createOrderAccessToken(orderNumber);

  const createdOrder = { ...result.order } as typeof result.order & { orderAccessToken?: unknown };
  delete createdOrder.orderAccessToken;
  return NextResponse.json({ ...result, order: { ...createdOrder, orderAccessToken } }, {
    status: response.status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function translateOrderError(value: unknown): { error: string; code?: string; quote?: unknown } {
  const generic = { error: "We couldn't process your order. Please try again." };
  if (!isRecord(value) || typeof value.error !== "string") return generic;
  if (value.code === "CHECKOUT_SESSION_ID_INVALID") {
    return {
      error: "Your checkout session is invalid. Please refresh checkout and try again.",
      code: "CHECKOUT_SESSION_ID_INVALID",
    };
  }
  if (value.code === "QUOTE_REQUIRED") {
    return {
      error: "This checkout page is out of date. Please refresh checkout to review your delivery options and confirm the latest total.",
      code: "QUOTE_REQUIRED",
    };
  }
  if (value.code === "QUOTE_CHANGED"
    || value.error === "Order totals changed. Please review the updated total before placing your order.") {
    return {
      error: "Your order total has changed. Please review the updated amount before confirming.",
      code: typeof value.code === "string" ? value.code : "QUOTE_CHANGED",
      ...(isRecord(value.quote) ? { quote: value.quote } : {}),
    };
  }
  const messages: Record<string, { error: string; code?: string }> = {
    "订单数据格式无效": { error: "Your order details are invalid. Please review them and try again." },
    "包邮资格币种无效": { error: "Please refresh checkout and review your delivery details." },
    "配送方式无效": { error: "Please choose a valid delivery method and try again." },
    "商品数量无效": { error: "Your cart contains an invalid number of items. Please review your cart." },
    "订单包含不存在或已下架商品": {
      error: "One or more items in your cart are no longer available. Please review your cart.",
      code: "ITEM_UNAVAILABLE",
    },
    "请填写完整有效的客户与地址信息": {
      error: "Please complete your contact and delivery details before confirming your order.",
    },
    "商品编号、尺码或数量无效": {
      error: "Please check the product sizes and quantities in your cart.",
    },
    "商品数据无效": { error: "One or more cart items are invalid. Please review your cart." },
    "One or more selected sizes are no longer available. Please review your cart.": {
      error: "One or more selected sizes are no longer available. Please review your cart.",
      code: "SIZE_UNAVAILABLE",
    },
    "This checkout session has already been used for different order details. Please start a new checkout.": {
      error: "Your checkout details have changed. Please start checkout again.",
      code: "CHECKOUT_SESSION_CONFLICT",
    },
  };
  return messages[value.error] || generic;
}
