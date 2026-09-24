import "server-only";

import { getAdminWorkerToken } from "@/lib/adminAuth";
import { getCatalogApiBase } from "@/lib/catalogApiBase";
import { verifyOrderAccessToken } from "@/lib/orderAccessToken";

export type AuthorizedWorkerOrder = {
  order_number: string;
  status: string;
  payment_stage?: string;
  subtotal: number;
  shipping_fee: number;
  final_total: number;
  currency: "GBP" | "EUR" | "USD";
  email: string;
  shipping_method_label: string;
  shipping_estimate: string;
  customer_name?: string;
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

export type AuthorizedOrderResult =
  | { ok: true; order: AuthorizedWorkerOrder }
  | { ok: false; status: number; error: string };

/** Validate the existing per-order HMAC token, then read the order via the server-only Worker admin API. */
export async function loadAuthorizedOrder(orderNumber: string, orderAccessToken: string): Promise<AuthorizedOrderResult> {
  if (!verifyOrderAccessToken(orderAccessToken, orderNumber)) {
    return { ok: false, status: 401, error: "订单访问凭证无效或已过期。" };
  }

  const workerToken = getAdminWorkerToken();
  if (!workerToken) return { ok: false, status: 503, error: "订单服务尚未配置。" };

  let response: Response;
  try {
    response = await fetch(`${getCatalogApiBase()}/admin/orders/${encodeURIComponent(orderNumber)}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${workerToken}` },
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 503, error: "订单服务暂时不可用。" };
  }

  const result = await response.json().catch(() => ({})) as { order?: AuthorizedWorkerOrder; error?: string };
  if (!response.ok || !result.order || result.order.order_number !== orderNumber) {
    return {
      ok: false,
      status: response.status || 404,
      error: result.error || "未找到订单。",
    };
  }
  return { ok: true, order: result.order };
}
