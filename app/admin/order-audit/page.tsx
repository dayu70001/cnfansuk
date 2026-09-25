import { headers } from "next/headers";
import { requireAdmin } from "@/lib/adminAuth";
import {
  compareExistingLiveStripeSessions,
  createLiveStripeDiagnosticsClient,
  LiveStripeDiagnosticsStageError,
  type LiveStripeComparisonSide,
  type LiveStripeSessionComparisonResult,
} from "@/lib/payments/stripeLiveDiagnostics";
import { getStripeBankTransferMode } from "@/lib/payments/stripeBankTransfer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TARGET_ORDER_NUMBER = "CNF-260925-9135";
const TARGET_ORDER = {
  order_number: TARGET_ORDER_NUMBER,
  final_total: 23,
  currency: "GBP",
} as const;

type AuditRow = { label: string; value: string };

function renderRows(rows: AuditRow[]) {
  return (
    <main style={{ maxWidth: 920, margin: "40px auto", padding: "24px", color: "#171714", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: 28, margin: "0 0 24px" }}>CNFANS Live Session Comparison</h1>
      <dl style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) 2fr", gap: "10px 20px", margin: 0 }}>
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
      <h1 style={{ fontSize: 28, margin: "0 0 24px" }}>CNFANS Live Session Comparison</h1>
      <p>ERROR_CLASS: {errorClass}</p>
    </main>
  );
}

function printable(value: string | number | boolean | null | undefined) {
  return value === null || value === undefined || value === "" ? "null" : String(value);
}

function addSideRows(rows: AuditRow[], prefix: "CONTROL" | "FAILED", side: LiveStripeComparisonSide) {
  const config = side.paymentMethodConfiguration;
  const intent = side.paymentIntent;
  rows.push(
    { label: `${prefix}_ROLE`, value: side.role },
    { label: `${prefix}_AMOUNT_TOTAL`, value: printable(side.amountTotal) },
    { label: `${prefix}_CURRENCY`, value: printable(side.currency) },
    { label: `${prefix}_LIVEMODE`, value: printable(side.livemode) },
    { label: `${prefix}_MODE`, value: printable(side.mode) },
    { label: `${prefix}_CREATED`, value: printable(side.created) },
    { label: `${prefix}_SESSION_STATUS`, value: printable(side.status) },
    { label: `${prefix}_PAYMENT_STATUS`, value: printable(side.paymentStatus) },
    { label: `${prefix}_CLIENT_REFERENCE`, value: side.clientReference },
    { label: `${prefix}_PAYMENT_METHOD_TYPES`, value: side.paymentMethodTypes.join(", ") || "NONE" },
    { label: `${prefix}_PAYMENT_METHOD_CONFIGURATION_PRESENT`, value: side.paymentMethodConfigurationDetails },
    { label: `${prefix}_CONFIG_RESOLUTION`, value: side.paymentMethodConfigurationResolution },
    { label: `${prefix}_CONFIG_ACTIVE`, value: printable(config.active) },
    { label: `${prefix}_CONFIG_IS_DEFAULT`, value: printable(config.isDefault) },
    { label: `${prefix}_CONFIG_LIVEMODE`, value: printable(config.livemode) },
    { label: `${prefix}_CUSTOMER_BALANCE_CONFIG_AVAILABLE`, value: printable(config.customerBalanceAvailable) },
    { label: `${prefix}_CUSTOMER_BALANCE_CONFIG_PREFERENCE`, value: printable(config.customerBalancePreference) },
    { label: `${prefix}_CUSTOMER_BALANCE_CONFIG_VALUE`, value: printable(config.customerBalanceValue) },
    { label: `${prefix}_CUSTOMER_BALANCE_CONFIG_OVERRIDABLE`, value: printable(config.customerBalanceOverridable) },
    { label: `${prefix}_CUSTOMER_BALANCE_IN_SESSION`, value: printable(side.customerBalanceInSession) },
    { label: `${prefix}_CUSTOMER_BALANCE_OPTION_PRESENT`, value: printable(side.customerBalanceOptionPresent) },
    { label: `${prefix}_CUSTOMER_BALANCE_FUNDING_TYPE`, value: printable(side.customerBalanceFundingType) },
    { label: `${prefix}_CUSTOMER_BALANCE_BANK_TRANSFER_TYPE`, value: printable(side.customerBalanceBankTransferType) },
    { label: `${prefix}_PAYMENT_METHOD_OPTION_KEYS`, value: side.paymentMethodOptionKeys.join(", ") || "NONE" },
    { label: `${prefix}_LOCALE`, value: printable(side.locale) },
    { label: `${prefix}_UI_MODE`, value: printable(side.uiMode) },
    { label: `${prefix}_PAYMENT_METHOD_COLLECTION`, value: printable(side.paymentMethodCollection) },
    { label: `${prefix}_BILLING_ADDRESS_COLLECTION`, value: printable(side.billingAddressCollection) },
    { label: `${prefix}_CUSTOMER_CREATION`, value: printable(side.customerCreation) },
    { label: `${prefix}_SUBMIT_TYPE`, value: printable(side.submitType) },
    { label: `${prefix}_CUSTOMER_PRESENT`, value: printable(side.customerPresent) },
    { label: `${prefix}_CASH_BALANCE_READ_SUPPORTED`, value: printable(side.cashBalance.readSupported) },
    { label: `${prefix}_CASH_BALANCE_LIVEMODE`, value: printable(side.cashBalance.livemode) },
    { label: `${prefix}_CASH_BALANCE_GBP`, value: printable(side.cashBalance.availableGbp) },
    { label: `${prefix}_RECONCILIATION_MODE`, value: printable(side.cashBalance.reconciliationMode) },
    { label: `${prefix}_PAYMENT_INTENT_PRESENT`, value: printable(side.paymentIntentPresent) },
    { label: `${prefix}_PAYMENT_INTENT_STATUS`, value: printable(intent?.status) },
    { label: `${prefix}_PAYMENT_INTENT_LIVEMODE`, value: printable(intent?.livemode) },
    { label: `${prefix}_PAYMENT_INTENT_AMOUNT`, value: printable(intent?.amount) },
    { label: `${prefix}_PAYMENT_INTENT_CURRENCY`, value: printable(intent?.currency) },
    { label: `${prefix}_PAYMENT_INTENT_METHOD_TYPES`, value: intent?.paymentMethodTypes.join(", ") || "NONE" },
    { label: `${prefix}_LAST_PAYMENT_ERROR_PRESENT`, value: printable(intent?.lastPaymentErrorPresent) },
    { label: `${prefix}_LAST_PAYMENT_ERROR_TYPE`, value: printable(intent?.lastPaymentError?.type) },
    { label: `${prefix}_LAST_PAYMENT_ERROR_CODE`, value: printable(intent?.lastPaymentError?.code) },
    { label: `${prefix}_LAST_PAYMENT_ERROR_DECLINE_CODE`, value: printable(intent?.lastPaymentError?.declineCode) },
    { label: `${prefix}_LAST_PAYMENT_ERROR_PARAM`, value: printable(intent?.lastPaymentError?.param) },
    { label: `${prefix}_LAST_PAYMENT_ERROR_MESSAGE`, value: printable(intent?.lastPaymentError?.message) },
    { label: `${prefix}_NEXT_ACTION_PRESENT`, value: printable(intent?.nextActionPresent) },
    { label: `${prefix}_NEXT_ACTION_TYPE`, value: printable(intent?.nextActionType) },
    { label: `${prefix}_LATEST_CHARGE_PRESENT`, value: printable(intent?.latestChargePresent) },
  );
}

function resultRows(result: LiveStripeSessionComparisonResult): AuditRow[] {
  if (result.kind === "SESSION_SEARCH_LIMIT_EXCEEDED" || result.kind === "SESSION_MATCH_COUNT_MISMATCH") {
    return [
      { label: "COMPARISON_STATUS", value: result.kind },
      { label: "CONTROL_MATCH_COUNT", value: String(result.controlMatchCount) },
      { label: "FAILED_MATCH_COUNT", value: String(result.failedMatchCount) },
    ];
  }
  if (result.kind === "SESSION_EXPECTATION_MISMATCH") {
    return [
      { label: "COMPARISON_STATUS", value: result.kind },
      { label: "MISMATCH_SIDE", value: result.side },
      { label: "ACTUAL_AMOUNT_TOTAL", value: printable(result.amountTotal) },
      { label: "ACTUAL_CURRENCY", value: printable(result.currency) },
      { label: "ACTUAL_LIVEMODE", value: printable(result.livemode) },
      { label: "ACTUAL_MODE", value: printable(result.mode) },
      { label: "CLIENT_REFERENCE", value: result.clientReference },
    ];
  }

  const rows: AuditRow[] = [
    { label: "CONTROL_MATCH_COUNT", value: "1" },
    { label: "FAILED_MATCH_COUNT", value: "1" },
  ];
  addSideRows(rows, "CONTROL", result.control);
  addSideRows(rows, "FAILED", result.failed);
  rows.push(
    { label: "SAME_PAYMENT_METHOD_CONFIGURATION", value: printable(result.samePaymentMethodConfiguration) },
    { label: "SESSION_PAYMENT_METHOD_SETUP_DIFFERENCE", value: printable(result.sessionPaymentMethodSetupDifference) },
    { label: "CUSTOMER_CASH_BALANCE_DIFFERENCE", value: printable(result.customerCashBalanceDifference) },
    { label: "FAILED_RELEVANT_EVENTS", value: result.failedRelevantEvents.join(", ") || "NONE" },
    { label: "FAILED_EVENT_SEARCH_COMPLETE", value: printable(result.failedEventSearchComplete) },
    { label: "BANK_TRANSFER_WAS_CREATED", value: printable(result.bankTransferWasCreated) },
    { label: "BANK_TRANSFER_CONFIRMATION_REJECTED", value: printable(result.bankTransferConfirmationRejected) },
    { label: "MOBILE_BROWSER_ONLY_CAUSE", value: result.mobileBrowserOnlyCause },
    { label: "ROOT_CAUSE_CONFIRMED", value: printable(result.rootCauseConfirmed) },
    { label: "ROOT_CAUSE_LAYER", value: result.rootCauseLayer },
    { label: "ROOT_CAUSE", value: result.rootCause },
    { label: "DIFFERENCES", value: result.differences.join(" | ") || "NONE" },
  );
  return rows;
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

  try {
    const stripe = createLiveStripeDiagnosticsClient();
    const result = await compareExistingLiveStripeSessions(stripe, TARGET_ORDER);
    return renderRows(resultRows(result));
  } catch (error) {
    const errorClass = error instanceof LiveStripeDiagnosticsStageError ? error.stage : "OTHER";
    return renderError(errorClass);
  }
}
