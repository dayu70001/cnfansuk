import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const ts = require("typescript");
const helperSource = fs.readFileSync(path.join(root, "lib/footerNewsletter.ts"), "utf8");
const component = fs.readFileSync(path.join(root, "components/FooterNewsletter.tsx"), "utf8");
const footer = fs.readFileSync(path.join(root, "components/Footer.tsx"), "utf8");
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
const compiled = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const helperModule = { exports: {} };
runInNewContext(compiled, {
  exports: helperModule.exports,
  module: helperModule,
  URL,
  process: { env: { NODE_ENV: "production" } },
});
const { BREVO_FORM_ACTION, shouldShowFooterNewsletter, submitBrevoNewsletter } = helperModule.exports;

test("newsletter contains the approved copy, Brevo field names, unchecked consent, and accepted-submission feedback", () => {
  assert.match(component, /Get the Latest from CNFans/);
  assert.match(component, /New arrivals, real product videos and occasional updates\. No daily emails\./);
  assert.match(component, /placeholder="Email address"/);
  assert.match(component, /id="EMAIL"[\s\S]*?name="EMAIL"[\s\S]*?type="email"[\s\S]*?required/);
  assert.match(component, /<button[\s\S]*?type="submit"[\s\S]*?Subscribe/);
  assert.match(component, /I(?:'|&apos;)d like to receive occasional marketing emails from CNFans\./);
  assert.match(component, /id="OPT_IN"[\s\S]*?name="OPT_IN"[\s\S]*?type="checkbox"[\s\S]*?value="1"[\s\S]*?required/);
  assert.doesNotMatch(component, /defaultChecked|\bchecked\s*=/);
  assert.match(component, /Unsubscribe anytime\./);
  assert.match(component, /<Link href="\/privacy-policy">Privacy Policy<\/Link>/);
  assert.match(component, /Subscribed successfully!/);
  assert.doesNotMatch(component, /Please check your inbox to confirm your subscription\./);
  assert.match(component, /name="email_address_check"/);
  assert.match(component, /name="locale" value="en"/);
  assert.match(component, /data-type="subscription"/);
  assert.doesNotMatch(component, /Successfully subscribed/i);
});

test("newsletter is only rendered on suitable browsing routes, not checkout, receipts, or operational pages", () => {
  for (const route of ["/", "/product/example", "/category/tops", "/catalog", "/search"]) {
    assert.equal(shouldShowFooterNewsletter(route), true, route);
  }
  for (const route of [
    null,
    "/checkout",
    "/checkout/receipt",
    "/order-success",
    "/admin/orders",
    "/homepage-admin",
    "/login",
    "/track-order",
    "/size-recommender",
    "/payments/stripe/processing",
    "/connect",
  ]) {
    assert.equal(shouldShowFooterNewsletter(route), false, String(route));
  }
  assert.match(component, /const visible = shouldShowFooterNewsletter\(pathname\)/);
  assert.match(component, /hidden=\{!visible\}/);
});

test("Production has the same official Brevo form action and one React submission handler", () => {
  assert.equal(
    BREVO_FORM_ACTION,
    "https://d39bfc46.sibforms.com/serve/MUIFADB_BtESMMVs19bq3VwcBSRubmZ3o2_o6lxRLsAmejpp2VhfLnCMdShHlR7bM7gZlmHOwMtElzWXU53ydqJ9q6YNWaFfESrGOPsNjeihymJaFJKj70XgmNLHV5dxeAgxyD2Wd4XR9BTHjIg1SKoP7Izqx3lJxM4P6JXWCqP7HbYx-bFI8CCzXkrSeCOIl0NSZww7T_JZEhSW1w==",
  );
  assert.match(component, /action=\{BREVO_FORM_ACTION\}/);
  assert.match(component, /method="POST"/);
  assert.doesNotMatch(component, /process\.env|localhost|localPreviewRef|scriptLoadedRef/);
  assert.doesNotMatch(component, /sibforms\.com\/forms\/end-form\/build\/main\.js/);
  assert.equal((component.match(/onSubmit=\{handleSubmit\}/g) ?? []).length, 1);
  assert.match(component, /async function handleSubmit\(event: FormEvent<HTMLFormElement>\) \{\s*event\.preventDefault\(\)/);
  assert.match(component, /await submitBrevoNewsletter\(new FormData\(form\)\)/);
  assert.match(component, /if \(submissionInFlightRef\.current\) return/);
  assert.match(component, /submissionInFlightRef\.current = true/);
  assert.match(component, /submissionInFlightRef\.current = false/);
  assert.match(component, /disabled=\{isSubmitting\}/);
  assert.match(helperSource, /action\.searchParams\.set\("isAjax", "1"\)/);
  assert.match(helperSource, /method: "POST"/);
  assert.match(helperSource, /credentials: "omit"/);
  assert.match(helperSource, /response\.ok && result\?\.success === true/);
  assert.match(component, /setRemoteFeedback\(\{ kind: "success", message: "Subscribed successfully!" \}\)/);
  assert.doesNotMatch(component, /localStorage|sessionStorage|sendBeacon|XMLHttpRequest|window\.scrollTo|window\.location/);
  assert.doesNotMatch(component, /name="(?:email|consent|marketingConsent)"/);
  assert.match(component, /name="EMAIL"/);
  assert.match(component, /name="OPT_IN"/);
  assert.match(component, /Please tick the box to agree to occasional marketing emails\./);
  assert.match(component, /We couldn't subscribe just now\. Please try again\./);
  assert.match(component, /We couldn't reach the subscription service\. Please try again\./);
  assert.match(component, /role=\{remoteFeedback\.kind === "success" \? "status" : "alert"\}/);
  assert.match(component, /aria-live=\{remoteFeedback\.kind === "success" \? "polite" : "assertive"\}/);
  assert.match(component, /<svg className="icon clickable__icon progress-indicator__icon sib-hide-loader-icon"/);
  assert.match(component, /className="sib-input sib-form-block footer-newsletter-email-entry"[\s\S]*?className="form__entry entry_block"/);
  assert.match(component, /className="sib-optin sib-form-block" data-required="true"[\s\S]*?className="form__entry entry_mcq"/);
  assert.doesNotMatch(component, /id="(?:error-message|success-message)"|sib-form-message-panel|checkmark|check-mark|success-animation/i);
  assert.equal((component.match(/<svg\b/g) ?? []).length, 1, "only the Brevo submit loading SVG remains");
  assert.match(component, /id="footer-newsletter-brevo-feedback"/);
  assert.match(component, /form\.reset\(\);\s*setRemoteFeedback\(\{ kind: "success"/);
  assert.match(component, /defaultValue=""/);
  assert.doesNotMatch(component, /<input[\s\S]{0,300}value=""[\s\S]{0,180}onChange=/);
  assert.doesNotMatch(css, /footer-newsletter[^{}]*animation\s*:/i);
  assert.doesNotMatch(css, /#(?:error-message|success-message)|sib-form-message-panel/);
});

test("Production-equivalent submission makes one official Brevo AJAX request with consent and honeypot fields", async () => {
  const formData = new FormData();
  formData.set("EMAIL", "newsletter-test@example.com");
  formData.set("OPT_IN", "1");
  formData.set("email_address_check", "");
  formData.set("locale", "en");
  const requests = [];
  const fetcher = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => ({ success: true }) };
  };

  const accepted = await submitBrevoNewsletter(formData, fetcher);

  assert.equal(accepted, true);
  assert.equal(requests.length, 1, "one submission listener produces one request");
  const request = requests[0];
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.origin, new URL(BREVO_FORM_ACTION).origin);
  assert.equal(requestUrl.pathname, new URL(BREVO_FORM_ACTION).pathname);
  assert.equal(requestUrl.searchParams.get("isAjax"), "1");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.mode, "cors");
  assert.equal(request.options.credentials, "omit");
  assert.equal(request.options.headers.Accept, "application/json");
  assert.equal(request.options.body, formData);
  assert.equal(request.options.body.get("EMAIL"), "newsletter-test@example.com");
  assert.equal(request.options.body.get("OPT_IN"), "1");
  assert.equal(request.options.body.get("email_address_check"), "");
  assert.equal(request.options.body.get("locale"), "en");
});

test("only an accepted Brevo response counts as success; rejected or malformed responses fail", async () => {
  const formData = new FormData();
  const respond = (response) => submitBrevoNewsletter(formData, async () => response);

  assert.equal(await respond({ ok: true, json: async () => ({ success: true }) }), true);
  assert.equal(await respond({ ok: true, json: async () => ({ success: false }) }), false);
  assert.equal(await respond({ ok: false, json: async () => ({ success: true }) }), false);
  assert.equal(await respond({ ok: true, json: async () => { throw new Error("invalid JSON"); } }), false);
  await assert.rejects(
    submitBrevoNewsletter(formData, async () => { throw new Error("network failure"); }),
    /network failure/,
  );
});

test("newsletter sits first inside the existing footer while all current footer destinations remain", () => {
  assert.ok(footer.indexOf("<FooterNewsletter />") < footer.indexOf('<div className="foot-top">'));
  for (const route of ["/category/new-in", "/delivery", "/returns", "/size-guide", "/track-order", "/contact", "/privacy-policy", "/terms", "/payment-security"]) {
    assert.ok(footer.includes(`href="${route}"`) || footer.includes(`href: "${route}"`), route);
  }
});

test("newsletter uses the existing footer width and stacks its form on mobile without a card background", () => {
  assert.match(footer, /<footer>[\s\S]*?<div className="wrap">[\s\S]*?<FooterNewsletter \/>/);
  assert.match(css, /\.footer-newsletter\s*\{[^}]*grid-template-columns:\s*minmax\(0, 0\.9fr\) minmax\(0, 1\.1fr\)/s);
  assert.match(css, /\.footer-newsletter-fields\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 112px/s);
  assert.match(css, /@media\s*\(max-width:\s*860px\)[\s\S]*?\.footer-newsletter-fields\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.doesNotMatch(css, /\.footer-newsletter\s*\{[^}]*background\s*:/s);
  assert.doesNotMatch(css, /sib-form-message-panel|#(?:error-message|success-message)/);
});
