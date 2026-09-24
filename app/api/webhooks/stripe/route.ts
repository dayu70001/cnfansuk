import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Reserved for verified Stripe events in a later phase. No event is accepted here yet.
export async function POST() {
  return NextResponse.json(
    { error: "Stripe webhook handling is not configured." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
