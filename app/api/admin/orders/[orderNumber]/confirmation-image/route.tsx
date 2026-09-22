import { ImageResponse } from "next/og";
import { isAdminAuthenticated, getAdminWorkerToken } from "@/lib/adminAuth";

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
  created_at: string;
  customer_name: string;
  email: string;
  phone: string;
  country_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  shipping_method_label: string;
  shipping_estimate: string;
  shipping_fee: number;
  subtotal: number;
  total: number;
  final_total?: number;
  currency: "GBP" | "EUR" | "USD";
  items?: ConfirmationItem[];
};

type RouteContext = { params: Promise<{ orderNumber: string }> };

function workerBaseUrl() {
  return (process.env.CATALOG_API_BASE || process.env.NEXT_PUBLIC_CATALOG_API_BASE || "").replace(/\/+$/, "");
}

function money(value: number, currency: ConfirmationOrder["currency"]) {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-GB", {
    style: "currency",
    currency,
  }).format(Number(value || 0));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function dataUri(contentType: string, bytes: ArrayBuffer) {
  return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
}

async function imageSnapshot(url: string | null) {
  if (!url) return null;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    return dataUri(contentType.split(";")[0], await response.arrayBuffer());
  } catch {
    return null;
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

export async function GET(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return new Response("Unauthorized", { status: 401 });
  const { orderNumber } = await context.params;
  const order = await loadOrder(orderNumber);
  if (!order) return new Response("Order not found", { status: 404 });

  const items = order.items || [];
  const itemImages = await Promise.all(items.map((item) => imageSnapshot(item.image_url)));
  const address = [order.address_line1, order.address_line2, order.city, order.county, order.postcode, order.country_name]
    .filter(Boolean)
    .join(", ");
  const total = order.final_total ?? order.total;
  const height = Math.max(920, 690 + Math.min(items.length, 8) * 190);

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
              <div>Name: {order.customer_name}</div>
              <div>Email: {order.email}</div>
              <div>Phone: {order.phone}</div>
              <div>Shipping Address: {address}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 380 }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>DELIVERY</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 20 }}>
              <div>Shipping Method: {order.shipping_method_label || "Not specified"}</div>
              {order.shipping_estimate ? <div>Estimated Delivery: {order.shipping_estimate}</div> : null}
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
                <div style={{ color: "#555550", fontSize: 19 }}>Size: {item.size || "Not specified"}</div>
                {item.color ? <div style={{ color: "#555550", fontSize: 19 }}>Color: {item.color}</div> : null}
                <div style={{ color: "#555550", fontSize: 19 }}>Quantity: {item.quantity}</div>
                <div style={{ fontSize: 21, fontWeight: 700 }}>Amount: {money(item.line_total, order.currency)}</div>
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
