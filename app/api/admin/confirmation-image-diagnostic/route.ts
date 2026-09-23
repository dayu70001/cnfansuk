import { timingSafeEqual } from "node:crypto";
import { ADMIN_SESSION_COOKIE, createAdminSessionValue, getAdminLoginSecret } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIAGNOSTIC_BRANCH = "codex/fix-system-stability";
const DIAGNOSTIC_ORDER_SENTINEL = "__cnfans_diagnostic__";
const MODES = ["A", "B", "C", "D", "E", "F"] as const;
type DiagnosticMode = typeof MODES[number];

function isAuthorizedDiagnosticRequest(request: Request) {
  if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== DIAGNOSTIC_BRANCH) return false;
  const expected = process.env.CNFANS_DIAGNOSTIC_KEY || "";
  const supplied = request.headers.get("x-cnfans-diagnostic-key") || "";
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length > 0 && expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

function pngMetadata(bytes: Uint8Array) {
  const pngSignature = bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  if (!pngSignature || bytes.length < 24) return { pngSignature, width: null, height: null };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { pngSignature, width: view.getUint32(16), height: view.getUint32(20) };
}

async function readTargetResponse(response: Response) {
  const bytes = new Uint8Array(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "";
  const result: Record<string, unknown> = {
    status: response.status,
    contentType,
    contentLengthHeader: response.headers.get("content-length"),
    bytes: bytes.byteLength,
    durationMs: 0,
  };
  if (contentType.toLowerCase().includes("image/png")) Object.assign(result, pngMetadata(bytes));
  if (contentType.toLowerCase().includes("application/json")) {
    try {
      const payload = JSON.parse(Buffer.from(bytes).toString("utf8")) as { diagnosticFailure?: boolean; stage?: string; errorName?: string };
      if (payload.diagnosticFailure) Object.assign(result, { failureStage: payload.stage, errorName: payload.errorName });
    } catch {
      Object.assign(result, { jsonParseable: false });
    }
  }
  return { result, bytes };
}

export async function GET(request: Request) {
  if (!isAuthorizedDiagnosticRequest(request)) return new Response("Not found", { status: 404 });
  const modeValue = new URL(request.url).searchParams.get("mode") || "";
  if (!MODES.includes(modeValue as DiagnosticMode)) return Response.json({ error: "invalid-diagnostic-mode" }, { status: 400 });
  const mode = modeValue as DiagnosticMode;
  const loginSecret = getAdminLoginSecret();
  if (!loginSecret) return Response.json({ error: "preview-admin-secret-unavailable" }, { status: 503 });

  const cookieValue = createAdminSessionValue(loginSecret);
  const cookie = `${ADMIN_SESSION_COOKIE}=${cookieValue}`;
  const origin = new URL(request.url).origin;
  const headers = { cookie, accept: "application/json" };

  try {
    const listResponse = await fetch(new URL("/api/admin/orders?limit=1", origin), { headers, cache: "no-store" });
    if (!listResponse.ok) return Response.json({ mode, orderListStatus: listResponse.status }, { status: 502 });
    const listPayload = await listResponse.json() as { orders?: Array<{ order_number?: string }> };
    const orderNumber = listPayload.orders?.[0]?.order_number;
    if (!orderNumber) return Response.json({ mode, orderListStatus: listResponse.status, existingOrderFound: false }, { status: 404 });

    const runTarget = async (targetMode: DiagnosticMode) => {
      const targetStartedAt = Date.now();
      const targetResponse = await fetch(new URL(`/api/admin/orders/${DIAGNOSTIC_ORDER_SENTINEL}/confirmation-image`, origin), {
        headers: {
          cookie,
          accept: targetMode === "A" ? "text/plain" : "image/png",
          "x-cnfans-diagnostic-key": request.headers.get("x-cnfans-diagnostic-key") || "",
          "x-cnfans-diagnostic-mode": targetMode,
          "x-cnfans-internal-order-number": orderNumber,
        },
        cache: "no-store",
      });
      const parsed = await readTargetResponse(targetResponse);
      parsed.result.durationMs = Date.now() - targetStartedAt;
      return { response: targetResponse, ...parsed };
    };

    const detailTest = await runTarget("A");
    if (detailTest.response.status !== 200) {
      return Response.json({ mode, orderListStatus: listResponse.status, adminDetailStatus: detailTest.response.status, adminDetailFailureStage: detailTest.result.failureStage || null }, { status: 502 });
    }

    const test = mode === "A" ? detailTest : await runTarget(mode);
    if (mode === "F" && request.headers.get("x-cnfans-diagnostic-download") === "1" && test.response.ok && test.result.contentType === "image/png") {
      return new Response(test.bytes, {
        status: test.response.status,
        headers: {
          "content-type": "image/png",
          "cache-control": "no-store",
          "x-diagnostic-mode": mode,
          "x-image-bytes": String(test.result.bytes),
          "x-png-signature": String(Boolean(test.result.pngSignature)),
          "x-image-width": String(test.result.width ?? ""),
          "x-image-height": String(test.result.height ?? ""),
        },
      });
    }

    return Response.json({
      mode,
      orderListStatus: listResponse.status,
      adminDetailStatus: detailTest.response.status,
      testStatus: test.response.status,
      contentType: test.result.contentType,
      contentLengthHeader: test.result.contentLengthHeader,
      bytes: test.result.bytes,
      durationMs: test.result.durationMs,
      pngSignature: test.result.pngSignature ?? null,
      width: test.result.width ?? null,
      height: test.result.height ?? null,
      failureStage: test.result.failureStage ?? null,
      errorName: test.result.errorName ?? null,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ mode, driverFailureName: error instanceof Error ? error.name : "Error" }, { status: 502 });
  }
}
