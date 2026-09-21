import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ orderNumber: string }> };

function workerBaseUrl() {
  return (process.env.CATALOG_API_BASE || process.env.NEXT_PUBLIC_CATALOG_API_BASE || "").replace(/\/+$/, "");
}

async function proxy(request: Request, context: RouteContext, suffix = "") {
  const baseUrl = workerBaseUrl();
  if (!baseUrl) return NextResponse.json({ error: "订单服务暂不可用，请稍后重试。" }, { status: 503 });
  const { orderNumber } = await context.params;
  const target = `${baseUrl}/orders/${encodeURIComponent(orderNumber)}${suffix}`;
  const response = await fetch(target, {
    method: request.method,
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: request.method === "GET" ? undefined : await request.text(),
    cache: "no-store",
  });
  return new NextResponse(response.body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
  });
}

export async function GET(request: Request, context: RouteContext) {
  return proxy(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxy(request, context, "/payment-submitted");
}
