import { NextResponse } from "next/server";
import { getAdminWorkerToken, isAdminAuthenticated } from "@/lib/adminAuth";
import { getCatalogApiBase } from "@/lib/catalogApiBase";
import {
  createLiveStripeDiagnosticsClient,
  diagnoseExistingLiveStripeSession,
} from "@/lib/payments/stripeLiveDiagnostics";
import { getStripeBankTransferMode, isStripeLiveProductionRequest } from "@/lib/payments/stripeBankTransfer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TARGET_ORDER_NUMBER = "CNF-260925-9135";
const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Vary: "Cookie",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return json({ error: "ADMIN_AUTH_REQUIRED" }, 401);
  if (new URL(request.url).search) return json({ error: "UNSUPPORTED_QUERY" }, 400);
  if (getStripeBankTransferMode() !== "live" || !isStripeLiveProductionRequest(request)) {
    return json({ error: "PRODUCTION_LIVE_MODE_REQUIRED" }, 503);
  }

  const workerToken = getAdminWorkerToken();
  if (!workerToken) return json({ error: "ORDER_SERVICE_UNAVAILABLE" }, 503);

  try {
    const orderResponse = await fetch(
      `${getCatalogApiBase()}/admin/orders/${encodeURIComponent(TARGET_ORDER_NUMBER)}`,
      {
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${workerToken}` },
        cache: "no-store",
      },
    );
    if (!orderResponse.ok) return json({ error: "TARGET_ORDER_NOT_FOUND" }, 404);

    const payload = await orderResponse.json().catch(() => null) as {
      order?: { order_number?: unknown; final_total?: unknown; currency?: unknown };
    } | null;
    const order = payload?.order;
    const amount = typeof order?.final_total === "number" ? order.final_total : Number(order?.final_total);
    if (
      order?.order_number !== TARGET_ORDER_NUMBER
      || !Number.isFinite(amount)
      || Math.round(amount * 100) !== 2300
      || Math.abs(amount * 100 - 2300) > 0.00001
      || typeof order.currency !== "string"
      || order.currency.toUpperCase() !== "GBP"
    ) return json({ error: "TARGET_ORDER_MISMATCH" }, 409);

    const stripe = createLiveStripeDiagnosticsClient();
    const result = await diagnoseExistingLiveStripeSession(stripe, {
      order_number: TARGET_ORDER_NUMBER,
      final_total: amount,
      currency: order.currency,
    });

    if (result.kind !== "diagnosed") {
      const status = result.kind === "SESSION_NOT_FOUND" ? 404 : 409;
      return json({ error: result.kind, orderMatch: true, amount: 2300, currency: "gbp" }, status);
    }

    return json({
      orderMatch: true,
      amount: 2300,
      currency: "gbp",
      ...result.diagnosis,
    });
  } catch {
    // Deliberately do not log the exception: Stripe errors may contain request or customer data.
    return json({ error: "READ_ONLY_DIAGNOSTIC_FAILED" }, 502);
  }
}

/** Next.js otherwise derives HEAD from GET; explicitly reject it to keep this endpoint GET-only. */
export function HEAD() {
  return new Response(null, { status: 405, headers: NO_STORE_HEADERS });
}
