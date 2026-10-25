import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
};

export async function GET() {
  return NextResponse.json(
    { error: "Online payments are temporarily paused. Please contact us on WhatsApp." },
    { status: 503, headers: noStoreHeaders },
  );
}
