import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const flow = read("components/CheckoutFlow.tsx");
const cart = read("components/CartDrawer.tsx");
const product = read("components/ProductDetailClient.tsx");
const styles = read("app/globals.css");
const orderRoute = read("app/api/orders/route.ts");
const quoteRoute = read("app/api/orders/quote/route.ts");
const worker = read("workers/catalog-api/src/index.ts");
const providerSource = read("components/CartProvider.tsx");

test("Details only advances, while Delivery Confirm Order creates the order exactly once", () => {
  const detailsTransition = flow.slice(flow.indexOf("function continueToDelivery()"), flow.indexOf("async function confirmOrder()"));
  const submitOrder = flow.slice(flow.indexOf("async function confirmOrder()"), flow.indexOf("function goToCompleted("));
  assert.doesNotMatch(detailsTransition, /fetch\(|\/api\/orders/);
  assert.match(submitOrder, /fetch\("\/api\/orders"/);
  assert.match(submitOrder, /expectedQuote: activeQuote/);
  assert.match(submitOrder, /if \(!quoteReady \|\| !activeQuote\) return/);
  assert.match(submitOrder, /submitLock\.current/);
  assert.match(submitOrder, /checkoutSessionId/);
  assert.match(flow, /onConfirm=\{\(\) => void confirmOrder\(\)\}/);
  assert.match(flow, /submitting \? "Placing Order\.\.\." : "Confirm Order"/);
  assert.doesNotMatch(flow, /Continue to Review &amp; Confirm|ReviewStep|Place Order/);
});

test("cart cleanup runs only after a validated success and targets the submitted snapshot once", () => {
  const submitOrder = flow.slice(flow.indexOf("async function confirmOrder()"), flow.indexOf("function goToCompleted("));
  const snapshotIndex = submitOrder.indexOf("const submittedCartSnapshot: SubmittedCartItem[] = items.map");
  const quoteConflictIndex = submitOrder.indexOf("if (response.status === 409");
  const successValidationIndex = submitOrder.indexOf("if (!response.ok || !result.order?.orderNumber");
  const setOrderIndex = submitOrder.indexOf("setOrder({ ...result.order, eligibilityCurrency })");
  const cleanupIndex = submitOrder.indexOf("removeSubmittedItems(submittedCartSnapshot)");
  assert.ok(snapshotIndex >= 0 && snapshotIndex < quoteConflictIndex);
  assert.ok(quoteConflictIndex < successValidationIndex && successValidationIndex < setOrderIndex && setOrderIndex < cleanupIndex);
  assert.match(submitOrder, /if \(!cleanedOrderNumbers\.current\.has\(result\.order\.orderNumber\)\)/);
  assert.match(providerSource, /setItems\(\(current\) => removeSubmittedCartItems\(current, submittedItems\)\)/);
  assert.match(providerSource, /writeStorage\(CART_STORAGE_KEY, JSON\.stringify\(items\.map/);
  assert.match(flow, /const \[order, setOrder\] = useState<CheckoutOrder \| null>/);
});

test("cart snapshot changes invalidate quote state, and completed-order totals stay fixed", () => {
  assert.match(flow, /const quoteItems = useMemo\(\(\) => items\.map\(\(item\) => \(\{[\s\S]*?productCode: item\.productCode \|\| item\.productId,[\s\S]*?size: item\.size \|\| "",[\s\S]*?quantity: item\.quantity/);
  assert.match(flow, /const quoteKey = useMemo\(\(\) => JSON\.stringify\(\{\s*shippingMethodId,\s*eligibilityCurrency,\s*items: quoteItems,/);
  assert.match(flow, /\[cartRestored, currencyReady, eligibilityCurrency, hasCompleteSizes, hydrated, items, order, quoteItems, quoteKey, quoteRetry, quoteScopeKey, shippingMethodId, step\]/);
  assert.match(flow, /const summarySubtotal = order \? order\.subtotal : subtotal/);
  assert.match(flow, /const summaryShippingPrice = order \? order\.shippingFee : shippingPrice/);
  assert.match(flow, /const summaryTotal = order \? order\.finalTotal : total/);
  assert.match(flow, /if \(!quoteReady \|\| !activeQuote\) return/);
});

test("checkout scrolls once only on explicit step changes, not on restore or refresh", () => {
  assert.doesNotMatch(flow, /document\.documentElement\.scrollTop\s*=\s*0|document\.body\.scrollTop\s*=\s*0/);
  assert.doesNotMatch(flow, /useEffect\(\(\) => \{[\s\S]*?scrollCheckoutToTop\(\)[\s\S]*?\}, \[step\]\)/);
  assert.match(flow, /function scrollPageInstantly\(top: number\)\s*\{\s*window\.scrollTo\(\{ top, left: 0, behavior: "instant" \}\);\s*\}/);
  assert.match(flow, /const scrollTopAfterStepChange = useRef\(false\)/);
  assert.match(flow, /const startEntryTopHandled = useRef\(false\)/);
  assert.match(flow, /function scrollCheckoutToTop\(\)\s*\{\s*scrollTopAfterStepChange\.current = true;\s*\}/);
  assert.match(flow, /useLayoutEffect\(\(\) => \{\s*const shouldPositionFreshEntry = startNewCheckout && !startEntryTopHandled\.current;\s*if \(!shouldPositionFreshEntry && !scrollTopAfterStepChange\.current\) return;\s*if \(shouldPositionFreshEntry\) startEntryTopHandled\.current = true;\s*scrollTopAfterStepChange\.current = false;\s*scrollPageInstantly\(0\);\s*\}, \[startNewCheckout, step\]\)/);
  assert.doesNotMatch(flow, /behavior: "smooth"|requestAnimationFrame\([\s\S]*?scrollCheckoutToTop/);
  assert.match(flow, /setStep\("delivery"\);\s*scrollCheckoutToTop\(\);/);
  assert.match(flow, /setStep\("payment"\);\s*scrollCheckoutToTop\(\);/);
  assert.match(flow, /setStep\(nextStep\);\s*scrollCheckoutToTop\(\);/);
});

test("fresh cart checkout lets the destination position itself before paint without pre-scrolling the source page", () => {
  assert.match(cart, /href="\/checkout\?startNew=1"[\s\S]*?scroll=\{false\}/);
  assert.match(cart, /closeCart\(\)/);
  assert.match(providerSource, /closeCart: \(\) => setIsOpen\(false\)/);
  assert.doesNotMatch(providerSource, /scrollToTop|skipScrollRestoreOnClose/);
  assert.match(product, /router\.push\("\/checkout\?startNew=1", \{ scroll: false \}\)/);
  assert.doesNotMatch(product, /scrollPageInstantlyToTop|window\.scrollTo/);
  assert.match(flow, /const shouldPositionFreshEntry = startNewCheckout && !startEntryTopHandled\.current/);
  assert.match(flow, /router\.replace\("\/checkout", \{ scroll: false \}\)/);
  assert.doesNotMatch(flow, /startIntentHandled\.current = true;\s*scrollPageInstantly\(0\)/);
});

test("delivery selection preserves keyboard focus and does not trigger page scrolling", () => {
  const delivery = flow.slice(flow.indexOf("function DeliveryStep("), flow.indexOf("function PaymentStep("));
  const selectHandler = flow.slice(flow.indexOf("onSelect={(methodId) => {"), flow.indexOf("onBack={() => {", flow.indexOf("onSelect={(methodId) => {")));
  const focusRule = styles.slice(styles.indexOf(".ship-option:has(input:focus-visible)"), styles.indexOf(".ship-option input {"));
  assert.match(delivery, /key=\{method\.id\}/);
  assert.match(selectHandler, /setShippingMethodId\(methodId\)/);
  assert.doesNotMatch(selectHandler, /scroll|router|window/);
  assert.match(styles, /\.ship-option\.selected\s*\{\s*border-color: #33312E;\s*box-shadow: none;/);
  assert.doesNotMatch(styles, /\.ship-option:focus-within/);
  assert.match(focusRule, /outline: 2px solid var\(--ink\);/);
  assert.match(flow, /const quoteStateMatches = quoteState\?\.key === quoteKey && quoteState\.retry === quoteRetry/);
  assert.match(flow, /const activeQuote = quoteStateMatches && quoteState\.status === "ready" \? quoteState\.quote : undefined/);
  assert.match(flow, /if \(!active \|\| controller\.signal\.aborted\) return/);
  assert.match(flow, /controller\.abort\(\)/);
  assert.match(delivery, /disabled=\{submitting \|\| !quoteReady\}/);
});

test("the third progress step is Payment and order errors stay beside Confirm Order", () => {
  const delivery = flow.slice(flow.indexOf("function DeliveryStep("), flow.indexOf("function PaymentStep("));
  assert.match(flow, /id: "payment", label: "Payment"/);
  assert.match(delivery, /<div className="checkout-confirm-action">\s*\{submitError \? <p className="checkout-submit-error" role="alert">\{submitError\}<\/p> : null\}\s*<button[\s\S]*?Confirm Order/);
  assert.doesNotMatch(delivery, /<\/div>\s*\{submitError/);
  assert.match(flow, /onSelect=\{\(methodId\) => \{\s*setShippingMethodId\(methodId\);\s*setQuoteState\(null\);\s*setSubmitError\(""\);/);
  assert.match(flow, /onBack=\{\(\) => \{\s*setSubmitError\(""\);\s*setStep\("details"\);/);
  assert.match(delivery, /disabled=\{submitting \|\| !quoteReady\}/);
  assert.match(delivery, /Amounts are estimates while we verify\./);
  assert.match(delivery, /canRetryQuote \? <button[^>]*>Try again/);
  assert.match(flow, /Your order total has changed\. Please review the updated amount before confirming\./);
  assert.match(flow, /setQuoteState\(\{ key: quoteKey, retry: quoteRetry, status: "ready", quote: result\.quote \}\)/);
});

test("empty cart rendering waits for local cart restoration and preserves a saved order", () => {
  assert.match(flow, /if \(!hydrated \|\| !cartRestored \|\| !currencyReady\)/);
  assert.match(flow, /if \(items\.length === 0 && !order\)/);
  assert.match(flow, /Your cart is empty/);
  assert.match(flow, /href="\/category\/new-in"/);
  assert.match(orderRoute, /payload\.items\.length === 0/);
  assert.match(worker, /body\.items\.length < 1/);
});

test("Order Received keeps a compact unpaid receipt and WhatsApp payment guidance", () => {
  const result = flow.slice(flow.indexOf("function PaymentStep("), flow.indexOf("function CheckoutInput("));
  assert.match(result, /<h2>Order Received<\/h2>/);
  assert.match(result, /Thank you\. Your order has been received\./);
  assert.match(result, /Amount due/);
  assert.match(result, /Awaiting Payment/);
  assert.match(result, /order\.orderNumber/);
  assert.match(result, /order\.finalTotal/);
  assert.match(result, /Payment Information/);
  assert.match(result, /Our online checkout payment service is temporarily unavailable while we carry out maintenance\./);
  assert.match(result, /You can still complete your order by contacting us on WhatsApp\. We accept <strong>PayPal and bank transfer\.<\/strong>/);
  assert.match(result, /Continue on WhatsApp/);
  assert.match(result, /No payment has been taken yet\./);
  assert.match(result, /className="checkout-received-details-toggle"[\s\S]*?aria-expanded=\{detailsOpen\}[\s\S]*?\{detailsOpen \? "Hide details" : "View details"\}/);
  assert.match(result, /order\.items\.map/);
  assert.match(result, /order\.shippingMethodLabel/);
  assert.match(flow, /showHeading=\{false\}/);
  assert.match(flow, /\{showHeading \? <h2>Order Summary<\/h2> : null\}/);
  assert.match(styles, /\.checkout-step-panel\s*\{[^}]*gap:\s*12px;/);
  assert.match(styles, /\.checkout-payment-info\s*\{[^}]*padding:\s*7px 0 0;/);
  const receiptMarkup = result.slice(result.indexOf("return ("));
  const collapsedReceipt = receiptMarkup.slice(0, receiptMarkup.indexOf('className="checkout-order-details-content"'));
  assert.doesNotMatch(collapsedReceipt, /ITEMS|DELIVERY|SUBTOTAL|CONTACT &amp; DELIVERY DETAILS|Start a new order|order\.customer\.|addressLine1|order\.email/);
  assert.doesNotMatch(result, /Place Order|Payment successful|Paid|Payment completed/);
  assert.match(flow, /step === "payment" \? " checkout-order-received"/);
  assert.match(styles, /\.checkout-order-received \.checkout-summary-mobile,[\s\S]*?\.checkout-order-received \.checkout-summary-desktop\s*\{\s*display: none;/);
  assert.match(styles, /\.checkout-order-received \.checkout-layout\s*\{\s*grid-template-columns: minmax\(0, 720px\);/);
  assert.match(flow, /result\.order\.items\?\.length/);
  assert.match(flow, /setStep\("payment"\)/);
  assert.match(flow, /setOrder\(\{ \.\.\.result\.order/);
  assert.match(result, /<div className="checkout-payment-copy">\s*<section className="checkout-payment-info"[\s\S]*?<\/section>\s*<p className="checkout-payment-note">No payment has been taken yet\.<\/p>\s*<\/div>\s*<div className="checkout-actions checkout-received-actions">/);
  const receivedActions = result.slice(result.indexOf('className="checkout-actions checkout-received-actions"'));
  assert.doesNotMatch(receivedActions, /checkout-payment-note/);
  assert.doesNotMatch(collapsedReceipt, /<h4>Items Ordered|<h4>Delivery Address/);
});

test("quote route only accepts an item-bearing request and disables caching", () => {
  assert.match(quoteRoute, /payload\.items\.length === 0/);
  assert.match(quoteRoute, /\/orders\/quote/);
  assert.match(quoteRoute, /cache: "no-store"/);
  assert.match(quoteRoute, /Cache-Control.*no-store/);
});
