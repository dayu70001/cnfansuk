import { NextResponse } from "next/server";
import { loadAuthorizedOrder, type AuthorizedWorkerOrder } from "@/lib/authorizedOrder";

type RouteContext = { params: Promise<{ orderNumber: string }> };

function projectConfirmationOrder(order: AuthorizedWorkerOrder) {
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
  const result = await loadAuthorizedOrder(orderNumber, token);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ order: projectConfirmationOrder(result.order) }, { headers: { "Cache-Control": "no-store" } });
}
