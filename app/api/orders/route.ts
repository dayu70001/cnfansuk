import { NextResponse } from "next/server";

const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" };

export async function POST() {
  return NextResponse.json(
    { error: "Online checkout is temporarily paused. Please contact us on WhatsApp." },
    { status: 503, headers: noStoreHeaders },
  );
}
