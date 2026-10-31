export type OrderDisplaySnapshot = {
  customerName?: string | null;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  county?: string | null;
  postcode?: string | null;
  countryName?: string | null;
  shippingMethodLabel?: string | null;
  shippingEstimate?: string | null;
};

export type OrderContactFieldKey = "name" | "email" | "phone";
export type OrderAddressFieldKey =
  | "recipient"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "county"
  | "postcode"
  | "country";
export type OrderDeliveryFieldKey = "shippingMethod" | "estimatedDelivery";

export const ORDER_CONTACT_FIELD_LABELS: Record<OrderContactFieldKey, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
};

export const ORDER_ADDRESS_FIELD_LABELS: Record<OrderAddressFieldKey, string> = {
  recipient: "Recipient",
  addressLine1: "Address line 1",
  addressLine2: "Address line 2",
  city: "City / Town",
  county: "County / State",
  postcode: "Postcode",
  country: "Country",
};

export const ORDER_DELIVERY_FIELD_LABELS: Record<OrderDeliveryFieldKey, string> = {
  shippingMethod: "Shipping Method",
  estimatedDelivery: "Estimated Delivery",
};

export type OrderDisplayField<TKey extends string> = {
  key: TKey;
  value: string;
};

function fields<TKey extends string>(rows: Array<OrderDisplayField<TKey> | null>): OrderDisplayField<TKey>[] {
  return rows.filter((row): row is OrderDisplayField<TKey> => Boolean(row?.value.trim()));
}

export function getOrderContactFields(order: OrderDisplaySnapshot): OrderDisplayField<OrderContactFieldKey>[] {
  return fields([
    order.customerName ? { key: "name", value: order.customerName } : null,
    order.email ? { key: "email", value: order.email } : null,
    order.phone ? { key: "phone", value: order.phone } : null,
  ]);
}

export function getOrderAddressFields(order: OrderDisplaySnapshot): OrderDisplayField<OrderAddressFieldKey>[] {
  return fields([
    order.customerName ? { key: "recipient", value: order.customerName } : null,
    order.addressLine1 ? { key: "addressLine1", value: order.addressLine1 } : null,
    order.addressLine2 ? { key: "addressLine2", value: order.addressLine2 } : null,
    order.city ? { key: "city", value: order.city } : null,
    order.county ? { key: "county", value: order.county } : null,
    order.postcode ? { key: "postcode", value: order.postcode } : null,
    order.countryName ? { key: "country", value: order.countryName } : null,
  ]);
}

export function formatOrderAddressForCopy(order: OrderDisplaySnapshot): string {
  return getOrderAddressFields(order).map((row) => row.value).join("\n");
}

export function formatOrderCustomerDetailsForCopy(order: OrderDisplaySnapshot): string {
  const contactLabels: Record<OrderContactFieldKey, string> = {
    name: "收件人",
    phone: "电话",
    email: "邮箱",
  };
  const addressLabels: Partial<Record<OrderAddressFieldKey, string>> = {
    addressLine1: "地址 1",
    addressLine2: "地址 2",
    city: "城市",
    county: "郡 / 省 / 州",
    postcode: "邮编",
    country: "国家",
  };
  const contact = getOrderContactFields(order);
  const address = getOrderAddressFields(order).filter((row) => row.key !== "recipient");
  const contactLines = (["name", "phone", "email"] as const).flatMap((key) => {
    const row = contact.find((field) => field.key === key);
    return row ? [`${contactLabels[key]}：${row.value}`] : [];
  });
  return [
    ...contactLines,
    ...address.flatMap((row) => {
      const label = addressLabels[row.key];
      return label ? [`${label}：${row.value}`] : [];
    }),
  ].join("\n");
}

export function getOrderDeliveryFields(order: OrderDisplaySnapshot): OrderDisplayField<OrderDeliveryFieldKey>[] {
  return fields([
    order.shippingMethodLabel ? { key: "shippingMethod", value: order.shippingMethodLabel } : null,
    order.shippingEstimate ? { key: "estimatedDelivery", value: order.shippingEstimate } : null,
  ]);
}
