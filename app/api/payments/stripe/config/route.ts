import { NextResponse } from "next/server";
import { getStripeBankTransferMode, isStripeLiveProductionRequest } from "@/lib/payments/stripeBankTransfer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const configuredMode = getStripeBankTransferMode();
  const mode = configuredMode === "live" && !isStripeLiveProductionRequest(request)
    ? "disabled"
    : configuredMode;
  return NextResponse.json(
    {
      enabled: mode !== "disabled",
      mode: mode === "disabled" ? "unconfigured" : mode,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
