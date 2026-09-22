import { NextResponse } from "next/server";
import { getCatalogApiBase } from "@/lib/catalogApiBase";

type RouteContext = { params: Promise<{ orderNumber: string }> };

function workerBaseUrl() {
  return getCatalogApiBase();
}

export async function POST(request: Request, context: RouteContext) {
  const baseUrl = workerBaseUrl();
  const { orderNumber } = await context.params;
  const response = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderNumber)}/payment-viewed`, {
    method: "POST",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return new NextResponse(response.body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
  });
}
