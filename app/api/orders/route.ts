import { NextResponse } from "next/server";
import { getCatalogApiBase } from "@/lib/catalogApiBase";
import { createOrderAccessToken } from "@/lib/orderAccessToken";

export async function POST(request: Request) {
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
  const orderAccessToken = createOrderAccessToken(result.order.orderNumber);
  return NextResponse.json({
    ...result,
    order: { ...result.order, orderAccessToken },
  }, { status: response.status });
}
