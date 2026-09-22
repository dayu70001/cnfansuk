import { NextResponse } from "next/server";
import { getAdminWorkerToken } from "@/lib/adminAuth";
import { getCatalogApiBase } from "@/lib/catalogApiBase";
import { verifyOrderAccessToken } from "@/lib/orderAccessToken";

type RouteContext = { params: Promise<{ orderNumber: string }> };

type WorkerAdminOrder = {
  order_number: string;
  status: string;
  payment_stage?: string;
  subtotal: number;
  shipping_fee: number;
  final_total: number;
  currency: "GBP" | "EUR" | "USD";
  shipping_method_label: string;
  shipping_estimate: string;
  customer_name?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  county?: string | null;
  postcode?: string;
  country_name?: string;
  items?: Array<{
    product_code: string;
    title: string;
    slug?: string;
    image_url?: string | null;
    size: string;
    color: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
};

function projectConfirmationOrder(order: WorkerAdminOrder) {
  return {
    orderNumber: order.order_number,
    status: order.status,
    paymentStage: order.payment_stage,
    subtotal: order.subtotal,
    shippingFee: order.shipping_fee,
    total: order.final_total,
    currency: order.currency,
    shippingMethod: order.shipping_method_label,
    shippingEstimate: order.shipping_estimate,
    customer: order.customer_name && order.address_line1
      ? {
          name: order.customer_name,
          addressLine1: order.address_line1,
          addressLine2: order.address_line2 || null,
          city: order.city || "",
          county: order.county || null,
          postcode: order.postcode || "",
          countryName: order.country_name || "",
        }
      : null,
    items: (order.items || []).map((item) => ({
      productCode: item.product_code,
      title: item.title,
      slug: item.slug,
      image: item.image_url || null,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: item.line_total,
    })),
  };
}

export async function GET(request: Request, context: RouteContext) {
  const { orderNumber } = await context.params;
  const token = request.headers.get("X-Order-Access-Token") || "";
  if (!verifyOrderAccessToken(token, orderNumber)) {
    return NextResponse.json({ error: "订单访问凭证无效或已过期。" }, { status: 401 });
  }

  const workerToken = getAdminWorkerToken();
  if (!workerToken) return NextResponse.json({ error: "订单服务尚未配置。" }, { status: 503 });

  const response = await fetch(`${getCatalogApiBase()}/admin/orders/${encodeURIComponent(orderNumber)}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${workerToken}` },
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({})) as { order?: WorkerAdminOrder; error?: string };
  if (!response.ok || !result.order) {
    return NextResponse.json({ error: result.error || "未找到订单。" }, { status: response.status || 404 });
  }

  return NextResponse.json({ order: projectConfirmationOrder(result.order) }, { headers: { "Cache-Control": "no-store" } });
}
