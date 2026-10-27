import { NextResponse } from "next/server";
import { getCatalogApiBase } from "@/lib/catalogApiBase";

type RouteContext = { params: Promise<{ orderNumber: string }> };

function workerBaseUrl() {
  return getCatalogApiBase();
}

export async function POST(request: Request, context: RouteContext) {
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
    baseUrl = workerBaseUrl();
  }
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
