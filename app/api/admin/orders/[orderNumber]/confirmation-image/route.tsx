import { timingSafeEqual } from "node:crypto";
import { ImageResponse } from "next/og";
import { isAdminAuthenticated, getAdminWorkerToken } from "@/lib/adminAuth";
import { getCatalogApiBase } from "@/lib/catalogApiBase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConfirmationItem = {
  title: string;
  image_url: string | null;
  size: string;
  color: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type ConfirmationOrder = {
  order_number: string;
  created_at?: string | null;
  customer_name?: string | null;
  email?: string | null;
  phone?: string | null;
  country_name?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  county: string | null;
  postcode?: string | null;
  shipping_method_label?: string | null;
  shipping_estimate?: string | null;
  shipping_fee?: number | null;
  subtotal?: number | null;
  total?: number | null;
  final_total?: number;
  currency?: "GBP" | "EUR" | "USD" | string | null;
  items?: ConfirmationItem[];
};

type RouteContext = { params: Promise<{ orderNumber: string }> };
type DiagnosticMode = "A" | "B" | "C" | "D" | "E" | "F";
type ImageSnapshot = {
  dataUri: string | null;
  requested: boolean;
  status: number | null;
  contentType: string | null;
  bytes: number;
  durationMs: number;
  failure: string | null;
};

const DIAGNOSTIC_BRANCH = "codex/fix-system-stability";
const DIAGNOSTIC_ORDER_SENTINEL = "__cnfans_diagnostic__";

function workerBaseUrl() {
  return getCatalogApiBase();
}

function isDiagnosticRuntime() {
  return process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === DIAGNOSTIC_BRANCH;
}

function readDiagnosticMode(request: Request): DiagnosticMode | null {
  if (!isDiagnosticRuntime()) return null;
  const expected = process.env.CNFANS_DIAGNOSTIC_KEY || "";
  const supplied = request.headers.get("x-cnfans-diagnostic-key") || "";
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  if (!expectedBytes.length || expectedBytes.length !== suppliedBytes.length || !timingSafeEqual(expectedBytes, suppliedBytes)) return null;
  const mode = request.headers.get("x-cnfans-diagnostic-mode") || "";
  return ["A", "B", "C", "D", "E", "F"].includes(mode) ? mode as DiagnosticMode : null;
}

function sanitizeDiagnosticText(value: string, sensitiveValues: string[] = []) {
  let sanitized = value;
  for (const sensitiveValue of sensitiveValues) {
    if (sensitiveValue.length >= 4) sanitized = sanitized.split(sensitiveValue).join("[REDACTED]");
  }
  return sanitized
    .replace(/https?:\/\/[^\s"'`]+/gi, "[URL]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL]")
    .replace(/\b(?:\+?\d[\d\s().-]{6,}\d)\b/g, "[PHONE]")
    .replace(/\b[A-Z]{2,10}[-_]?[0-9]{4,}\b/g, "[ORDER]")
    .replace(/\b\d{1,6}\s+[\p{L}\d .'-]{1,70}\s+(?:street|st\.?|road|rd\.?|avenue|ave\.?|lane|ln\.?|drive|dr\.?|close|court|way)\b/giu, "[ADDRESS]")
    .slice(0, 4000);
}

function diagnosticLog(stage: string, startedAt: number, fields: Record<string, unknown> = {}, level: "info" | "error" = "info") {
  const entry = { scope: "cnfans-confirmation-image", stage, durationMs: Date.now() - startedAt, ...fields };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else console.info(line);
}

function safeError(error: unknown, sensitiveValues: string[] = []) {
  const value = error instanceof Error ? error : new Error("Unknown error");
  const allSensitiveValues = [
    process.env.ADMIN_PASSWORD || "",
    process.env.ADMIN_TOKEN || "",
    process.env.CNFANS_DIAGNOSTIC_KEY || "",
    ...sensitiveValues,
  ];
  return {
    name: sanitizeDiagnosticText(value.name || "Error", allSensitiveValues),
    message: sanitizeDiagnosticText(value.message || "No message", allSensitiveValues),
    stack: sanitizeDiagnosticText(value.stack || "No stack", allSensitiveValues),
  };
}

function money(value: unknown, currency: ConfirmationOrder["currency"]) {
  const safeCurrency = currency === "EUR" || currency === "USD" ? currency : "GBP";
  return new Intl.NumberFormat(safeCurrency === "USD" ? "en-US" : "en-GB", {
    style: "currency",
    currency: safeCurrency,
  }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Not specified";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function dataUri(contentType: string, bytes: ArrayBuffer) {
  return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
}

async function imageSnapshot(url: string | null, imageIndex: number, diagnostic: boolean): Promise<ImageSnapshot> {
  if (!url) return { dataUri: null, requested: false, status: null, contentType: null, bytes: 0, durationMs: 0, failure: "no-image-url" };
  const startedAt = Date.now();
  if (diagnostic) diagnosticLog("IMG-08 image-fetch-start", startedAt, { imageIndex });
  try {
    const response = await fetch(url, { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      const result = { dataUri: null, requested: true, status: response.status, contentType, bytes: 0, durationMs: Date.now() - startedAt, failure: "http-not-ok" };
      if (diagnostic) diagnosticLog("IMG-09 image-fetch-pass", startedAt, { imageIndex, status: result.status, contentType, bytes: 0, fallback: true, failure: result.failure });
      return result;
    }
    if (!contentType.toLowerCase().startsWith("image/")) {
      const result = { dataUri: null, requested: true, status: response.status, contentType, bytes: 0, durationMs: Date.now() - startedAt, failure: "unsupported-content-type" };
      if (diagnostic) diagnosticLog("IMG-09 image-fetch-pass", startedAt, { imageIndex, status: result.status, contentType, bytes: 0, fallback: true, failure: result.failure });
      return result;
    }
    const bytes = await response.arrayBuffer();
    const imageType = contentType.split(";")[0];
    const result = { dataUri: dataUri(imageType, bytes), requested: true, status: response.status, contentType, bytes: bytes.byteLength, durationMs: Date.now() - startedAt, failure: null };
    if (diagnostic) diagnosticLog("IMG-09 image-fetch-pass", startedAt, { imageIndex, status: result.status, contentType, bytes: result.bytes, fallback: false });
    return result;
  } catch (error) {
    const details = safeError(error, [url]);
    if (diagnostic) diagnosticLog("IMG-09 image-fetch-pass", startedAt, { imageIndex, status: null, contentType: null, bytes: 0, fallback: true, failure: "fetch-error", error: details }, "error");
    return { dataUri: null, requested: true, status: null, contentType: null, bytes: 0, durationMs: Date.now() - startedAt, failure: "fetch-error" };
  }
}

async function loadOrder(orderNumber: string): Promise<ConfirmationOrder | null> {
  const baseUrl = workerBaseUrl();
  const secret = getAdminWorkerToken();
  if (!baseUrl || !secret) return null;
  const response = await fetch(`${baseUrl}/admin/orders/${encodeURIComponent(orderNumber)}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${secret}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null) as { order?: ConfirmationOrder } | null;
  return payload?.order || null;
}

function confirmationImage(order: ConfirmationOrder, itemImages: Array<string | null>, height: number) {
  const items = Array.isArray(order.items) ? order.items : [];
  const address = [order.address_line1, order.address_line2, order.city, order.county, order.postcode, order.country_name]
    .filter(Boolean)
    .join(", ") || "Not specified";
  const total = order.final_total ?? order.total ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#f7f7f3",
          color: "#171714",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Arial, sans-serif",
          fontSize: 24,
          minHeight: "100%",
          padding: "54px 64px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #171714", paddingBottom: 28 }}>
          <div style={{ fontSize: 38, fontWeight: 700 }}>CNFans UK</div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>ORDER CONFIRMATION</div>
        </div>

        <div style={{ display: "flex", gap: 60, padding: "30px 0 20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <div style={{ color: "#6b6b67", fontSize: 18 }}>Order Number</div>
            <div style={{ fontWeight: 700 }}>{order.order_number}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <div style={{ color: "#6b6b67", fontSize: 18 }}>Order Date</div>
            <div>{formatDate(order.created_at)}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 36, paddingBottom: 26 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>CUSTOMER DETAILS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 20 }}>
              <div>{`Name: ${order.customer_name || "Not specified"}`}</div>
              <div>{`Email: ${order.email || "Not specified"}`}</div>
              <div>{`Phone: ${order.phone || "Not specified"}`}</div>
              <div>{`Shipping Address: ${address}`}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 380 }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>DELIVERY</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 20 }}>
              <div>{`Shipping Method: ${order.shipping_method_label || "Not specified"}`}</div>
              {order.shipping_estimate ? <div>{`Estimated Delivery: ${order.shipping_estimate}`}</div> : null}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>ORDER ITEMS</div>
          {items.length > 0 ? items.map((item, index) => (
            <div key={`${item.title}-${index}`} style={{ display: "flex", gap: 22, borderTop: "1px solid #d8d8d1", padding: "16px 0" }}>
              <div style={{ alignItems: "center", background: "#e7e7e1", display: "flex", height: 132, justifyContent: "center", overflow: "hidden", width: 106 }}>
                {itemImages[index] ? <img alt="" src={itemImages[index] as string} style={{ height: "100%", objectFit: "cover", width: "100%" }} /> : <span style={{ color: "#6b6b67", fontSize: 16 }}>Image unavailable</span>}
              </div>
              <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 7 }}>
                <div style={{ fontSize: 23, fontWeight: 700 }}>{item.title}</div>
                <div style={{ color: "#555550", fontSize: 19 }}>{`Size: ${item.size || "Not specified"}`}</div>
                {item.color ? <div style={{ color: "#555550", fontSize: 19 }}>{`Color: ${item.color}`}</div> : null}
                <div style={{ color: "#555550", fontSize: 19 }}>{`Quantity: ${item.quantity || 0}`}</div>
                <div style={{ fontSize: 21, fontWeight: 700 }}>{`Amount: ${money(item.line_total, order.currency)}`}</div>
              </div>
            </div>
          )) : <div style={{ color: "#6b6b67", padding: "16px 0" }}>No items recorded.</div>}
        </div>

        <div style={{ alignSelf: "flex-end", borderTop: "2px solid #171714", display: "flex", flexDirection: "column", gap: 9, marginTop: 18, paddingTop: 18, width: 420 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{money(order.subtotal, order.currency)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Shipping</span><span>{money(order.shipping_fee, order.currency)}</span></div>
          <div style={{ borderTop: "1px solid #171714", display: "flex", fontSize: 28, fontWeight: 700, justifyContent: "space-between", marginTop: 8, paddingTop: 12 }}><span>Total</span><span>{money(total, order.currency)}</span></div>
        </div>

        <div style={{ color: "#555550", fontSize: 18, marginTop: 30 }}>Thank you for your order.</div>
      </div>
    ),
    { width: 1200, height },
  );
}

function diagnosticFixture(): ConfirmationOrder {
  return {
    order_number: "CNF-TEST-0001",
    created_at: "2026-09-01T12:00:00.000Z",
    customer_name: "Sample Customer",
    email: "sample@example.test",
    phone: "+44000000000",
    address_line1: "10 Example Road",
    address_line2: null,
    city: "Exampleton",
    county: null,
    postcode: "AA1 1AA",
    country_name: "United Kingdom",
    shipping_method_label: "Tracked Delivery",
    shipping_estimate: "5–10 working days",
    shipping_fee: 0,
    subtotal: 25,
    total: 25,
    currency: "GBP",
    items: [{ title: "Sample Jacket", image_url: null, size: "M", color: "Black", quantity: 1, unit_price: 25, line_total: 25 }],
  };
}

async function finishImageResponse(response: ImageResponse, mode: DiagnosticMode | null, startedAt: number) {
  if (!mode) return response;
  const bytes = await response.arrayBuffer();
  diagnosticLog("IMG-11 image-response-created", startedAt, { bytes: bytes.byteLength, contentType: response.headers.get("content-type") || "" });
  diagnosticLog("IMG-12 response-return", startedAt, { status: response.status });
  return new Response(bytes, { status: response.status, headers: response.headers });
}

export async function GET(request: Request, context: RouteContext) {
  const startedAt = Date.now();
  const diagnosticMode = readDiagnosticMode(request);
  let activeStage = "IMG-01 route-enter";
  const sensitiveValues: string[] = [];

  const mark = (stage: string, fields: Record<string, unknown> = {}) => {
    activeStage = stage;
    if (diagnosticMode) diagnosticLog(stage, startedAt, fields);
  };

  try {
    mark("IMG-01 route-enter", { diagnosticMode: diagnosticMode || "none" });
    mark("IMG-02 auth-start");
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      mark("IMG-02 auth-denied");
      return new Response("Unauthorized", { status: 401 });
    }
    mark("IMG-03 auth-pass");

    const params = await context.params;
    const pathOrderNumber = params.orderNumber;
    const isDiagnosticSentinel = pathOrderNumber === DIAGNOSTIC_ORDER_SENTINEL;
    mark("IMG-04 params-pass", { diagnosticSentinel: isDiagnosticSentinel });

    let orderNumber = pathOrderNumber;
    if (isDiagnosticSentinel) {
      if (!diagnosticMode) return new Response("Not found", { status: 404 });
      orderNumber = request.headers.get("x-cnfans-internal-order-number") || "";
      if (!orderNumber) return new Response("Not found", { status: 404 });
    }
    if (orderNumber) sensitiveValues.push(orderNumber);

    if (diagnosticMode === "B") {
      mark("IMG-10 render-start", { fixture: "static-minimal" });
      const response = new ImageResponse(
        <div style={{ display: "flex", fontFamily: "Arial", fontSize: 48 }}>CNFans UK</div>,
        { width: 1200, height: 300 },
      );
      return await finishImageResponse(response, diagnosticMode, startedAt);
    }

    if (diagnosticMode === "C") {
      mark("IMG-07 data-normalize-pass", { fixture: true, itemCount: 1 });
      mark("IMG-10 render-start", { fixture: "full-layout" });
      const response = confirmationImage(diagnosticFixture(), [null], 920);
      return await finishImageResponse(response, diagnosticMode, startedAt);
    }

    mark("IMG-05 order-load-start");
    const order = await loadOrder(orderNumber);
    if (!order) {
      mark("IMG-05 order-load-failed", { orderFound: false });
      return new Response("Order not found", { status: 404 });
    }
    const items = Array.isArray(order.items) ? order.items : [];
    mark("IMG-06 order-load-pass", { orderFound: true, itemCount: items.length });
    sensitiveValues.push(
      order.order_number,
      order.customer_name || "",
      order.email || "",
      order.phone || "",
      order.address_line1 || "",
      order.address_line2 || "",
      order.city || "",
      order.county || "",
      order.postcode || "",
      order.country_name || "",
      ...items.flatMap((item) => [item.title || "", item.image_url || ""]),
    );

    const normalizedItems = items;
    const normalizedOrder = order;
    const missingFieldCount = [
      order.order_number,
      order.created_at,
      order.customer_name,
      order.email,
      order.phone,
      order.address_line1,
      order.shipping_method_label,
      order.currency,
    ].filter((value) => value === null || value === undefined || value === "").length;
    mark("IMG-07 data-normalize-pass", { itemCount: normalizedItems.length, missingFieldCount });

    if (diagnosticMode === "A") {
      mark("IMG-12 response-return", { status: 200, imageResponseSkipped: true });
      return new Response("ok", { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
    }

    const mode = diagnosticMode;
    const requestedImageIndexes = normalizedItems
      .map((item, index) => item.image_url ? index : -1)
      .filter((index) => index >= 0);
    const firstImageIndex = requestedImageIndexes[0] ?? -1;
    let indexesToFetch = requestedImageIndexes;
    if (mode === "D") indexesToFetch = [];
    if (mode === "E") indexesToFetch = firstImageIndex >= 0 ? [firstImageIndex] : [];

    mark("IMG-08 image-fetch-start", { itemCount: normalizedItems.length, imagesToFetch: indexesToFetch.length, mode: mode || "normal" });
    const imageResults = await Promise.all(normalizedItems.map((item, index) => {
      if (!indexesToFetch.includes(index)) {
        return Promise.resolve({ dataUri: null, requested: false, status: null, contentType: null, bytes: 0, durationMs: 0, failure: null } satisfies ImageSnapshot);
      }
      return imageSnapshot(item.image_url, index, Boolean(diagnosticMode));
    }));
    const itemImages = imageResults.map((result) => result.dataUri);
    mark("IMG-09 image-fetch-pass", {
      imagesRequested: imageResults.filter((result) => result.requested).length,
      imageFallbacks: imageResults.filter((result) => result.failure !== null).length,
      totalImageBytes: imageResults.reduce((total, result) => total + result.bytes, 0),
      imageStatuses: imageResults.filter((result) => result.requested).map(({ status, contentType, bytes, durationMs, failure }) => ({ status, contentType, bytes, durationMs, failure })),
    });

    const height = normalizedItems.length <= 1 ? 920 : 1020 + (normalizedItems.length - 1) * 190;
    mark("IMG-10 render-start", { itemCount: normalizedItems.length, imageCount: itemImages.filter(Boolean).length, height });
    const response = confirmationImage(normalizedOrder, itemImages, height);
    return await finishImageResponse(response, diagnosticMode, startedAt);
  } catch (error) {
    const details = safeError(error, sensitiveValues);
    diagnosticLog(activeStage, startedAt, { failed: true, error: details }, "error");
    if (diagnosticMode) {
      return Response.json({ diagnosticFailure: true, stage: activeStage, errorName: details.name }, { status: 500 });
    }
    return new Response("Unable to generate order image", { status: 500 });
  }
}
