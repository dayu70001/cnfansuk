import { NextResponse } from "next/server";
import { loadAuthorizedOrder } from "@/lib/authorizedOrder";
import { getCatalogApiBase } from "@/lib/catalogApiBase";
import { getOrderAccessTokenFromCookieHeader } from "@/lib/orderAccessTokenCookie";
import {
  getStripeBankTransferMode,
  isLocalStripeBankTransferTestEnabled,
  isStripeLiveProductionRequest,
} from "@/lib/payments/stripeBankTransfer";
import { createStripeBankTransferCheckout } from "@/lib/payments/stripeServer";
import { isStripeCheckoutUrl } from "@/lib/stripeCheckoutHandoff";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
};

export async function GET(request: Request) {
  const mode = getStripeBankTransferMode();
  if (mode !== "test" && mode !== "live") {
    return NextResponse.json({ error: "Payment page is unavailable." }, { status: 404, headers: noStoreHeaders });
  }
  if (
    (mode === "test" && (!isLocalStripeBankTransferTestEnabled() || !isLoopbackRequest(request)))
    || (mode === "live" && !isStripeLiveProductionRequest(request))
  ) {
    return NextResponse.json({ error: "Payment page is unavailable." }, { status: 403, headers: noStoreHeaders });
  }

  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return NextResponse.json({ error: "Payment page is unavailable." }, { status: 400, headers: noStoreHeaders });
  }
  const orderNumber = url.searchParams.get("order") || "";
  if (url.searchParams.size !== 1 || !/^CNF-[A-Za-z0-9-]{1,72}$/.test(orderNumber)) {
    return NextResponse.json({ error: "Payment page is unavailable." }, { status: 400, headers: noStoreHeaders });
  }

  const accessToken = getOrderAccessTokenFromCookieHeader(request.headers.get("cookie"), orderNumber, "stripe");
  if (!accessToken) {
    return NextResponse.json({ error: "Payment page is unavailable." }, { status: 401, headers: noStoreHeaders });
  }

  const loadedOrder = await loadAuthorizedOrder(orderNumber, accessToken);
  if (!loadedOrder.ok || loadedOrder.order.order_number !== orderNumber) {
    return NextResponse.json({ error: "Payment page is unavailable." }, { status: 404, headers: noStoreHeaders });
  }
  if (
    !Number.isFinite(loadedOrder.order.final_total)
    || loadedOrder.order.final_total <= 0
    || (mode === "live" && loadedOrder.order.currency !== "GBP")
  ) {
    return NextResponse.json({ error: "Payment page is unavailable." }, { status: 409, headers: noStoreHeaders });
  }

  try {
    const checkout = await createStripeBankTransferCheckout(
      loadedOrder.order,
      mode,
      mode === "test" ? localRequestOrigin(request) : undefined,
    );
    if (!isStripeCheckoutUrl(checkout.checkoutUrl)) {
      return NextResponse.json({ error: "Payment page is unavailable." }, { status: 502, headers: noStoreHeaders });
    }

    await recordPaymentSubmitted(orderNumber);

    const response = NextResponse.redirect(checkout.checkoutUrl, { status: 303 });
    for (const [name, value] of Object.entries(noStoreHeaders)) response.headers.set(name, value);
    return response;
  } catch {
    return NextResponse.json({ error: "The bank transfer could not be started. Please try again." }, {
      status: 502,
      headers: noStoreHeaders,
    });
  }
}

async function recordPaymentSubmitted(orderNumber: string) {
  try {
    const response = await fetch(
      `${getCatalogApiBase()}/orders/${encodeURIComponent(orderNumber)}/payment-submitted`,
      {
        method: "POST",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(2_500),
      },
    );
    if (!response.ok) logPaymentSubmittedFailure(response.status);
  } catch {
    logPaymentSubmittedFailure(null);
  }
}

function logPaymentSubmittedFailure(status: number | null) {
  try {
    console.error("Stripe payment-submitted event could not be recorded", { status });
  } catch {
    // Tracking failure must never prevent the customer from entering Stripe.
  }
}

function localRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const candidate = origin ? new URL(origin) : new URL(request.url);
  if (candidate.protocol !== "http:" || !isLoopbackHostname(candidate.hostname)) {
    throw new Error("Stripe Test Mode only supports a local return URL.");
  }
  return candidate.origin;
}

function isLoopbackRequest(request: Request) {
  try {
    const requestHost = request.headers.get("host");
    if (!requestHost || !isLoopbackHostname(new URL("http://" + requestHost).hostname)) return false;
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
