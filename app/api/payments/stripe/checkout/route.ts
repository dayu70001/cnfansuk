import { NextResponse } from "next/server";
import { loadAuthorizedOrder } from "@/lib/authorizedOrder";
import { getOrderAccessTokenFromCookieHeader } from "@/lib/orderAccessTokenCookie";
import {
  buildStripeBankTransferSessionDraft,
  getStripeBankTransferMode,
  isStripeLiveProductionRequest,
  isLocalStripeBankTransferTestEnabled,
  isLocalStripeBankTransferMockEnabled,
} from "@/lib/payments/stripeBankTransfer";
import { createLocalStripeTestCheckout, createStripeBankTransferCheckout } from "@/lib/payments/stripeServer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const mode = getStripeBankTransferMode();
  if (mode === "disabled") {
    return NextResponse.json({ error: "Stripe bank transfer is not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const orderNumber = typeof input.orderNumber === "string" ? input.orderNumber.trim() : "";
  const forbiddenClientAmounts = ["amount", "amountMinor", "currency", "subtotal", "shippingFee", "total", "price", "items"];

  if (mode === "test") {
    if (!isLocalStripeBankTransferTestEnabled() || !isLoopbackRequest(request)) {
      return NextResponse.json({ error: "Stripe Test Mode is only available on this local device." }, { status: 403 });
    }

    if (
      forbiddenClientAmounts.some((key) => Object.hasOwn(input, key))
      || typeof input.orderAccessToken !== "string"
      || input.orderAccessToken.length > 512
      || !/^CNF-[A-Za-z0-9-]{1,72}$/.test(orderNumber)
    ) {
      return NextResponse.json({ error: "Invalid order payment request." }, { status: 400 });
    }

    const loadedOrder = await loadAuthorizedOrder(orderNumber, input.orderAccessToken);
    if (!loadedOrder.ok) {
      return NextResponse.json({ error: loadedOrder.error }, { status: loadedOrder.status });
    }
    if (!Number.isFinite(loadedOrder.order.final_total) || loadedOrder.order.final_total <= 0) {
      return NextResponse.json({ error: "The saved order total is invalid." }, { status: 409 });
    }

    try {
      const origin = localRequestOrigin(request);
      const checkout = await createLocalStripeTestCheckout(loadedOrder.order, origin);
      return NextResponse.json(
        {
          mode: "test",
          checkoutUrl: checkout.checkoutUrl,
          livemode: checkout.livemode,
          paymentMethodTypes: checkout.paymentMethodTypes,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      const details = error && typeof error === "object" ? error as Record<string, unknown> : {};
      console.error("Stripe Test Checkout creation failed", {
        type: safeLogValue(details.type),
        code: safeLogValue(details.code),
        param: safeLogValue(details.param),
        status: typeof details.statusCode === "number" ? details.statusCode : undefined,
        requestId: safeLogValue(details.requestId),
        message: safeStripeErrorMessage(details.message),
      });
      return NextResponse.json(
        { error: "Bank transfer is temporarily unavailable. Please try again." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  if (mode === "live") {
    if (!isStripeLiveProductionRequest(request)) {
      return NextResponse.json({ error: "Stripe bank transfer is unavailable." }, { status: 403 });
    }

    const accessToken = getOrderAccessTokenFromCookieHeader(request.headers.get("cookie"), orderNumber);
    if (
      forbiddenClientAmounts.some((key) => Object.hasOwn(input, key))
      || Object.hasOwn(input, "orderAccessToken")
      || !/^CNF-[A-Za-z0-9-]{1,72}$/.test(orderNumber)
    ) {
      return NextResponse.json({ error: "Invalid order payment request." }, { status: 400 });
    }

    const loadedOrder = await loadAuthorizedOrder(orderNumber, accessToken);
    if (!loadedOrder.ok) {
      return NextResponse.json({ error: "Order payment is unavailable." }, { status: loadedOrder.status });
    }
    if (loadedOrder.order.currency !== "GBP" || !Number.isFinite(loadedOrder.order.final_total) || loadedOrder.order.final_total <= 0) {
      return NextResponse.json({ error: "This saved order is not eligible for GBP bank transfer." }, { status: 409 });
    }

    try {
      const checkout = await createStripeBankTransferCheckout(loadedOrder.order, "live");
      return NextResponse.json(
        {
          mode: "live",
          checkoutUrl: checkout.checkoutUrl,
          returnUrl: checkout.successReturnUrl,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      const details = error && typeof error === "object" ? error as Record<string, unknown> : {};
      console.error("Stripe Live Checkout creation failed", {
        type: safeLogValue(details.type),
        code: safeLogValue(details.code),
        param: safeLogValue(details.param),
        status: typeof details.statusCode === "number" ? details.statusCode : undefined,
        requestId: safeLogValue(details.requestId),
        message: safeStripeErrorMessage(details.message),
      });
      return NextResponse.json(
        { error: "Bank transfer is temporarily unavailable. Please try again." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  if (!isLocalStripeBankTransferMockEnabled()) {
    return NextResponse.json({ error: "Stripe bank transfer is not configured." }, { status: 503 });
  }

  const amountMinor = input.amountMinor;
  if (orderNumber !== "LOCAL-CNF-TEST" || typeof amountMinor !== "number" || !Number.isSafeInteger(amountMinor)) {
    return NextResponse.json({ error: "Invalid local payment fixture." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const successUrl = new URL(
    `/order-success?order=${encodeURIComponent(orderNumber)}&payment=mock&amount=${amountMinor}`,
    origin,
  ).toString();
  const cancelUrl = new URL("/checkout?payment=cancelled", origin).toString();

  try {
    // Build and validate the future minimal request shape; it is not sent anywhere.
    buildStripeBankTransferSessionDraft({
      orderNumber,
      amountMinor,
      currency: "GBP",
      successUrl,
      cancelUrl,
    });
  } catch {
    return NextResponse.json({ error: "Invalid local payment amount." }, { status: 400 });
  }

  const checkoutUrl = new URL("/checkout/stripe-mock", origin);
  checkoutUrl.searchParams.set("order", orderNumber);
  checkoutUrl.searchParams.set("amount", String(amountMinor));
  return NextResponse.json(
    { mode: "mock", checkoutUrl: `${checkoutUrl.pathname}${checkoutUrl.search}` },
    { headers: { "Cache-Control": "no-store" } },
  );
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
    if (!requestHost || !isLoopbackHostname(new URL(`http://${requestHost}`).hostname)) return false;
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

function safeLogValue(value: unknown) {
  return typeof value === "string" && /^[A-Za-z0-9_.-]{1,120}$/.test(value) ? value : undefined;
}

function safeStripeErrorMessage(value: unknown) {
  if (typeof value !== "string") return undefined;
  return value
    .replace(/sk_(?:test|live)_[A-Za-z0-9]+/g, "[REDACTED]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED EMAIL]")
    .replace(/cus_[A-Za-z0-9]+/g, "[REDACTED CUSTOMER]")
    .replace(/cs_(?:test|live)_[A-Za-z0-9]+/g, "[REDACTED SESSION]")
    .replace(/https?:\/\/\S+/g, "[REDACTED URL]")
    .slice(0, 300);
}
