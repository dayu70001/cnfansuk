import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProjectTypeScript, loadWorker } from "./test-support/loadWorker.mjs";

const workerModule = loadWorker();
const worker = workerModule.default ?? workerModule;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const trackModule = loadProjectTypeScript(path.join(projectRoot, "app/api/track/route.ts"), {
  "next/server": {
    NextResponse: {
      json(body, init = {}) {
        return new Response(JSON.stringify(body), { status: init.status || 200, headers: init.headers });
      },
    },
  },
});
const trackOrder = trackModule.GET;

const orderBase = {
  id: "order-id-1",
  order_number: "CNF-TEST-001",
  checkout_session_id: "session-1",
  created_at: "2026-09-23T10:00:00.000Z",
  updated_at: "2026-09-23T10:00:00.000Z",
  customer_name: "Test Customer",
  email: "customer@example.invalid",
  phone: "+440000000000",
  preferred_contact: "whatsapp",
  whatsapp: "+440000000000",
  telegram: null,
  country_code: "GB",
  country_name: "United Kingdom",
  address_line1: "1 Test Street",
  address_line2: null,
  city: "London",
  county: null,
  postcode: "AA1 1AA",
  shipping_method_id: "royal-mail-tracked",
  shipping_method_label: "Royal Mail Tracked",
  shipping_estimate: "7–12 business days",
  shipping_fee: 5,
  subtotal: 35,
  total: 40,
  currency: "GBP",
  payment_method: "bank-transfer",
  payment_fee: 0,
  payment_fee_rate: 0,
  final_total: 40,
  status: "pending",
  payment_page_viewed_at: null,
  transfer_submitted_at: null,
  whatsapp_clicked_at: null,
  payment_confirmed_at: null,
};

const item = {
  id: 1,
  order_id: orderBase.id,
  product_code: "CNF-TEST-PRODUCT",
  title: "Test Jacket",
  slug: "test-jacket",
  product_url: "/product/test-jacket",
  image_url: "https://img.example.invalid/test.png",
  size: "M",
  color: "Black",
  quantity: 1,
  unit_price: 35,
  line_total: 35,
  currency: "GBP",
};

function testEnv(order) {
  const queries = [];
  const DB = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async all() {
              queries.push({ sql, values });
              if (/FROM\s+orders\b/i.test(sql)) {
                return { results: order.order_number === values[0] ? [{ ...order }] : [], meta: { rows_read: 1 } };
              }
              if (/FROM\s+order_items\b/i.test(sql)) {
                return { results: [{ ...item }], meta: { rows_read: 1 } };
              }
              throw new Error(`Unexpected test query: ${sql}`);
            },
            async run() {
              queries.push({ sql, values });
              if (/UPDATE\s+orders\s+SET\s+whatsapp_clicked_at/i.test(sql)) {
                if (order.order_number !== values[0]) return { meta: { changes: 0, rows_written: 0, rows_read: 0 } };
                order.whatsapp_clicked_at ||= "2026-10-31T00:00:00.000Z";
                order.updated_at = order.whatsapp_clicked_at;
                return { meta: { changes: 1, rows_written: 1, rows_read: 0 } };
              }
              throw new Error(`Unexpected test mutation: ${sql}`);
            },
          };
        },
      };
    },
  };
  return { env: { DB, ADMIN_TOKEN: "test-admin-token" }, queries };
}

const stageCases = [
  { name: "created", order: { status: "pending" }, expected: "created" },
  { name: "awaiting_payment", order: { status: "awaiting_payment" }, expected: "awaiting_payment" },
  { name: "payment_submitted", order: { status: "payment_submitted" }, expected: "payment_submitted" },
  { name: "payment_confirmed", order: { status: "payment_confirmed" }, expected: "payment_confirmed" },
  { name: "cancelled", order: { status: "cancelled" }, expected: "cancelled" },
];

for (const stageCase of stageCases) {
  test(`public order response exposes only tracking fields for ${stageCase.name}`, async () => {
    const order = { ...orderBase, ...stageCase.order };
    const { env, queries } = testEnv(order);
    const response = await worker.fetch(
      new Request(`https://worker.test/orders/${order.order_number}`),
      env,
      {},
    );

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(Object.keys(body.order).sort(), ["orderNumber", "paymentStage", "status"]);
    assert.deepEqual(body.order, {
      orderNumber: order.order_number,
      status: order.status,
      paymentStage: stageCase.expected,
    });
    assert.equal(queries.length, 1);
    assert.match(queries[0].sql, /^SELECT order_number, status, payment_page_viewed_at, transfer_submitted_at, payment_confirmed_at FROM orders\b/i);
    assert.doesNotMatch(queries[0].sql, /SELECT\s+\*/i);
    assert.ok(!queries.some(({ sql }) => /FROM\s+order_items\b/i.test(sql)));
  });
}

test("admin order detail still returns full order and item data", async () => {
  const order = { ...orderBase, status: "payment_submitted", transfer_submitted_at: "2026-09-23T10:30:00.000Z" };
  const { env, queries } = testEnv(order);
  const response = await worker.fetch(
    new Request(`https://worker.test/admin/orders/${order.order_number}`, {
      headers: { Authorization: `Bearer ${env.ADMIN_TOKEN}` },
    }),
    env,
    {},
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.order.customer_name, order.customer_name);
  assert.equal(body.order.email, order.email);
  assert.equal(body.order.phone, order.phone);
  assert.equal(body.order.address_line1, order.address_line1);
  assert.equal(body.order.postcode, order.postcode);
  assert.equal(body.order.shipping_method_label, order.shipping_method_label);
  assert.equal(body.order.shipping_fee, order.shipping_fee);
  assert.equal(body.order.subtotal, order.subtotal);
  assert.equal(body.order.final_total, order.final_total);
  assert.equal(body.order.currency, order.currency);
  assert.equal(body.order.created_at, order.created_at);
  assert.equal(body.order.transfer_submitted_at, order.transfer_submitted_at);
  assert.equal(body.order.payment_stage, "payment_submitted");
  assert.deepEqual(body.order.items, [{ ...item }]);
  assert.ok(queries.some(({ sql }) => /FROM\s+order_items\b/i.test(sql)));
});

test("WhatsApp click recording is admin-protected, repeat-safe, and does not change payment state", async () => {
  const order = { ...orderBase, status: "pending", whatsapp_clicked_at: null };
  const { env, queries } = testEnv(order);

  const publicAttempt = await worker.fetch(
    new Request(`https://worker.test/orders/${order.order_number}/whatsapp-clicked`, { method: "POST" }),
    env,
    {},
  );
  assert.equal(publicAttempt.status, 404);
  assert.equal(queries.length, 0);

  const unauthorizedAttempt = await worker.fetch(
    new Request(`https://worker.test/admin/orders/${order.order_number}/whatsapp-clicked`, { method: "POST" }),
    env,
    {},
  );
  assert.equal(unauthorizedAttempt.status, 401);
  assert.equal(queries.length, 0);

  const clickRequest = () => new Request(`https://worker.test/admin/orders/${order.order_number}/whatsapp-clicked`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.ADMIN_TOKEN}` },
  });
  const firstClick = await worker.fetch(clickRequest(), env, {});
  assert.equal(firstClick.status, 200);
  const firstTimestamp = order.whatsapp_clicked_at;
  const secondClick = await worker.fetch(clickRequest(), env, {});
  assert.equal(secondClick.status, 200);
  assert.equal(order.whatsapp_clicked_at, firstTimestamp);
  assert.equal(order.status, "pending");
  assert.equal(order.payment_confirmed_at, null);

  const adminRead = await worker.fetch(
    new Request(`https://worker.test/admin/orders/${order.order_number}`, {
      headers: { Authorization: `Bearer ${env.ADMIN_TOKEN}` },
    }),
    env,
    {},
  );
  assert.equal(adminRead.status, 200);
  const body = await adminRead.json();
  assert.equal(body.order.whatsapp_clicked, true);
  assert.equal(body.order.status, "pending");
  assert.equal(body.order.payment_confirmed_at, null);
  assert.ok(queries.some(({ sql }) => /whatsapp_clicked_at\s*=\s*COALESCE/i.test(sql)));
});

test("ordinary logistics tracking still uses the existing carrier lookup", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  let requestInit;
  const html = `<div id="page-content"><table class="out_order"><tr>
    <td class="td-bk">ZX123456</td><td class="td-bk">United Kingdom</td>
    <td class="td-bk">2026-09-23 10:00</td><td class="td-bk">In transit</td>
  </tr></table><table class="out_order"><tr>
    <td class="td-bk">日期</td><td class="td-bk">转运地点</td><td class="td-bk">转运记录</td>
  </tr><tr><td class="td-bk">2026-09-23</td><td class="td-bk">London</td>
    <td class="td-bk">Parcel received</td></tr></table></div></div></div>`;

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input);
    requestInit = init;
    return new Response(html, { status: 200, headers: { "Content-Type": "text/html" } });
  };

  try {
    const response = await trackOrder({ nextUrl: new URL("http://localhost/api/track?number=ZX123456") });
    assert.equal(response.status, 200);
    assert.ok(requestedUrl.startsWith("http://zxdexpress.com/logistic.html"));
    assert.equal(requestInit?.method, "POST");
    assert.match(String(requestInit?.body), /numbers=ZX123456/);
    const result = await response.json();
    assert.equal(result.ok, true);
    assert.equal(result.trackingNumber, "ZX123456");
    assert.equal(result.events[0].content, "Parcel received");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
