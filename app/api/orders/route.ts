import { NextResponse } from "next/server";
import { getCatalogApiBase } from "@/lib/catalogApiBase";

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
  return new NextResponse(response.body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
  });
}
