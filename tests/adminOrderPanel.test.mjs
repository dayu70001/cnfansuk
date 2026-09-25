import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "components", "AdminOrderPanel.tsx"), "utf8");
const nodeRequire = createRequire(import.meta.url);
const compiled = ts.transpile(source, {
  module: ts.ModuleKind.CommonJS,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
});
const loadedModule = { exports: {} };

vm.runInNewContext(compiled, {
  module: loadedModule,
  exports: loadedModule.exports,
  require(id) {
    if (id === "react") return { useEffect() {}, useState() {} };
    if (id === "react/jsx-runtime") return nodeRequire("react/jsx-runtime");
    if (id === "@/lib/formatMoney") return { formatMoney: () => "£0.00" };
    if (id === "@/lib/orderStatus") return { getOrderPaymentStage: () => "created" };
    throw new Error(`Unexpected module import: ${id}`);
  },
});

const { adminPaymentStageLabel, adminHasSubmittedPayment, adminWhatsappClicked } = loadedModule.exports;

test("Admin maps payment stages to the simplified Chinese business states", () => {
  assert.equal(adminPaymentStageLabel("created"), "待付款");
  assert.equal(adminPaymentStageLabel("awaiting_payment"), "待付款");
  assert.equal(adminPaymentStageLabel("payment_submitted"), "已提交转账");
  assert.equal(adminPaymentStageLabel("payment_confirmed"), "已确认到账");
  assert.equal(adminPaymentStageLabel("cancelled"), "已取消");
  assert.equal(adminHasSubmittedPayment("created"), false);
  assert.equal(adminHasSubmittedPayment("awaiting_payment"), false);
  assert.equal(adminHasSubmittedPayment("payment_submitted"), true);
  assert.equal(adminHasSubmittedPayment("payment_confirmed"), false);
  assert.equal(adminHasSubmittedPayment("cancelled"), false);
  assert.equal(adminWhatsappClicked({ whatsapp_clicked_at: null, whatsapp_clicked: false }), false);
  assert.equal(adminWhatsappClicked({ whatsapp_clicked_at: "2026-09-26T00:00:00.000Z", whatsapp_clicked: false }), true);
  assert.match(source, /付款：\{adminPaymentStageLabel\(stage\)\} · WhatsApp：\{clicked \? "已点击" : "未点击"\}/);
  assert.match(source, /<dt>付款<\/dt><dd>\{selectedStage \? adminPaymentStageLabel\(selectedStage\) : "—"\}<\/dd>/);
  assert.match(source, /\{ value: "unpaid", label: "待付款" \}/);
  assert.match(source, /\{ value: "payment_submitted", label: "已提交转账" \}/);
  assert.doesNotMatch(source, /未进入付款页|已提交转账（历史）/);
  assert.match(source, /Promise\.all\(\[fetchOrders\("created"\), fetchOrders\("awaiting_payment"\)\]\)/);
});
