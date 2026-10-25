import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { enabled: false, mode: "disabled" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
