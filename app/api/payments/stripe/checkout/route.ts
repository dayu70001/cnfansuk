import { NextResponse } from "next/server";
import {
  buildStripeBankTransferSessionDraft,
  isLocalStripeBankTransferMockEnabled,
} from "@/lib/payments/stripeBankTransfer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isLocalStripeBankTransferMockEnabled()) {
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
