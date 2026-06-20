import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const baseUrl = (process.env.CATALOG_API_BASE || process.env.NEXT_PUBLIC_CATALOG_API_BASE || "").replace(/\/+$/, "");
  if (!baseUrl) return NextResponse.json({ error: "订单服务暂不可用，请稍后重试。" }, { status: 503 });
  const body = await request.text();
  if (body.length > 64_000) return NextResponse.json({ error: "订单内容过大。" }, { status: 413 });
  const response = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });
  return new NextResponse(response.body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
  });
}
