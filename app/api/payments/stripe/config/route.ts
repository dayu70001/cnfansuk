import { NextResponse } from "next/server";
import { getLocalStripeBankTransferMode } from "@/lib/payments/stripeBankTransfer";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { mode: getLocalStripeBankTransferMode() === "disabled" ? "unconfigured" : getLocalStripeBankTransferMode() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
