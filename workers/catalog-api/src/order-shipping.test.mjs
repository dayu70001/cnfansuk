import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadWorker } from "./test-support/loadWorker.mjs";

const workerModule = loadWorker();
const worker = workerModule.default ?? workerModule;

function makeProduct(code, { gbp = 20, eur = null, usd = null, status = "active", sizes = ["M", "L", "XL", "XXL"] } = {}) {
  return {
    id: 1,
    product_code: code,
    slug: `product-${code.toLowerCase()}`,
    title: "Test Product",
    subtitle: null,
    description: null,
    category: "tops",
    subcategory: "shirts",
    brand: null,
    price_gbp: gbp,
    price_eur: eur,
    price_usd: usd,
    compare_at_price_gbp: null,
    currency: "GBP",
    status,
    sort_order: 0,
    source_url: null,
    created_at: "2026-10-28T00:00:00.000Z",
    updated_at: "2026-10-28T00:00:00.000Z",
    sizes,
  };
}

function createTestEnv(products, { synchronizeSessionLookups = false } = {}) {
  const queries = [];
  const orders = new Map();
  const orderItems = new Map();
  let orderInsertCount = 0;
  let writeCount = 0;
  let uniqueSessionConflictCount = 0;
  let sessionLookupCount = 0;
  let releaseSessionLookups;
  const sessionLookupBarrier = new Promise((resolve) => { releaseSessionLookups = resolve; });
  const DB = {
    prepare(sql) {
      return {
        bind(...values) {
          const statement = { sql, values };
          return {
            ...statement,
            async all() {
              queries.push({ sql, values });
              if (/FROM\s+products\b/i.test(sql)) {
                const codes = new Set(values.map(String));
                return { results: products.filter((product) => codes.has(product.product_code) && product.status === "active"), meta: { rows_read: codes.size, rows_written: 0 } };
              }
              if (/FROM\s+product_options\b/i.test(sql)) {
                const codes = new Set(values.map(String));
                return {
                  results: products.flatMap((product) => codes.has(product.product_code)
                    ? (product.sizes || []).map((size, index) => ({
                        id: index + 1,
                        product_code: product.product_code,
                        option_name: "Size",
                        option_value: size,
                        position: index + 1,
                      }))
                    : []),
                  meta: { rows_read: codes.size, rows_written: 0 },
                };
              }
              if (/FROM\s+product_images\b/i.test(sql)) return { results: [], meta: { rows_read: 0, rows_written: 0 } };
              if (/FROM\s+orders\s+WHERE\s+checkout_session_id/i.test(sql)) {
                const result = { results: orders.has(String(values[0])) ? [{ ...orders.get(String(values[0])) }] : [], meta: { rows_read: 1, rows_written: 0 } };
                if (synchronizeSessionLookups && sessionLookupCount < 2) {
                  sessionLookupCount += 1;
                  if (sessionLookupCount === 2) releaseSessionLookups();
                  await sessionLookupBarrier;
                }
                return result;
              }
              if (/FROM\s+order_items\s+WHERE\s+order_id/i.test(sql)) {
                return { results: (orderItems.get(String(values[0])) || []).map((row) => ({ ...row })), meta: { rows_read: 1, rows_written: 0 } };
              }
              throw new Error(`Unexpected read query in test: ${sql}`);
            },
            async run() {
              writeCount += 1;
              return { success: true, meta: { rows_written: 1 } };
            },
          };
        },
      };
    },
    async batch(statements) {
      const insert = statements.find((statement) => /^\s*INSERT INTO orders\b/i.test(statement.sql));
      if (insert) {
        const sessionId = insert.values[2];
        if (sessionId != null && orders.has(String(sessionId))) {
          uniqueSessionConflictCount += 1;
          throw new Error("UNIQUE constraint failed: orders.checkout_session_id");
        }
      }
      // D1 batches are atomic: a uniqueness failure cannot persist partial item rows.
      writeCount += statements.length;
      if (insert) {
        orderInsertCount += 1;
        const values = insert.values;
        const order = {
          id: values[0],
          order_number: values[1],
          checkout_session_id: values[2],
          customer_name: values[3],
          email: values[4],
          phone: values[5],
          preferred_contact: values[6],
          whatsapp: values[7],
          telegram: values[8],
          country_code: values[9],
          country_name: values[10],
          address_line1: values[11],
          address_line2: values[12],
          city: values[13],
          county: values[14],
          postcode: values[15],
          shipping_method_id: values[16],
          shipping_method_label: values[17],
          shipping_estimate: values[18],
          shipping_fee: values[19],
          subtotal: values[20],
          total: values[21],
          currency: values[22],
          payment_method: values[23],
          payment_fee: values[24],
          payment_fee_rate: values[25],
          final_total: values[26],
          status: values[27],
          payment_page_viewed_at: null,
          transfer_submitted_at: null,
          payment_confirmed_at: null,
        };
        orders.set(String(order.checkout_session_id), order);
      }
      const itemInserts = statements.filter((statement) => /^\s*INSERT INTO order_items\b/i.test(statement.sql));
      for (const statement of itemInserts) {
        const values = statement.values;
        const rows = orderItems.get(String(values[0])) || [];
        rows.push({
          id: rows.length + 1,
          order_id: values[0],
          product_code: values[1],
          title: values[2],
          slug: values[3],
          product_url: values[4],
          image_url: values[5],
          size: values[6],
          color: values[7],
          quantity: values[8],
          unit_price: values[9],
          line_total: values[10],
          currency: values[11],
        });
        orderItems.set(String(values[0]), rows);
      }
      const update = statements.find((statement) => /^\s*UPDATE orders\b/i.test(statement.sql));
      if (update) {
        const existing = Array.from(orders.values()).find((order) => order.id === update.values.at(-1));
        if (existing) {
          existing.shipping_fee = update.values[16];
          existing.subtotal = update.values[17];
          existing.total = update.values[18];
          existing.currency = update.values[19];
          existing.payment_method = update.values[20];
          existing.payment_fee = update.values[21];
          existing.payment_fee_rate = update.values[22];
          existing.final_total = update.values[23];
        }
      }
      return statements.map(() => ({ success: true }));
    },
  };
  return {
    env: { DB, ADMIN_TOKEN: "test-admin-token" },
    queries,
    orders,
    orderItems,
    get orderInsertCount() { return orderInsertCount; },
    get writeCount() { return writeCount; },
    get uniqueSessionConflictCount() { return uniqueSessionConflictCount; },
  };
}

async function post(path, env, body) {
  return worker.fetch(new Request(`https://worker.test${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }), env, {});
}

async function quoteFor(testEnv, items, shippingMethodId = "royal-mail-tracked", eligibilityCurrency = "GBP") {
  const response = await post("/orders/quote", testEnv.env, { items, shippingMethodId, eligibilityCurrency });
  assert.equal(response.status, 200);
  return (await response.json()).quote;
}

test("the applied checkout-session migration defines the database uniqueness guard", () => {
  const migration = readFileSync(new URL("../migrations/0013_checkout_payment_states.sql", import.meta.url), "utf8");
  assert.match(migration, /CREATE\s+UNIQUE\s+INDEX[\s\S]*?ON\s+orders\s*\(\s*checkout_session_id\s*\)\s+WHERE\s+checkout_session_id\s+IS\s+NOT\s+NULL/i);
});

test("order creation rejects missing, blank, malformed, non-string and overlong checkout session IDs", async () => {
  const testEnv = createTestEnv([]);
  const invalidIds = [undefined, null, "", "   ", "short", "bad session id", "x".repeat(161), 42];
  for (const checkoutSessionId of invalidIds) {
    const body = { customer: {}, items: [] };
    if (checkoutSessionId !== undefined) body.checkoutSessionId = checkoutSessionId;
    const response = await post("/orders", testEnv.env, body);
    const result = await response.json();
    assert.equal(response.status, 400);
    assert.equal(result.code, "CHECKOUT_SESSION_ID_INVALID");
    assert.match(result.error, /refresh checkout/i);
  }
  assert.equal(testEnv.orderInsertCount, 0);
  assert.equal(testEnv.writeCount, 0);
  assert.equal(testEnv.queries.length, 0, "invalid session IDs are rejected before database access");
});

test("current UUID and generated fallback checkout session ID formats remain accepted", async () => {
  const product = makeProduct("SESSION-FORMAT", { gbp: 37 });
  for (const checkoutSessionId of [
    "123e4567-e89b-12d3-a456-426614174000",
    "checkout-129381-275501-4238",
  ]) {
    const testEnv = createTestEnv([product]);
    const items = [{ productCode: product.product_code, size: "M", quantity: 1 }];
    const expectedQuote = await quoteFor(testEnv, items);
    const response = await post("/orders", testEnv.env, {
      checkoutSessionId,
      customer: {
        fullName: "Test Customer", email: "test@example.invalid", phone: "0000000000",
        addressLine1: "1 Test Street", city: "London", postcode: "AA1 1AA", countryCode: "GB", countryName: "United Kingdom",
      },
      items,
      shippingMethodId: "royal-mail-tracked",
      eligibilityCurrency: "GBP",
      expectedQuote,
    });
    assert.equal(response.status, 201);
  }
});

for (const currency of ["GBP", "EUR", "USD"]) {
  for (const amount of [179.99, 180, 180.01]) {
    test(`${currency} free-shipping boundary is exact at ${amount}`, async () => {
      const product = makeProduct("BOUNDARY", {
        gbp: currency === "GBP" ? amount : 20,
        eur: currency === "EUR" ? amount : null,
        usd: currency === "USD" ? amount : null,
      });
      const testEnv = createTestEnv([product]);
      const response = await post("/orders/quote", testEnv.env, {
        items: [{ productCode: product.product_code, size: "M", quantity: 1 }],
        shippingMethodId: "royal-mail-tracked",
        eligibilityCurrency: currency,
      });
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.quote.shippingFee, amount >= 180 ? 0 : 5);
      assert.equal(body.quote.currency, "GBP");
      assert.equal(testEnv.writeCount, 0, "quoting is strictly read-only");
      assert.ok(testEnv.queries.some(({ sql }) => /FROM\s+products\b/i.test(sql)));
    });
  }
}

test("GBP standard shipping keeps charging below the new 180 threshold, including the legacy 150 threshold", async () => {
  for (const amount of [150, 160, 179, 180]) {
    const product = makeProduct(`GBP-EDGE-${amount}`, { gbp: amount });
    const testEnv = createTestEnv([product]);
    const items = [{ productCode: product.product_code, size: "M", quantity: 1 }];
    for (const shippingMethodId of ["royal-mail-tracked", "dhl-express"]) {
      const quote = await quoteFor(testEnv, items, shippingMethodId, "GBP");
      assert.equal(quote.shippingFee, amount >= 180 ? 0 : 5, `${shippingMethodId} at £${amount}`);
    }
    const fedexQuote = await quoteFor(testEnv, items, "fedex-priority", "GBP");
    assert.equal(fedexQuote.shippingFee, 15, `FedEx at £${amount}`);
    assert.equal(testEnv.writeCount, 0);
  }
});

test("DHL is free at the selected-currency threshold while FedEx keeps its GBP 15 charge", async () => {
  const product = makeProduct("EXPRESS", { gbp: 150, eur: 180, usd: 210 });
  const testEnv = createTestEnv([product]);
  const body = {
    items: [{ productCode: product.product_code, size: "M", quantity: 1 }],
    eligibilityCurrency: "EUR",
  };
  const dhl = await post("/orders/quote", testEnv.env, { ...body, shippingMethodId: "dhl-express" });
  const fedex = await post("/orders/quote", testEnv.env, { ...body, shippingMethodId: "fedex-priority" });
  assert.equal((await dhl.json()).quote.shippingFee, 0);
  assert.equal((await fedex.json()).quote.shippingFee, 15);
  assert.equal(testEnv.writeCount, 0);
});

test("quote rejects missing and inactive products without writes", async () => {
  for (const products of [
    [],
    [makeProduct("INACTIVE", { status: "draft" })],
  ]) {
    const testEnv = createTestEnv(products);
    const productCode = products[0]?.product_code || "MISSING";
    const response = await post("/orders/quote", testEnv.env, {
      items: [{ productCode, size: "M", quantity: 1 }],
      shippingMethodId: "royal-mail-tracked",
      eligibilityCurrency: "GBP",
    });
    assert.equal(response.status, 400);
    assert.equal(testEnv.writeCount, 0);
  }
});

test("quote rejects a size not present in the product's actual size options", async () => {
  const product = makeProduct("SIZE-CHECK", { gbp: 37, sizes: ["M", "L", "XL", "XXL"] });
  const testEnv = createTestEnv([product]);
  const response = await post("/orders/quote", testEnv.env, {
    items: [{ productCode: product.product_code, size: "XS", quantity: 1 }],
    shippingMethodId: "royal-mail-tracked",
    eligibilityCurrency: "GBP",
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.code, "SIZE_UNAVAILABLE");
  assert.match(body.error, /selected sizes are no longer available/i);
  assert.equal(testEnv.writeCount, 0);
});

test("order creation rejects a size not present in the product's actual size options before writes", async () => {
  const product = makeProduct("ORDER-SIZE-CHECK", { gbp: 37, sizes: ["M", "L", "XL", "XXL"] });
  const testEnv = createTestEnv([product]);
  const response = await post("/orders", testEnv.env, {
    checkoutSessionId: "invalid-size-session",
    customer: {
      fullName: "Test Customer", email: "test@example.invalid", phone: "0000000000",
      addressLine1: "1 Test Street", city: "London", postcode: "AA1 1AA", countryCode: "GB", countryName: "United Kingdom",
    },
    items: [{ productCode: product.product_code, size: "XS", quantity: 1 }],
    shippingMethodId: "royal-mail-tracked",
    eligibilityCurrency: "GBP",
    expectedQuote: {},
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.code, "SIZE_UNAVAILABLE");
  assert.equal(testEnv.orderInsertCount, 0);
  assert.equal(testEnv.writeCount, 0);
});

test("quote ignores a client-supplied price and uses the active catalog price", async () => {
  const product = makeProduct("SERVER-PRICE", { gbp: 37 });
  const testEnv = createTestEnv([product]);
  const response = await post("/orders/quote", testEnv.env, {
    items: [{ productCode: product.product_code, size: "M", quantity: 1, price: 0.01 }],
    shippingMethodId: "royal-mail-tracked",
    eligibilityCurrency: "GBP",
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.quote.subtotal, 37);
  assert.equal(body.quote.lineItems[0].unitPrice, 37);
  assert.equal(testEnv.writeCount, 0);
});

test("order creation keeps GBP settlement and independently applies the selected display currency threshold", async () => {
  const product = makeProduct("GBP-ORDER", { gbp: 141.25, eur: 180, usd: 165 });
  const testEnv = createTestEnv([product]);
  const quoteResponse = await post("/orders/quote", testEnv.env, {
    items: [{ productCode: product.product_code, size: "M", quantity: 1 }],
    shippingMethodId: "royal-mail-tracked",
    eligibilityCurrency: "EUR",
  });
  const { quote } = await quoteResponse.json();
  assert.equal(quote.subtotal, 141.25);
  assert.equal(quote.shippingFee, 0);
  const orderResponse = await post("/orders", testEnv.env, {
    checkoutSessionId: "session-unique-1",
    customer: {
      fullName: "Test Customer",
      email: "test@example.invalid",
      phone: "0000000000",
      addressLine1: "1 Test Street",
      city: "London",
      postcode: "AA1 1AA",
      countryCode: "GB",
      countryName: "United Kingdom",
    },
    items: [{ productCode: product.product_code, size: "M", quantity: 1, price: 9999, currency: "USD" }],
    shippingMethodId: "royal-mail-tracked",
    eligibilityCurrency: "EUR",
    currency: "USD",
    expectedQuote: quote,
  });
  const result = await orderResponse.json();
  assert.equal(orderResponse.status, 201);
  assert.equal(result.order.subtotal, 141.25, "client-supplied unit price is ignored");
  assert.equal(result.order.shippingFee, 0);
  assert.equal(result.order.currency, "GBP");
  assert.equal(testEnv.orderInsertCount, 1);
});

test("stale displayed quote is rejected before any order write and returns the updated quote", async () => {
  const product = makeProduct("STALE", { gbp: 179.99 });
  const testEnv = createTestEnv([product]);
  const items = [{ productCode: product.product_code, size: "M", quantity: 1 }];
  const oldQuote = await quoteFor(testEnv, items);
  assert.equal(oldQuote.subtotal, 179.99);
  assert.equal(oldQuote.shippingFee, 5);
  product.price_gbp = 180;
  const orderBody = {
    checkoutSessionId: "stale-session",
    customer: {
      fullName: "Test Customer", email: "test@example.invalid", phone: "0000000000",
      addressLine1: "1 Test Street", city: "London", postcode: "AA1 1AA", countryCode: "GB", countryName: "United Kingdom",
    },
    items,
    shippingMethodId: "royal-mail-tracked",
    eligibilityCurrency: "GBP",
    expectedQuote: oldQuote,
  };
  const response = await post("/orders", testEnv.env, orderBody);
  const body = await response.json();
  assert.equal(response.status, 409);
  assert.equal(body.code, "QUOTE_CHANGED");
  assert.equal(body.quote.subtotal, 180);
  assert.equal(body.quote.shippingFee, 0);
  assert.equal(body.quote.finalTotal, 180);
  const repeatedStaleRequest = await post("/orders", testEnv.env, orderBody);
  assert.equal(repeatedStaleRequest.status, 409, "retrying the same stale quote cannot create an order");
  assert.equal(testEnv.orderInsertCount, 0);
  assert.equal(testEnv.writeCount, 0);
});

test("new order creation requires a server quote snapshot", async () => {
  const product = makeProduct("QUOTE-REQUIRED", { gbp: 37 });
  const testEnv = createTestEnv([product]);
  const response = await post("/orders", testEnv.env, {
    checkoutSessionId: "quote-required-session",
    customer: {
      fullName: "Test Customer", email: "test@example.invalid", phone: "0000000000",
      addressLine1: "1 Test Street", city: "London", postcode: "AA1 1AA", countryCode: "GB", countryName: "United Kingdom",
    },
    items: [{ productCode: product.product_code, size: "M", quantity: 1 }],
    shippingMethodId: "royal-mail-tracked",
    eligibilityCurrency: "GBP",
  });
  const body = await response.json();
  assert.equal(response.status, 409);
  assert.equal(body.code, "QUOTE_REQUIRED");
  assert.match(body.error, /out of date.*refresh checkout/i);
  assert.equal(testEnv.orderInsertCount, 0);
  assert.equal(testEnv.writeCount, 0);
});

test("legacy checkout order protocol is rejected with a refresh instruction, without the old shipping fallback", async () => {
  const product = makeProduct("LEGACY-PROTOCOL", { gbp: 160 });
  const testEnv = createTestEnv([product]);
  const response = await post("/orders", testEnv.env, {
    checkoutSessionId: "checkout-123456789-1-2",
    customer: {
      fullName: "Test Customer", email: "test@example.invalid", phone: "0000000000",
      addressLine1: "1 Test Street", city: "London", postcode: "AA1 1AA", countryCode: "GB", countryName: "United Kingdom",
    },
    items: [{ productCode: product.product_code, size: "M", quantity: 1, price: 160, currency: "GBP" }],
    shippingMethodId: "royal-mail-tracked",
    currency: "GBP",
    // The old frontend has neither eligibilityCurrency nor expectedQuote.
  });
  const body = await response.json();
  assert.equal(response.status, 409);
  assert.equal(body.code, "QUOTE_REQUIRED");
  assert.match(body.error, /refresh checkout/i);
  assert.equal(testEnv.orderInsertCount, 0);
  assert.equal(testEnv.writeCount, 0);
  assert.equal(testEnv.queries.length, 0, "legacy requests are rejected before database access");
});

test("tampering with an expected quote amount is rejected before any order write", async () => {
  const product = makeProduct("QUOTE-AMOUNT-TAMPER", { gbp: 37 });
  const testEnv = createTestEnv([product]);
  const items = [{ productCode: product.product_code, size: "M", quantity: 1 }];
  const expectedQuote = await quoteFor(testEnv, items);
  const response = await post("/orders", testEnv.env, {
    checkoutSessionId: "tampered-amount-session",
    customer: {
      fullName: "Test Customer", email: "test@example.invalid", phone: "0000000000",
      addressLine1: "1 Test Street", city: "London", postcode: "AA1 1AA", countryCode: "GB", countryName: "United Kingdom",
    },
    items,
    shippingMethodId: "royal-mail-tracked",
    eligibilityCurrency: "GBP",
    expectedQuote: { ...expectedQuote, finalTotal: expectedQuote.finalTotal - 1 },
  });
  const body = await response.json();
  assert.equal(response.status, 409);
  assert.equal(body.code, "QUOTE_CHANGED");
  assert.equal(body.quote.finalTotal, 42);
  assert.equal(testEnv.orderInsertCount, 0);
  assert.equal(testEnv.writeCount, 0);
});

test("quote snapshot compares currency and exact item lines even when totals match", async () => {
  const product = makeProduct("QUOTE-CURRENCY", { gbp: 37 });
  const testEnv = createTestEnv([product]);
  const items = [{ productCode: product.product_code, size: "M", quantity: 1 }];
  const quote = await quoteFor(testEnv, items);
  const customer = {
    fullName: "Test Customer", email: "test@example.invalid", phone: "0000000000",
    addressLine1: "1 Test Street", city: "London", postcode: "AA1 1AA", countryCode: "GB", countryName: "United Kingdom",
  };
  for (const expectedQuote of [
    { ...quote, eligibilityCurrency: "EUR" },
    { ...quote, lineItems: [{ ...quote.lineItems[0], productCode: "OTHER-PRODUCT" }] },
  ]) {
    const response = await post("/orders", testEnv.env, {
      checkoutSessionId: "quote-mismatch-session",
      customer,
      items,
      shippingMethodId: "royal-mail-tracked",
      eligibilityCurrency: "GBP",
      expectedQuote,
    });
    assert.equal(response.status, 409);
  }
  assert.equal(testEnv.orderInsertCount, 0);
  assert.equal(testEnv.writeCount, 0);
});

test("empty quote and order requests are rejected without D1 writes", async () => {
  const testEnv = createTestEnv([]);
  const quote = await post("/orders/quote", testEnv.env, { items: [], shippingMethodId: "royal-mail-tracked", eligibilityCurrency: "GBP" });
  const order = await post("/orders", testEnv.env, {
    checkoutSessionId: "empty-session",
    customer: {},
    items: [],
    shippingMethodId: "royal-mail-tracked",
    expectedQuote: {},
  });
  assert.equal(quote.status, 400);
  assert.equal(order.status, 400);
  assert.equal(testEnv.orderInsertCount, 0);
  assert.equal(testEnv.writeCount, 0);
});

test("retry with the same checkout session reuses one order number", async () => {
  const product = makeProduct("IDEMPOTENT", { gbp: 181 });
  const testEnv = createTestEnv([product]);
  const orderBody = {
    checkoutSessionId: "same-session",
    customer: {
      fullName: "Test Customer", email: "test@example.invalid", phone: "0000000000",
      addressLine1: "1 Test Street", city: "London", postcode: "AA1 1AA", countryCode: "GB", countryName: "United Kingdom",
    },
    items: [{ productCode: product.product_code, size: "L", quantity: 1 }],
    shippingMethodId: "royal-mail-tracked",
    eligibilityCurrency: "GBP",
    expectedQuote: await quoteFor(testEnv, [{ productCode: product.product_code, size: "L", quantity: 1 }]),
  };
  const first = await (await post("/orders", testEnv.env, orderBody)).json();
  const retry = await (await post("/orders", testEnv.env, orderBody)).json();
  assert.equal(first.order.orderNumber, retry.order.orderNumber);
  assert.equal(first.order.status, "pending");
  assert.equal(first.order.items[0].size, "L");
  assert.equal(first.order.items[0].lineTotal, 181);
  assert.equal(first.order.customer.name, "Test Customer");
  assert.equal(first.order.shippingMethodLabel, "Royal Mail Tracked");
  assert.equal(testEnv.orderInsertCount, 1);
});

test("concurrent same-session submissions are serialized by the database unique index and reuse one order", async () => {
  const product = makeProduct("IDEMPOTENT-RACE", { gbp: 37 });
  const testEnv = createTestEnv([product], { synchronizeSessionLookups: true });
  const items = [{ productCode: product.product_code, size: "L", quantity: 1 }];
  const orderBody = {
    checkoutSessionId: "concurrent-session-123",
    customer: {
      fullName: "Test Customer", email: "test@example.invalid", phone: "0000000000",
      addressLine1: "1 Test Street", city: "London", postcode: "AA1 1AA", countryCode: "GB", countryName: "United Kingdom",
    },
    items,
    shippingMethodId: "royal-mail-tracked",
    eligibilityCurrency: "GBP",
    expectedQuote: await quoteFor(testEnv, items),
  };
  const responses = await Promise.all([
    post("/orders", testEnv.env, orderBody),
    post("/orders", testEnv.env, orderBody),
  ]);
  const bodies = await Promise.all(responses.map((response) => response.json()));
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 201]);
  assert.equal(bodies[0].order.orderNumber, bodies[1].order.orderNumber);
  assert.equal(testEnv.orders.size, 1);
  assert.equal(testEnv.orderItems.size, 1);
  assert.equal(testEnv.orderInsertCount, 1);
  assert.equal(testEnv.uniqueSessionConflictCount, 1, "the simulated database uniqueness constraint resolves the race");
  assert.equal(testEnv.writeCount, 2, "only the winning atomic order+item batch is persisted");
});

test("same checkout session rejects changed customer, shipping or item details", async () => {
  const product = makeProduct("SESSION-CONFLICT", { gbp: 37 });
  const testEnv = createTestEnv([product]);
  const items = [{ productCode: product.product_code, size: "M", quantity: 1 }];
  const orderBody = {
    checkoutSessionId: "conflict-session",
    customer: {
      fullName: "Test Customer", email: "test@example.invalid", phone: "0000000000",
      addressLine1: "1 Test Street", city: "London", postcode: "AA1 1AA", countryCode: "GB", countryName: "United Kingdom",
    },
    items,
    shippingMethodId: "royal-mail-tracked",
    eligibilityCurrency: "GBP",
    expectedQuote: await quoteFor(testEnv, items),
  };
  const first = await post("/orders", testEnv.env, orderBody);
  assert.equal(first.status, 201);
  const writesAfterCreate = testEnv.writeCount;

  for (const changed of [
    { ...orderBody, customer: { ...orderBody.customer, phone: "0000000001" } },
    { ...orderBody, shippingMethodId: "dhl-express" },
    { ...orderBody, items: [{ ...orderBody.items[0], size: "L" }] },
  ]) {
    const response = await post("/orders", testEnv.env, changed);
    const body = await response.json();
    assert.equal(response.status, 409);
    assert.equal(body.code, "CHECKOUT_SESSION_CONFLICT");
  }
  assert.equal(testEnv.orderInsertCount, 1);
  assert.equal(testEnv.writeCount, writesAfterCreate, "conflicting retries never mutate stored orders");
});

test("retry never reprices an already-created order after current catalog prices change", async () => {
  const product = makeProduct("PRICE-CHANGE", { gbp: 179.99 });
  const testEnv = createTestEnv([product]);
  const customer = {
    fullName: "Test Customer", email: "test@example.invalid", phone: "0000000000",
    addressLine1: "1 Test Street", city: "London", postcode: "AA1 1AA", countryCode: "GB", countryName: "United Kingdom",
  };
  const items = [{ productCode: product.product_code, size: "L", quantity: 1 }];
  const originalQuote = await quoteFor(testEnv, items);
  const first = await (await post("/orders", testEnv.env, {
    checkoutSessionId: "price-change-session",
    customer,
    items,
    shippingMethodId: "royal-mail-tracked",
    eligibilityCurrency: "GBP",
    expectedQuote: originalQuote,
  })).json();
  assert.equal(first.order.shippingFee, 5);
  const writesAfterCreate = testEnv.writeCount;

  product.price_gbp = 180;
  const retry = await (await post("/orders", testEnv.env, {
    checkoutSessionId: "price-change-session",
    customer,
    items: [{ productCode: product.product_code, size: "L", quantity: 1 }],
    shippingMethodId: "royal-mail-tracked",
    eligibilityCurrency: "GBP",
    expectedQuote: originalQuote,
  })).json();

  assert.equal(retry.order.orderNumber, first.order.orderNumber);
  assert.equal(retry.order.subtotal, 179.99);
  assert.equal(retry.order.shippingFee, 5);
  assert.equal(retry.order.finalTotal, 184.99);
  assert.equal(testEnv.orderInsertCount, 1);
  assert.equal(testEnv.writeCount, writesAfterCreate, "retry returns the stored order without D1 writes");
});
