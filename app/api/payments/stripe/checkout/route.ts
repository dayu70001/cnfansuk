import { NextResponse } from "next/server";
import {
  buildStripeBankTransferSessionDraft,
  getLocalStripeBankTransferMode,
  isLocalStripeBankTransferTestEnabled,
  isLocalStripeBankTransferMockEnabled,
} from "@/lib/payments/stripeBankTransfer";
import { createLocalStripeTestCheckout } from "@/lib/payments/stripeServer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const mode = getLocalStripeBankTransferMode();
  if (mode === "disabled") {
    return NextResponse.json({ error: "Stripe bank transfer is not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const orderNumber = typeof input.orderNumber === "string" ? input.orderNumber : "";

  if (mode === "test") {
    if (!isLocalStripeBankTransferTestEnabled() || orderNumber !== "LOCAL-CNF-TEST") {
      return NextResponse.json({ error: "Invalid local payment fixture." }, { status: 400 });
    }

    try {
      const checkout = await createLocalStripeTestCheckout();
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

function safeLogValue(value: unknown) {
  return typeof value === "string" && /^[A-Za-z0-9_.-]{1,120}$/.test(value) ? value : undefined;
}

function safeStripeErrorMessage(value: unknown) {
  if (typeof value !== "string") return undefined;
  return value
    .replace(/sk_(?:test|live)_[A-Za-z0-9]+/g, "[REDACTED]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED EMAIL]")
    .replace(/cus_[A-Za-z0-9]+/g, "[REDACTED CUSTOMER]")
    .replace(/cs_test_[A-Za-z0-9]+/g, "[REDACTED SESSION]")
    .replace(/https?:\/\/\S+/g, "[REDACTED URL]")
    .slice(0, 300);
}
