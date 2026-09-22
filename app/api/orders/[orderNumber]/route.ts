import { NextResponse } from "next/server";
import { getCatalogApiBase } from "@/lib/catalogApiBase";

type RouteContext = { params: Promise<{ orderNumber: string }> };

function workerBaseUrl() {
  return getCatalogApiBase();
}

async function proxy(request: Request, context: RouteContext, suffix = "") {
  const baseUrl = workerBaseUrl();
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
