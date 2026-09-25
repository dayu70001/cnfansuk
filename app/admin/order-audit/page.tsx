import { headers } from "next/headers";
import { requireAdmin, getAdminWorkerToken } from "@/lib/adminAuth";
import { getCatalogApiBase } from "@/lib/catalogApiBase";
import {
  createLiveStripeDiagnosticsClient,
  diagnoseExistingLiveStripeSession,
  LiveStripeDiagnosticsStageError,
  type LiveStripeSessionDiagnosticResult,
} from "@/lib/payments/stripeLiveDiagnostics";
import { getStripeBankTransferMode } from "@/lib/payments/stripeBankTransfer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TARGET_ORDER_NUMBER = "CNF-260925-9135";

type AuditRow = { label: string; value: string };
type AuditOrder = { order_number?: unknown; final_total?: unknown; currency?: unknown };

function renderRows(rows: AuditRow[]) {
  return (
    <main style={{ maxWidth: 760, margin: "48px auto", padding: "24px", color: "#171714", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: 28, margin: "0 0 24px" }}>CNFANS Live Payment Audit</h1>
      <dl style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1fr) 2fr", gap: "12px 20px", margin: 0 }}>
        {rows.map(({ label, value }) => (
          <div key={label} style={{ display: "contents" }}>
            <dt style={{ fontWeight: 600 }}>{label}</dt>
            <dd style={{ margin: 0, overflowWrap: "anywhere" }}>{value}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}

function renderError(errorClass: string) {
  return (
    <main style={{ maxWidth: 760, margin: "48px auto", padding: "24px", color: "#171714", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: 28, margin: "0 0 24px" }}>CNFANS Live Payment Audit</h1>
      <p>ERROR_CLASS: {errorClass}</p>
    </main>
  );
}

function yesNo(value: boolean | null | undefined) {
  return value === true ? "YES" : value === false ? "NO" : "null";
}

function printable(value: string | number | boolean | null | undefined) {
  return value === null || value === undefined || value === "" ? "null" : String(value);
}

function resultRows(result: LiveStripeSessionDiagnosticResult): AuditRow[] {
  if (result.kind !== "diagnosed") {
    const sessionFound = result.kind === "SESSION_NOT_FOUND"
      ? "NO"
      : result.kind === "SESSION_SEARCH_LIMIT_EXCEEDED" && result.matchCount === 0
        ? "UNKNOWN"
        : "YES";
    const matchCount = result.kind === "SESSION_SEARCH_LIMIT_EXCEEDED"
      ? `>=${result.matchCount} (partial search)`
      : result.matchCount;
    return [
      { label: "ORDER_MATCH", value: "YES" },
      { label: "SESSION_FOUND", value: sessionFound },
      { label: "MATCH_COUNT", value: printable(matchCount) },
      { label: "LIVEMODE", value: "null" },
      { label: "SESSION_MODE", value: "null" },
      { label: "SESSION_STATUS", value: "null" },
      { label: "PAYMENT_STATUS", value: "null" },
      { label: "PAYMENT_INTENT_PRESENT", value: "null" },
      { label: "PAYMENT_METHOD_TYPES", value: "null" },
      { label: "CUSTOMER_BALANCE_IN_SESSION", value: "null" },
      { label: "PAYMENT_METHOD_CONFIGURATION_PRESENT", value: "null" },
      { label: "CONFIG_RESOLUTION", value: result.kind },
      { label: "CONFIG_ACTIVE", value: "null" },
      { label: "CONFIG_IS_DEFAULT", value: "null" },
      { label: "CONFIG_LIVEMODE", value: "null" },
      { label: "CUSTOMER_BALANCE_CONFIG_AVAILABLE", value: "null" },
      { label: "CUSTOMER_BALANCE_CONFIG_PREFERENCE", value: "null" },
      { label: "CUSTOMER_BALANCE_CONFIG_VALUE", value: "null" },
      { label: "CUSTOMER_BALANCE_OPTION_PRESENT", value: "null" },
      { label: "CUSTOMER_BALANCE_FUNDING_TYPE", value: "null" },
      { label: "CUSTOMER_BALANCE_BANK_TRANSFER_TYPE", value: "null" },
      { label: "PAYMENT_METHOD_OPTION_KEYS", value: "null" },
      { label: "DYNAMIC_METHODS_PRESERVED", value: "YES" },
      { label: "CASE", value: "UNKNOWN" },
      { label: "ROOT_CAUSE_LAYER", value: "UNKNOWN" },
      { label: "MISSING_STRIPE_FIELDS", value: "NONE" },
    ];
  }

  const diagnosis = result.diagnosis;
  const configuration = diagnosis.paymentMethodConfiguration;
  return [
    { label: "ORDER_MATCH", value: "YES" },
    { label: "SESSION_FOUND", value: yesNo(diagnosis.sessionFound) },
    { label: "MATCH_COUNT", value: printable(diagnosis.matchCount) },
    { label: "LIVEMODE", value: yesNo(diagnosis.livemode) },
    { label: "SESSION_MODE", value: printable(diagnosis.mode) },
    { label: "SESSION_STATUS", value: printable(diagnosis.status) },
    { label: "PAYMENT_STATUS", value: printable(diagnosis.paymentStatus) },
    { label: "PAYMENT_INTENT_PRESENT", value: diagnosis.paymentIntent },
    { label: "PAYMENT_METHOD_TYPES", value: diagnosis.paymentMethodTypes.join(", ") || "NONE" },
    { label: "CUSTOMER_BALANCE_IN_SESSION", value: yesNo(diagnosis.customerBalanceInSession) },
    { label: "PAYMENT_METHOD_CONFIGURATION_PRESENT", value: yesNo(configuration.present) },
    { label: "CONFIG_RESOLUTION", value: diagnosis.paymentMethodConfigurationResolution },
    { label: "CONFIG_ACTIVE", value: printable(configuration.active) },
    { label: "CONFIG_IS_DEFAULT", value: printable(configuration.isDefault) },
    { label: "CONFIG_LIVEMODE", value: printable(configuration.livemode) },
    { label: "CUSTOMER_BALANCE_CONFIG_AVAILABLE", value: printable(configuration.customerBalanceAvailable) },
    { label: "CUSTOMER_BALANCE_CONFIG_PREFERENCE", value: printable(configuration.customerBalancePreference) },
    { label: "CUSTOMER_BALANCE_CONFIG_VALUE", value: printable(configuration.customerBalanceValue) },
    { label: "CUSTOMER_BALANCE_OPTION_PRESENT", value: yesNo(diagnosis.customerBalanceOptionPresent) },
    { label: "CUSTOMER_BALANCE_FUNDING_TYPE", value: printable(diagnosis.customerBalanceFundingType) },
    { label: "CUSTOMER_BALANCE_BANK_TRANSFER_TYPE", value: printable(diagnosis.customerBalanceBankTransferType) },
    { label: "PAYMENT_METHOD_OPTION_KEYS", value: diagnosis.paymentMethodOptionKeys.join(", ") || "NONE" },
    { label: "DYNAMIC_METHODS_PRESERVED", value: "YES" },
    { label: "CASE", value: diagnosis.case },
    { label: "ROOT_CAUSE_LAYER", value: diagnosis.rootCauseLayer },
    { label: "MISSING_STRIPE_FIELDS", value: diagnosis.missingStripeFields.join(", ") || "NONE" },
  ];
}

export default async function OrderAuditPage() {
  await requireAdmin();

  const requestHeaders = await headers();
  const host = requestHeaders.get("host")?.toLowerCase();
  const forwardedProto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (
    getStripeBankTransferMode() !== "live"
    || host !== "www.cnfans.co.uk"
    || (forwardedProto && forwardedProto !== "https")
  ) return renderError("PRODUCTION_LIVE_MODE_REQUIRED");

  const workerToken = getAdminWorkerToken();
  if (!workerToken) return renderError("ORDER_READ_FAILED");

  let orderResponse: Response;
  try {
    orderResponse = await fetch(
      `${getCatalogApiBase()}/admin/orders/${encodeURIComponent(TARGET_ORDER_NUMBER)}`,
      {
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${workerToken}` },
        cache: "no-store",
      },
    );
  } catch {
    return renderError("ORDER_READ_FAILED");
  }
  if (!orderResponse.ok) return renderError("ORDER_READ_FAILED");

  let order: AuditOrder | null = null;
  try {
    const payload = await orderResponse.json() as { order?: AuditOrder | null };
    order = payload?.order ?? null;
  } catch {
    return renderError("ORDER_READ_FAILED");
  }

  const amount = typeof order?.final_total === "number" ? order.final_total : Number(order?.final_total);
  if (
    order?.order_number !== TARGET_ORDER_NUMBER
    || !Number.isFinite(amount)
    || Math.round(amount * 100) !== 2300
    || Math.abs(amount * 100 - 2300) > 0.00001
    || typeof order.currency !== "string"
    || order.currency.toUpperCase() !== "GBP"
  ) {
    return (
      <main style={{ maxWidth: 760, margin: "48px auto", padding: "24px", color: "#171714", fontFamily: "Arial, sans-serif" }}>
        <h1>TARGET_ORDER_MISMATCH</h1>
      </main>
    );
  }

  try {
    const stripe = createLiveStripeDiagnosticsClient();
    const result = await diagnoseExistingLiveStripeSession(stripe, {
      order_number: TARGET_ORDER_NUMBER,
      final_total: amount,
      currency: order.currency,
    });
    return renderRows(resultRows(result));
  } catch (error) {
    const errorClass = error instanceof LiveStripeDiagnosticsStageError ? error.stage : "OTHER";
    return renderError(errorClass);
  }
}
