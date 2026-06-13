import type { Order, OrderStatus } from "./types";
import { readStorage, writeStorage } from "./storage";

export const ORDERS_STORAGE_KEY = "cnfansuk-orders";

export const orderStatuses: OrderStatus[] = [
  "Order Submitted",
  "Awaiting Confirmation",
  "Payment Details Sent",
  "Payment Received",
  "Processing",
  "Shipped",
  "Completed",
  "Cancelled",
];

export function createOrderNumber() {
  const stored = Number(readStorage("cnfansuk-order-sequence") || "10022");
  const next = stored + 1;
  writeStorage("cnfansuk-order-sequence", String(next));
  return `CNF-UK-${next}`;
}

export function readOrders(): Order[] {
  try {
    return JSON.parse(readStorage(ORDERS_STORAGE_KEY) || "[]") as Order[];
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]) {
  writeStorage(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

export function addOrder(order: Order) {
  const orders = readOrders();
  saveOrders([order, ...orders]);
}
