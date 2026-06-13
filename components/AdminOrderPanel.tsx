"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/formatMoney";
import { orderStatuses, readOrders, saveOrders } from "@/lib/orders";
import type { Order, OrderStatus } from "@/lib/types";
import { CopyOrderButton } from "./CopyOrderButton";

export function AdminOrderPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [selectedOrderNo, setSelectedOrderNo] = useState("");

  useEffect(() => {
    const stored = readOrders();
    setOrders(stored);
    setSelectedOrderNo(stored[0]?.orderNo || "");
  }, []);

  const filteredOrders = useMemo(
    () => orders.filter((order) => order.orderNo.toLowerCase().includes(query.toLowerCase().trim())),
    [orders, query],
  );
  const selected = orders.find((order) => order.orderNo === selectedOrderNo) || filteredOrders[0];

  function updateStatus(orderNo: string, status: OrderStatus) {
    const next = orders.map((order) => (order.orderNo === orderNo ? { ...order, status } : order));
    setOrders(next);
    saveOrders(next);
  }

  if (orders.length === 0) {
    return (
      <section className="admin-shell">
        <div className="empty-state">
          <h2>No mock orders yet</h2>
          <p>Submit an order through checkout and it will appear here from localStorage.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-shell">
      <div className="admin-list">
        <input
          aria-label="Search by order number"
          placeholder="Search order number"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {filteredOrders.map((order) => (
          <button
            className={order.orderNo === selected?.orderNo ? "order-row active" : "order-row"}
            type="button"
            key={order.orderNo}
            onClick={() => setSelectedOrderNo(order.orderNo)}
          >
            <strong>#{order.orderNo}</strong>
            <span>{order.customer.fullName}</span>
            <span>{formatMoney(order.total)}</span>
            <small>{order.status}</small>
          </button>
        ))}
      </div>
      {selected ? (
        <div className="admin-detail">
          <div className="split-heading">
            <div>
              <p className="eyebrow">Order detail</p>
              <h2>#{selected.orderNo}</h2>
            </div>
            <CopyOrderButton order={selected} />
          </div>
          <label>
            Status
            <select
              value={selected.status}
              onChange={(event) => updateStatus(selected.orderNo, event.target.value as OrderStatus)}
            >
              {orderStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <div className="detail-grid">
            <div>
              <h3>Customer</h3>
              <p>{selected.customer.fullName}</p>
              <p>{selected.customer.phone}</p>
              <p>{selected.customer.email || "Email not provided"}</p>
              <p>{selected.customer.preferredContact}</p>
            </div>
            <div>
              <h3>Delivery Address</h3>
              <p>{selected.customer.address}</p>
              <p>{selected.customer.city}</p>
              <p>{selected.customer.postcode}</p>
              <p>{selected.customer.country}</p>
            </div>
          </div>
          <div className="order-items">
            {selected.items.map((item) => (
              <div key={`${item.productId}-${item.color}-${item.size}`}>
                <span>
                  {item.name} · {item.color} · Size {item.size} · Qty {item.quantity}
                </span>
                <strong>{formatMoney(item.priceGBP * item.quantity)}</strong>
              </div>
            ))}
          </div>
          <div className="totals">
            <div>
              <span>Subtotal</span>
              <strong>{formatMoney(selected.subtotal)}</strong>
            </div>
            <div>
              <span>Shipping</span>
              <strong>{formatMoney(selected.shipping)}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatMoney(selected.total)}</strong>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
