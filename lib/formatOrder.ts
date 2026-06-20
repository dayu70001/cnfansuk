import { formatMoney } from "./formatMoney";
import type { Order } from "./types";

export function formatOrderForCopy(order: Order) {
  const items = order.items
    .map(
      (item, index) =>
        `${index + 1}. ${[item.name, item.color, `Size ${item.size}`, `Qty ${item.quantity}`].filter(Boolean).join(" - ")} - ${formatMoney(item.priceGBP)}`,
    )
    .join("\n");

  return `Order Confirmation

Order No: #${order.orderNo}
Name: ${order.customer.fullName}
Phone / WhatsApp: ${order.customer.phone}

Items:

${items}

Subtotal: ${formatMoney(order.subtotal)}
Shipping: ${formatMoney(order.shipping)}
Total: ${formatMoney(order.total)}

Delivery Address:
${order.customer.address}
${order.customer.city}
${order.customer.postcode}
United Kingdom

Please confirm the details above. Once confirmed, we will send the payment instructions.`;
}
