import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { error: "Online payments are temporarily paused. Please contact us on WhatsApp." },
    { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
