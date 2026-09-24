import { NextResponse } from "next/server";
import { loadAuthorizedOrder } from "@/lib/authorizedOrder";
import { getOrderAccessTokenFromCookieHeader } from "@/lib/orderAccessTokenCookie";
import {
  getStripeBankTransferMode,
  isStripeLiveProductionRequest,
} from "@/lib/payments/stripeBankTransfer";
import {
  retrieveStripeSessionSummary,
  StripeSessionOrderMismatchError,
} from "@/lib/payments/stripeServer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const mode = getStripeBankTransferMode();
  if (mode !== "test" && mode !== "live") {
    return NextResponse.json({ error: "Payment status is unavailable." }, { status: 404, headers: noStoreHeaders });
  }
  if ((mode === "test" && !isLoopbackRequest(request)) || (mode === "live" && !isStripeLiveProductionRequest(request))) {
    return NextResponse.json({ error: "Payment status is unavailable." }, { status: 403, headers: noStoreHeaders });
  }

  const url = new URL(request.url);
  const orderNumber = url.searchParams.get("order") || "";
  const sessionId = url.searchParams.get("session_id") || "";
  const accessToken = request.headers.get("X-Order-Access-Token") || "";
  const expectedSessionPattern = mode === "test" ? /^cs_test_[A-Za-z0-9]+$/ : /^cs_live_[A-Za-z0-9]+$/;
  if (!/^CNF-[A-Za-z0-9-]{1,72}$/.test(orderNumber) || !expectedSessionPattern.test(sessionId)) {
    return NextResponse.json({ error: "Payment status is unavailable." }, { status: 400, headers: noStoreHeaders });
  }

  const orderAccessToken = mode === "live"
    ? getOrderAccessTokenFromCookieHeader(request.headers.get("cookie"), orderNumber)
    : accessToken;
  const loadedOrder = await loadAuthorizedOrder(orderNumber, orderAccessToken);
  if (!loadedOrder.ok) {
    return NextResponse.json({ error: "Payment status is unavailable." }, { status: loadedOrder.status, headers: noStoreHeaders });
  }

  try {
    const session = await retrieveStripeSessionSummary(sessionId, loadedOrder.order, mode);
    return NextResponse.json(
      { paymentStatus: session.paymentStatus, checkoutStatus: session.status },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (error instanceof StripeSessionOrderMismatchError) {
      return NextResponse.json({ error: "Payment status is unavailable." }, { status: 403, headers: noStoreHeaders });
    }
    return NextResponse.json({ error: "Payment status is temporarily unavailable." }, { status: 503, headers: noStoreHeaders });
  }
}

function isLoopbackRequest(request: Request) {
  try {
    const requestHost = request.headers.get("host");
    if (!requestHost || !isLoopbackHostname(new URL(`http://${requestHost}`).hostname)) return false;
    const requestOrigin = request.headers.get("origin");
    const originHostname = requestOrigin ? new URL(requestOrigin).hostname : null;
    return !originHostname || isLoopbackHostname(originHostname);
  } catch {
    return false;
  }
}

function isLoopbackHostname(hostname: string) {
  const normalisedHostname = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return new Set(["localhost", "127.0.0.1", "::1"]).has(normalisedHostname);
}

const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" };
