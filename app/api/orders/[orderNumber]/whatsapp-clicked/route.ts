import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ orderNumber: string }> };

function workerBaseUrl() {
  return (process.env.CATALOG_API_BASE || process.env.NEXT_PUBLIC_CATALOG_API_BASE || "").replace(/\/+$/, "");
}

export async function POST(request: Request, context: RouteContext) {
  const baseUrl = workerBaseUrl();
  if (!baseUrl) return NextResponse.json({ error: "订单服务暂不可用，请稍后重试。" }, { status: 503 });
  const { orderNumber } = await context.params;
  const response = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderNumber)}/whatsapp-clicked`, {
    method: "POST",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return new NextResponse(response.body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
  });
}
