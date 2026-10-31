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
const displayFieldsSource = fs.readFileSync(path.join(root, "lib", "orderDisplayFields.ts"), "utf8");
const displayFieldsCompiled = ts.transpile(displayFieldsSource, { module: ts.ModuleKind.CommonJS });
const displayFieldsModule = { exports: {} };
vm.runInNewContext(displayFieldsCompiled, { module: displayFieldsModule, exports: displayFieldsModule.exports });
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
    if (id === "@/lib/orderDisplayFields") return displayFieldsModule.exports;
    throw new Error(`Unexpected module import: ${id}`);
  },
});

const { adminPaymentStageLabel, adminHasSubmittedPayment, adminWhatsappClicked, writeAdminClipboard } = loadedModule.exports;

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
  assert.match(source, /<h3>客户资料<\/h3>[\s\S]*?getOrderContactFields\(selectedDisplay\)/);
  assert.match(source, /<h3>收货地址<\/h3>[\s\S]*?getOrderAddressFields\(selectedDisplay\)/);
  assert.match(source, /getOrderDeliveryFields\(selectedDisplay\)/);
  assert.match(source, /name: "收件人姓名", email: "邮箱", phone: "联系电话"/);
  assert.match(source, /addressLine1: "地址 1"[\s\S]*addressLine2: "地址 2"[\s\S]*city: "城市"[\s\S]*county: "郡 \/ 省 \/ 州"[\s\S]*postcode: "邮编"[\s\S]*country: "国家"/);
  assert.match(source, /aria-label=\{`复制\$\{label\}`\}/);
  assert.match(source, /writeAdminClipboard\(value\)/);
  assert.match(source, /复制失败，请检查浏览器权限/);
  assert.match(source, /复制全部资料/);
  assert.match(source, /formatOrderCustomerDetailsForCopy\(selectedDisplay\)/);
  assert.doesNotMatch(source, /\[selected\.address_line1, selected\.address_line2, selected\.city, selected\.county, selected\.postcode, selected\.country_name\]\.filter\(Boolean\)\.join/);
});

test("Admin copies only the supplied original value and reports clipboard failures", async () => {
  let copied = "";
  const success = await writeAdminClipboard("  ZZ9 9ZZ  ", { writeText: async (value) => { copied = value; } });
  assert.equal(success, true);
  assert.equal(copied, "  ZZ9 9ZZ  ");
  assert.equal(await writeAdminClipboard("ignored", { writeText: async () => { throw new Error("blocked"); } }), false);
  assert.equal(await writeAdminClipboard("ignored", {}), false);
});
