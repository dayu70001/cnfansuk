export const paymentMethods = [
  { id: "paypal", label: "PayPal", description: "+5% PayPal fee", feeRate: 0.05 },
  { id: "bank-transfer", label: "Bank Transfer", description: "No extra fee", feeRate: 0 },
  { id: "crypto-payment", label: "Crypto Payment", description: "No extra fee", feeRate: 0 },
] as const;

export type PaymentMethodId = (typeof paymentMethods)[number]["id"];

export function getPaymentMethod(id: PaymentMethodId | "") {
  return paymentMethods.find((method) => method.id === id) || null;
}

export function getPaymentFee(methodId: PaymentMethodId | "", amountAfterShipping: number) {
  const method = getPaymentMethod(methodId);
  return method ? Math.round(amountAfterShipping * method.feeRate * 100) / 100 : 0;
}
