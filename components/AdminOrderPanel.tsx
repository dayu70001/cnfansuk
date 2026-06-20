"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatMoney } from "@/lib/formatMoney";
import type { CurrencyCode } from "@/lib/currency";

type AdminOrderStatus = "pending" | "confirmed" | "paid" | "processing" | "shipped" | "completed" | "cancelled";
type AdminOrderItem = {
  id: number;
  product_code: string;
  title: string;
  slug: string;
  product_url: string;
  image_url: string | null;
  size: string;
  color: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  currency: CurrencyCode;
};
type AdminOrder = {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  email: string;
  phone: string;
  country_code: string;
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
  currency: CurrencyCode;
  payment_method: string;
  status: AdminOrderStatus;
  items?: AdminOrderItem[];
};

const statusLabels: Record<AdminOrderStatus, string> = {
  pending: "待处理",
  confirmed: "已确认",
  paid: "已付款",
  processing: "处理中",
  shipped: "已发货",
  completed: "已完成",
  cancelled: "已取消",
};
const statuses = Object.keys(statusLabels) as AdminOrderStatus[];

function formatOrderDate(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

async function requestOrders(search: string, status: string) {
  const params = new URLSearchParams({ q: search.trim(), status, limit: "200" });
  const response = await fetch(`/api/admin/orders?${params}`, { cache: "no-store" });
  const result = await response.json().catch(() => ({})) as { orders?: AdminOrder[]; error?: string };
  return { response, result };
}

async function requestOrderDetail(orderNumber: string) {
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}`, { cache: "no-store" });
  const result = await response.json().catch(() => ({})) as { order?: AdminOrder; error?: string };
  return { response, result };
}

export function AdminOrderPanel() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadOrders(search = query, nextStatus = status) {
    setLoading(true);
    const { response, result } = await requestOrders(search, nextStatus);
    if (!response.ok) {
      setMessage(result.error || "读取订单失败。");
      setLoading(false);
      return;
    }
    const nextOrders = result.orders || [];
    setOrders(nextOrders);
    setLoading(false);
    if (nextOrders.length > 0) await loadOrderDetail(nextOrders[0].order_number);
    else setSelected(null);
  }

  async function loadOrderDetail(orderNumber: string) {
    setDetailLoading(true);
    setMessage("");
    const { response, result } = await requestOrderDetail(orderNumber);
    if (!response.ok || !result.order) {
      setMessage(result.error || "读取订单详情失败。");
      setDetailLoading(false);
      return;
    }
    setSelected(result.order);
    setDetailLoading(false);
  }

  useEffect(() => {
    let active = true;
    void requestOrders("", "").then(async ({ response, result }) => {
      if (!active) return;
      if (!response.ok) {
        setMessage(result.error || "读取订单失败。");
        setLoading(false);
        return;
      }
      const nextOrders = result.orders || [];
      setOrders(nextOrders);
      setLoading(false);
      if (nextOrders.length > 0) {
        const detail = await requestOrderDetail(nextOrders[0].order_number);
        if (active && detail.response.ok && detail.result.order) setSelected(detail.result.order);
      }
    });
    return () => { active = false; };
  }, []);

  async function updateStatus(nextStatus: AdminOrderStatus) {
    if (!selected) return;
    const response = await fetch(`/api/admin/orders/${encodeURIComponent(selected.order_number)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const result = await response.json().catch(() => ({})) as { order?: AdminOrder; error?: string };
    if (!response.ok || !result.order) {
      setMessage(result.error || "状态保存失败。");
      return;
    }
    setSelected(result.order);
    setOrders((current) => current.map((order) => order.order_number === result.order?.order_number ? { ...order, status: result.order.status } : order));
    setMessage("订单状态已保存。 ");
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    void loadOrders();
  }

  return (
    <section className="admin-shell admin-orders-shell">
      <div className="admin-list">
        <form className="admin-order-search" onSubmit={submitSearch}>
          <input aria-label="搜索订单" placeholder="订单号、姓名、邮箱或电话" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select aria-label="订单状态" value={status} onChange={(event) => { setStatus(event.target.value); void loadOrders(query, event.target.value); }}>
            <option value="">全部状态</option>
            {statuses.map((item) => <option value={item} key={item}>{statusLabels[item]}</option>)}
          </select>
          <button className="btn btn-solid" type="submit">搜索</button>
        </form>
        {loading ? <p>正在读取订单…</p> : null}
        {!loading && orders.length === 0 ? <p>暂时没有订单。</p> : null}
        {orders.map((order) => (
          <button
            className={order.order_number === selected?.order_number ? "order-row active" : "order-row"}
            type="button"
            key={order.order_number}
            aria-pressed={order.order_number === selected?.order_number}
            onClick={() => void loadOrderDetail(order.order_number)}
          >
            <span className="order-row-top"><strong>{order.order_number}</strong><small className={`order-status order-status-${order.status}`}>{statusLabels[order.status]}</small></span>
            <span className="order-row-customer">{order.customer_name}</span>
            <span className="order-row-bottom"><small>{formatOrderDate(order.created_at)}</small><strong>{formatMoney(order.total, order.currency)}</strong></span>
          </button>
        ))}
      </div>
      <div className="admin-detail">
        {message ? <p className="admin-status">{message}</p> : null}
        {detailLoading ? <p className="admin-detail-loading">正在读取订单详情…</p> : null}
        {selected && !detailLoading ? (
          <>
            <header className="admin-order-detail-head">
              <h2>订单详情：{selected.order_number}</h2>
              <p>下单时间：{formatOrderDate(selected.created_at)}</p>
              <label className="admin-order-status-field"><span>订单状态</span><select value={selected.status} onChange={(event) => void updateStatus(event.target.value as AdminOrderStatus)}>
                {statuses.map((item) => <option value={item} key={item}>{statusLabels[item]}</option>)}
              </select></label>
            </header>

            <section className="admin-order-detail-section">
              <h3>客户资料</h3>
              <dl className="admin-order-info-list">
                <div><dt>收货人邮箱</dt><dd>{selected.email}</dd></div>
                <div><dt>收货人姓名</dt><dd>{selected.customer_name}</dd></div>
                <div><dt>收货人地址</dt><dd>{[selected.address_line1, selected.address_line2, selected.city, selected.county, selected.postcode, selected.country_name].filter(Boolean).join("，")}</dd></div>
                <div><dt>收货人电话</dt><dd>{selected.phone}</dd></div>
              </dl>
            </section>

            <section className="admin-order-detail-section">
              <h3>配送与付款</h3>
              <dl className="admin-order-payment-list">
                <div><dt>配送方式</dt><dd>{selected.shipping_method_label}</dd></div>
                <div><dt>付款方式</dt><dd>{selected.payment_method || "待确认"}</dd></div>
                <div><dt>币种</dt><dd>{selected.currency}</dd></div>
              </dl>
            </section>

            <section className="admin-order-detail-section admin-order-products">
              <h3>商品明细</h3>
            <div className="admin-order-items">
              {(selected.items || []).map((item) => (
                <article key={item.id}>
                  <a className="admin-order-item-image" href={`/product/${item.slug}`} target="_blank" rel="noreferrer">{item.image_url ? <img src={item.image_url} alt={item.title} /> : <span>暂无图片</span>}</a>
                  <div className="admin-order-item-copy">
                    <div className="admin-order-item-main"><h4>{item.title}</h4><strong>{formatMoney(item.line_total, selected.currency)}</strong></div>
                    <div className="admin-order-item-options"><span>尺码：{item.size}</span><span>数量：{item.quantity}</span>{item.color ? <span>颜色：{item.color}</span> : null}</div>
                  </div>
                </article>
              ))}
            </div>
            </section>

            <section className="admin-order-totals" aria-label="订单金额">
              <div><span>商品小计</span><strong>{formatMoney(selected.subtotal, selected.currency)}</strong></div>
              <div><span>配送费用</span><strong>{formatMoney(selected.shipping_fee, selected.currency)}</strong></div>
              <div className="admin-order-grand-total"><span>订单总额</span><strong>{formatMoney(selected.total, selected.currency)}</strong></div>
            </section>
          </>
        ) : !detailLoading ? <p>点击左侧订单查看详情。</p> : null}
      </div>
    </section>
  );
}
