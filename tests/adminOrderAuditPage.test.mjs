import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagePath = path.join(root, "app", "admin", "order-audit", "page.tsx");
const pageSource = fs.readFileSync(pagePath, "utf8");
const targetOrder = { order_number: "CNF-260925-9135", final_total: 23, currency: "GBP" };

function comparisonSide(role, amountTotal) {
  return {
    role,
    amountTotal,
    currency: "gbp",
    livemode: true,
    mode: "payment",
    created: 1780000000,
    status: "open",
    paymentStatus: "unpaid",
    clientReference: amountTotal === 2300 ? "MATCHED_ORDER" : "PRESENT",
    paymentMethodTypes: ["customer_balance"],
    paymentMethodConfigurationDetails: "PRESENT",
    paymentMethodConfigurationResolution: "SESSION_CONFIGURATION",
    paymentMethodConfiguration: {
      present: true,
      active: true,
      isDefault: true,
      livemode: true,
      customerBalanceAvailable: true,
      customerBalancePreference: "on",
      customerBalanceValue: "on",
      customerBalanceOverridable: true,
      methods: [],
    },
    customerBalanceInSession: true,
    paymentMethodOptionKeys: ["customer_balance"],
    customerBalanceOptionPresent: true,
    customerBalanceFundingType: "bank_transfer",
    customerBalanceBankTransferType: "gb_bank_transfer",
    locale: "en-GB",
    uiMode: "hosted",
    paymentMethodCollection: "always",
    billingAddressCollection: "auto",
    customerCreation: "if_required",
    submitType: "auto",
    customerPresent: true,
    cashBalance: { readSupported: true, livemode: true, availableGbp: 0, reconciliationMode: "automatic" },
    paymentIntentPresent: false,
    paymentIntent: null,
  };
}

function successfulDiagnosis() {
  return {
    kind: "diagnosed",
    control: comparisonSide("CONTROL_METHOD_VISIBLE", 4100),
    failed: comparisonSide("FAILED_AFTER_PAY_CLICK", 2300),
    samePaymentMethodConfiguration: true,
    sessionPaymentMethodSetupDifference: false,
    customerCashBalanceDifference: false,
    differences: ["amount_total: control=4100; failed=2300"],
    failedRelevantEvents: [],
    failedEventSearchComplete: null,
    bankTransferWasCreated: false,
    bankTransferConfirmationRejected: false,
    mobileBrowserOnlyCause: "NO",
    rootCauseConfirmed: false,
    rootCauseLayer: "INSUFFICIENT_STRIPE_EVIDENCE",
    rootCause: "No specific failure detail was available.",
  };
}

function loadPage({ authenticated = true, mode = "live", host = "www.cnfans.co.uk", proto = "https", diagnosticResult = successfulDiagnosis(), stripeError } = {}) {
  const calls = { stripeClient: 0, diagnosis: 0 };
  const compiledModule = { exports: {} };
  const compiled = ts.transpile(pageSource, {
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
  });
  const element = (type, props) => ({ type, props });
  class StageError extends Error {
    constructor(stage) { super(stage); this.stage = stage; }
  }

  vm.runInNewContext(compiled, {
    module: compiledModule,
    exports: compiledModule.exports,
    process: { env: {} },
    URL,
    Number,
    Math,
    encodeURIComponent,
    require(id) {
      if (id === "react/jsx-runtime") return { jsx: element, jsxs: element };
      if (id === "next/headers") return { headers: async () => new Map([
        ["host", host], ["x-forwarded-proto", proto],
      ]) };
      if (id === "@/lib/adminAuth") return {
        requireAdmin: async () => { if (!authenticated) throw new Error("REDIRECT:/admin/login"); },
      };
      if (id === "@/lib/payments/stripeBankTransfer") return { getStripeBankTransferMode: () => mode };
      if (id === "@/lib/payments/stripeLiveDiagnostics") return {
        createLiveStripeDiagnosticsClient: () => { calls.stripeClient += 1; return {}; },
        compareExistingLiveStripeSessions: async (_stripe, actualOrder) => {
          calls.diagnosis += 1;
          assert.deepEqual(JSON.parse(JSON.stringify(actualOrder)), targetOrder);
          if (stripeError) throw new StageError(stripeError);
          return diagnosticResult;
        },
        LiveStripeDiagnosticsStageError: StageError,
      };
      throw new Error(`Unexpected page dependency: ${id}`);
    },
  });
  return { page: compiledModule.exports.default, calls };
}

function flatten(element, output = []) {
  if (element === null || element === undefined || typeof element === "boolean") return output;
  if (typeof element === "string" || typeof element === "number") {
    output.push(String(element));
    return output;
  }
  if (Array.isArray(element)) {
    for (const child of element) flatten(child, output);
    return output;
  }
  flatten(element.props?.children, output);
  return output;
}

test("order audit is a force-dynamic Server Component with Admin auth and no client-side fetch", () => {
  assert.doesNotMatch(pageSource, /^\s*["']use client["']/);
  assert.match(pageSource, /await requireAdmin\(\)/);
  assert.match(pageSource, /export const dynamic = "force-dynamic"/);
  assert.match(pageSource, /export const revalidate = 0/);
  assert.equal(pageSource.includes("CNF-260925-9135"), true);
  assert.equal(pageSource.includes("final_total: 23"), true);
  assert.equal(pageSource.includes('currency: "GBP"'), true);
  assert.doesNotMatch(pageSource, /useEffect|useState|\/api\/admin\/payment-diagnostics/);
  assert.doesNotMatch(pageSource, /getAdminWorkerToken|getCatalogApiBase|fetch\(|ORDER_READ_FAILED|TARGET_ORDER_MISMATCH/);
});

test("Admin auth runs before Stripe reads", async () => {
  const loaded = loadPage({ authenticated: false });
  await assert.rejects(loaded.page(), /REDIRECT:\/admin\/login/);
  assert.deepEqual(loaded.calls, { stripeClient: 0, diagnosis: 0 });
});

test("a missing or inaccessible old Worker order does not block the fixed Stripe comparison", async () => {
  const valid = loadPage();
  const validPage = await valid.page();
  assert.deepEqual(valid.calls, { stripeClient: 1, diagnosis: 1 });
  assert.equal(flatten(validPage).join(" ").includes("CNFANS Live Session Comparison"), true);
  assert.doesNotMatch(pageSource, /\/admin\/orders\/|ORDER_READ_FAILED|TARGET_ORDER_MISMATCH/);
});

test("Production Live gate blocks Test Mode, alternate hosts, and insecure forwarded protocol", async () => {
  for (const options of [{ mode: "test" }, { host: "preview.cnfans.co.uk" }, { proto: "http" }]) {
    const loaded = loadPage(options);
    const page = await loaded.page();
    assert.deepEqual(loaded.calls, { stripeClient: 0, diagnosis: 0 });
    assert.ok(flatten(page).join(" ").includes("PRODUCTION_LIVE_MODE_REQUIRED"));
  }
});

test("safe Stripe values render while session identifiers and customer data never enter the page", async () => {
  const loaded = loadPage();
  const page = await loaded.page();
  const rendered = flatten(page).join(" ");
  for (const expected of [
    "CONTROL_ROLE CONTROL_METHOD_VISIBLE", "CONTROL_AMOUNT_TOTAL 4100", "FAILED_ROLE FAILED_AFTER_PAY_CLICK",
    "FAILED_AMOUNT_TOTAL 2300", "SAME_PAYMENT_METHOD_CONFIGURATION true",
    "FAILED_CUSTOMER_BALANCE_FUNDING_TYPE bank_transfer", "FAILED_CUSTOMER_BALANCE_BANK_TRANSFER_TYPE gb_bank_transfer",
    "MOBILE_BROWSER_ONLY_CAUSE NO", "ROOT_CAUSE_LAYER INSUFFICIENT_STRIPE_EVIDENCE",
  ]) assert.ok(rendered.includes(expected), `missing visible audit value: ${expected}`);
  for (const forbidden of ["cs_live_", "cus_", "pi_", "pmc_", "sk_live_", "@example", "Private Name", "Private Address", "0000000000", "checkout.stripe.com"]) {
    assert.equal(rendered.toLowerCase().includes(forbidden.toLowerCase()), false, `sensitive value reached page: ${forbidden}`);
  }
});

test("a safe diagnostic stage error is exposed without its underlying details", async () => {
  const loaded = loadPage({ stripeError: "STRIPE_SESSION_LIST_FAILED" });
  const page = await loaded.page();
  const rendered = flatten(page).join(" ");
  assert.ok(rendered.includes("ERROR_CLASS:"));
  assert.ok(rendered.includes("STRIPE_SESSION_LIST_FAILED"));
  assert.equal(rendered.includes("sensitive"), false);
});
