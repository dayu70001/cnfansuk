"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatMoney } from "@/lib/formatMoney";
import { getOrderPaymentStage, type OrderPaymentStage, type RawOrderStatus } from "@/lib/orderStatus";
import type { CurrencyCode } from "@/lib/currency";
import { formatOrderCustomerDetailsForCopy, getOrderAddressFields, getOrderContactFields, getOrderDeliveryFields, type OrderDisplaySnapshot } from "@/lib/orderDisplayFields";

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
  updated_at: string;
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
  payment_fee: number;
  payment_fee_rate: number;
  final_total: number;
  status: RawOrderStatus;
  payment_page_viewed_at: string | null;
  transfer_submitted_at: string | null;
  whatsapp_clicked_at: string | null;
  payment_confirmed_at: string | null;
  payment_stage?: OrderPaymentStage;
  whatsapp_clicked?: boolean;
  items?: AdminOrderItem[];
};

type AdminOrderFilter = "" | "unpaid" | "payment_submitted" | "payment_confirmed" | "whatsapp_not_clicked" | "cancelled";

const filterOptions: Array<{ value: AdminOrderFilter; label: string }> = [
  { value: "", label: "全部" },
  { value: "unpaid", label: "待付款" },
  { value: "payment_submitted", label: "已提交转账" },
  { value: "payment_confirmed", label: "已确认到账" },
  { value: "whatsapp_not_clicked", label: "WhatsApp 未点击" },
  { value: "cancelled", label: "已取消" },
];

function formatOrderDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function paymentStage(order: AdminOrder) {
  return order.payment_stage || getOrderPaymentStage(order);
}

const adminPaymentStageLabels: Record<OrderPaymentStage, string> = {
  created: "待付款",
  awaiting_payment: "待付款",
  payment_submitted: "已提交转账",
  payment_confirmed: "已确认到账",
  cancelled: "已取消",
};

export function adminPaymentStageLabel(stage: OrderPaymentStage) {
  return adminPaymentStageLabels[stage];
}

export function adminHasSubmittedPayment(stage: OrderPaymentStage) {
  return stage === "payment_submitted";
}

export function adminWhatsappClicked(order: Pick<AdminOrder, "whatsapp_clicked_at" | "whatsapp_clicked">) {
  return Boolean(order.whatsapp_clicked_at || order.whatsapp_clicked);
}

export async function writeAdminClipboard(value: string, clipboard?: Pick<Clipboard, "writeText">): Promise<boolean> {
  try {
    const target = clipboard ?? (typeof navigator === "undefined" ? undefined : navigator.clipboard);
    if (!target?.writeText) return false;
    await target.writeText(value);
    return true;
  } catch {
    return false;
  }
}

type CopyFeedback = { key: string; success: boolean } | null;

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <rect x="7" y="6" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 4.5V4a1.5 1.5 0 0 0-1.5-1.5h-7A1.5 1.5 0 0 0 3 4v9a1.5 1.5 0 0 0 1.5 1.5H5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CopyValueButton({
  copyKey,
  label,
  value,
  feedback,
  onCopy,
}: {
  copyKey: string;
  label: string;
  value: string;
  feedback: CopyFeedback;
  onCopy: (copyKey: string, value: string) => void;
}) {
  const currentFeedback = feedback?.key === copyKey ? feedback : null;
  return (
    <span className="admin-order-copy-control">
      <button className="admin-order-copy-button" type="button" aria-label={`复制${label}`} title={`复制${label}`} onClick={() => onCopy(copyKey, value)}>
        <CopyIcon />
      </button>
      {currentFeedback ? <span className={`admin-order-copy-feedback${currentFeedback.success ? "" : " is-error"}`} role="status">{currentFeedback.success ? "已复制" : "复制失败，请检查浏览器权限"}</span> : null}
    </span>
  );
}

async function requestOrders(search: string, status: AdminOrderFilter) {
  const fetchOrders = async (filter: string) => {
    const params = new URLSearchParams({ q: search.trim(), status: filter, limit: "50" });
    const response = await fetch(`/api/admin/orders?${params}`, { cache: "no-store" });
    const result = await response.json().catch(() => ({})) as { orders?: AdminOrder[]; error?: string };
    return { response, result };
  };

  if (status === "unpaid") {
    const results = await Promise.all([fetchOrders("created"), fetchOrders("awaiting_payment")]);
    const failed = results.find(({ response }) => !response.ok);
    if (failed) return failed;
    const orders = new Map<string, AdminOrder>();
    for (const { result } of results) {
      for (const order of result.orders || []) orders.set(order.order_number, order);
    }
    return {
      response: results[0].response,
      result: {
        orders: [...orders.values()].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 50),
      },
    };
  }

  return fetchOrders(status);
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
  const [status, setStatus] = useState<AdminOrderFilter>("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback>(null);

  useEffect(() => {
    if (!copyFeedback) return;
    const timeout = window.setTimeout(() => setCopyFeedback(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyFeedback]);

  async function copyOrderValue(copyKey: string, value: string) {
    setCopyFeedback({ key: copyKey, success: await writeAdminClipboard(value) });
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

  async function confirmPayment() {
    if (!selected || savingPayment || paymentStage(selected) === "cancelled") return;
    setSavingPayment(true);
    setMessage("");
    const response = await fetch(`/api/admin/orders/${encodeURIComponent(selected.order_number)}/payment-confirmed`, {
      method: "PATCH",
      headers: { Accept: "application/json" },
    });
    const result = await response.json().catch(() => ({})) as { order?: AdminOrder; error?: string };
    if (!response.ok || !result.order) {
      setMessage(result.error || "确认到账失败。");
      setSavingPayment(false);
      return;
    }
    setSelected(result.order);
    setOrders((current) => current.map((order) => order.order_number === result.order?.order_number ? { ...order, ...result.order } : order));
    setMessage("已记录实际到账。");
    setSavingPayment(false);
  }

  async function deleteOrder() {
    if (!selected || deleting) return;
    const orderNumber = selected.order_number;
    if (!window.confirm(`确定永久删除订单 ${orderNumber}？删除后无法恢复。`)) return;

    setDeleting(true);
    setMessage("");
    const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { ok?: boolean; error?: string };
    if (!response.ok || !result.ok) {
      setMessage(result.error || "订单删除失败。");
      setDeleting(false);
      return;
    }

    const remaining = orders.filter((order) => order.order_number !== orderNumber);
    setOrders(remaining);
    setSelected(null);
    if (remaining.length > 0) await loadOrderDetail(remaining[0].order_number);
    setMessage(`订单 ${orderNumber} 已删除。`);
    setDeleting(false);
  }

  async function generateOrderImage() {
    if (!selected || generatingImage) return;
    setGeneratingImage(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(selected.order_number)}/confirmation-image`, { cache: "no-store" });
      if (!response.ok) {
        setMessage("生成客户订单图片失败。");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selected.order_number}-order-confirmation.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage("客户订单图片已生成。");
    } catch {
      setMessage("生成客户订单图片失败。");
    } finally {
      setGeneratingImage(false);
    }
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    void loadOrders();
  }

  const selectedStage = selected ? paymentStage(selected) : null;
  const selectedWhatsappClicked = selected ? adminWhatsappClicked(selected) : false;
  const selectedDisplay: OrderDisplaySnapshot | null = selected ? {
    customerName: selected.customer_name,
    email: selected.email,
    phone: selected.phone,
    addressLine1: selected.address_line1,
    addressLine2: selected.address_line2,
    city: selected.city,
    county: selected.county,
    postcode: selected.postcode,
    countryName: selected.country_name,
    shippingMethodLabel: selected.shipping_method_label,
    shippingEstimate: selected.shipping_estimate,
  } : null;
  const adminContactLabels = { name: "收件人姓名", email: "邮箱", phone: "联系电话" };
  const adminAddressLabels = {
    recipient: "收件人",
    addressLine1: "地址 1",
    addressLine2: "地址 2",
    city: "城市",
    county: "郡 / 省 / 州",
    postcode: "邮编",
    country: "国家",
  };
  const adminDeliveryLabels = { shippingMethod: "配送方式", estimatedDelivery: "预计时效" };

  return (
    <section className="admin-shell admin-orders-shell">
      <div className="admin-list">
        <form className="admin-order-search" onSubmit={submitSearch}>
          <input aria-label="搜索订单" placeholder="订单号、姓名、邮箱或电话" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select aria-label="订单付款状态" value={status} onChange={(event) => { const next = event.target.value as AdminOrderFilter; setStatus(next); void loadOrders(query, next); }}>
            {filterOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          </select>
          <button className="btn btn-solid" type="submit">搜索</button>
        </form>
        {loading ? <p>正在读取订单…</p> : null}
        {!loading && orders.length === 0 ? <p>暂时没有订单。</p> : null}
        {orders.map((order) => {
          const stage = paymentStage(order);
          const clicked = adminWhatsappClicked(order);
          const warning = adminHasSubmittedPayment(stage) && !clicked;
          return (
            <button
              className={`${order.order_number === selected?.order_number ? "order-row active" : "order-row"}${warning ? " order-row-warning" : ""}`}
              type="button"
              key={order.order_number}
              aria-pressed={order.order_number === selected?.order_number}
              onClick={() => void loadOrderDetail(order.order_number)}
            >
              <span className="order-row-top"><strong>{order.order_number}</strong><small className="order-status">{adminPaymentStageLabel(stage)}</small></span>
              <span className="order-row-customer">{order.customer_name}</span>
              <span className="order-row-payment-summary">付款：{adminPaymentStageLabel(stage)} · WhatsApp：{clicked ? "已点击" : "未点击"}</span>
              <span className="order-row-bottom"><small>{formatOrderDate(order.created_at)} · {order.currency}</small><strong>{formatMoney(order.total, order.currency)}</strong></span>
            </button>
          );
        })}
      </div>
      <div className="admin-detail">
        {message ? <p className="admin-status">{message}</p> : null}
        {detailLoading ? <p className="admin-detail-loading">正在读取订单详情…</p> : null}
        {selected && !detailLoading ? (
          <>
            <header className="admin-order-detail-head">
              <div>
                <h2>订单详情：{selected.order_number}</h2>
                <p>下单时间：{formatOrderDate(selected.created_at)}</p>
              </div>
              <div className="admin-order-head-actions">
                {selectedStage !== "payment_confirmed" && selectedStage !== "cancelled" ? (
                  <button className="admin-order-confirm-button" type="button" disabled={savingPayment || deleting} onClick={() => void confirmPayment()}>
                    {savingPayment ? "正在保存…" : "确认订单"}
                  </button>
                ) : null}
                <button className="admin-order-generate-button" type="button" disabled={generatingImage || deleting || savingPayment} onClick={() => void generateOrderImage()}>
                  {generatingImage ? "正在生成…" : "生成订单"}
                </button>
                <button className="admin-order-delete-button" type="button" disabled={deleting || savingPayment || generatingImage} onClick={() => void deleteOrder()}>
                  {deleting ? "正在删除…" : "删除订单"}
                </button>
              </div>
            </header>

            <section className="admin-order-detail-section">
              <h3>客户资料</h3>
              <dl className="admin-order-info-list">
                {selectedDisplay ? getOrderContactFields(selectedDisplay).map((row) => (
                  <div key={row.key}><dt>{adminContactLabels[row.key]}</dt><dd className="admin-order-copy-value"><span className="admin-order-copy-text">{row.value}</span><CopyValueButton copyKey={`contact-${row.key}`} label={adminContactLabels[row.key]} value={row.value} feedback={copyFeedback} onCopy={copyOrderValue} /></dd></div>
                )) : null}
              </dl>
            </section>

            <section className="admin-order-detail-section">
              <div className="admin-order-detail-section-heading">
                <h3>收货地址</h3>
                {selectedDisplay ? (
                  <span className="admin-order-copy-control">
                    <button className="admin-order-copy-address-button" type="button" aria-label="复制全部资料" onClick={() => void copyOrderValue("full-customer-details", formatOrderCustomerDetailsForCopy(selectedDisplay))}>
                      <CopyIcon />
                      <span>复制全部资料</span>
                    </button>
                    {copyFeedback?.key === "full-customer-details" ? <span className={`admin-order-copy-feedback${copyFeedback.success ? "" : " is-error"}`} role="status">{copyFeedback.success ? "已复制" : "复制失败，请检查浏览器剪贴板权限"}</span> : null}
                  </span>
                ) : null}
              </div>
              <dl className="admin-order-info-list">
                {selectedDisplay ? getOrderAddressFields(selectedDisplay).map((row) => (
                  <div key={row.key}><dt>{adminAddressLabels[row.key]}</dt><dd className="admin-order-copy-value"><span className="admin-order-copy-text">{row.value}</span><CopyValueButton copyKey={`address-${row.key}`} label={adminAddressLabels[row.key]} value={row.value} feedback={copyFeedback} onCopy={copyOrderValue} /></dd></div>
                )) : null}
              </dl>
            </section>

            <section className="admin-order-detail-section">
              <h3>配送信息</h3>
              <dl className="admin-order-info-list">
                {selectedDisplay ? getOrderDeliveryFields(selectedDisplay).map((row) => (
                  <div key={row.key}><dt>{adminDeliveryLabels[row.key]}</dt><dd>{row.value}</dd></div>
                )) : null}
                <div><dt>配送费用</dt><dd>{formatMoney(selected.shipping_fee, selected.currency)}</dd></div>
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
                      <div className="admin-order-item-options"><span>尺码：{item.size}</span><span>数量：{item.quantity}</span><span>单价：{formatMoney(item.unit_price, selected.currency)}</span>{item.color ? <span>颜色：{item.color}</span> : null}</div>
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

            <section className="admin-order-detail-section">
              <h3>付款与联系</h3>
              <dl className="admin-order-payment-list">
                <div><dt>付款</dt><dd>{selectedStage ? adminPaymentStageLabel(selectedStage) : "—"}</dd></div>
                <div><dt>WhatsApp</dt><dd>{selectedWhatsappClicked ? "已点击" : "未点击"}</dd></div>
                <div><dt>付款方式</dt><dd>{selected.payment_method || "待确认"}</dd></div>
                <div><dt>币种</dt><dd>{selected.currency}</dd></div>
              </dl>
              {selectedStage && adminHasSubmittedPayment(selectedStage) && !selectedWhatsappClicked ? <p className="admin-order-warning">已提交转账，但客户尚未点击 WhatsApp。</p> : null}
            </section>

            <section className="admin-order-detail-section">
              <h3>关键时间</h3>
              <dl className="admin-order-event-list">
                <div><dt>Order created</dt><dd>{formatOrderDate(selected.created_at)}</dd></div>
                <div><dt>Payment page viewed</dt><dd>{formatOrderDate(selected.payment_page_viewed_at)}</dd></div>
                <div><dt>Transfer submitted</dt><dd>{formatOrderDate(selected.transfer_submitted_at)}</dd></div>
                <div><dt>WhatsApp clicked</dt><dd>{formatOrderDate(selected.whatsapp_clicked_at)}</dd></div>
                <div><dt>Payment confirmed</dt><dd>{formatOrderDate(selected.payment_confirmed_at)}</dd></div>
              </dl>
            </section>
          </>
        ) : !detailLoading ? <p>点击左侧订单查看详情。</p> : null}
      </div>
    </section>
  );
}
