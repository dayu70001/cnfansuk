import { NextResponse } from "next/server";
import { isLocalStripeBankTransferMockEnabled } from "@/lib/payments/stripeBankTransfer";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { mode: isLocalStripeBankTransferMockEnabled() ? "mock" : "unconfigured" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
