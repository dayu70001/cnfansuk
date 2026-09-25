import "server-only";

import { createHash } from "node:crypto";
import Stripe from "stripe";

const TARGET_ORDER_NUMBER = "CNF-260925-9135";
const TARGET_AMOUNT_MINOR = 2300;
const TARGET_CURRENCY = "gbp";
const SESSION_CREATED_FROM = Math.floor(Date.parse("2026-09-25T11:25:00.000Z") / 1000);
const SESSION_CREATED_UNTIL = Math.floor(Date.parse("2026-09-25T11:36:00.000Z") / 1000);
const MAX_LIST_PAGES = 10;
const PAGE_SIZE = 100;
const COMPARISON_CREATED_FROM = Math.floor(Date.parse("2026-09-25T00:00:00.000Z") / 1000);
const COMPARISON_CREATED_UNTIL = Math.floor(Date.parse("2026-09-26T00:00:00.000Z") / 1000);
const MAX_COMPARISON_EVENT_PAGES = 5;
const CONTROL_SESSION_FINGERPRINT = "1357fc84c1531c5650d8dc16ce1228ce9a99e0aed5f9ec217a3f2d7c726bdcd8";
const FAILED_SESSION_FINGERPRINT = "81a78f3ce6a4cb314514724b6c39a99380d307db856d186f9e6d14f973cf0f74";
const RELEVANT_FAILED_SESSION_EVENT_TYPES = [
  "payment_intent.created",
  "payment_intent.payment_failed",
  "payment_intent.requires_action",
  "payment_intent.processing",
  "checkout.session.completed",
  "checkout.session.async_payment_failed",
] as const;

export type LiveStripeDiagnosticOrder = {
  order_number: string;
  final_total: number;
  currency: string;
};

export type LiveStripeDiagnosticConfiguration = {
  present: boolean;
  active: boolean | null;
  isDefault: boolean | null;
  livemode: boolean | null;
  customerBalanceAvailable: boolean | null;
  customerBalancePreference: "on" | "off" | "none" | null;
  customerBalanceValue: "on" | "off" | null;
  customerBalanceOverridable: boolean | null;
  methods: Array<{
    method: string;
    available: boolean;
    displayPreferenceValue: "on" | "off" | null;
  }>;
};

export type LiveStripeDiagnosticBankTransferType =
  | "gb_bank_transfer"
  | "eu_bank_transfer"
  | "jp_bank_transfer"
  | "mx_bank_transfer"
  | "us_bank_transfer"
  | "unknown"
  | null;

export type LiveStripeDiagnosticRootCauseLayer =
  | "LIVE_PAYMENT_METHOD_CONFIGURATION_OFF"
  | "STRIPE_ACCOUNT_METHOD_UNAVAILABLE"
  | "STRIPE_DYNAMIC_SESSION_FILTERING"
  | "CUSTOMER_BALANCE_SESSION_OPTIONS_MISSING"
  | "CUSTOMER_BALANCE_NOT_CONFIGURED_AS_BANK_TRANSFER"
  | "WRONG_BANK_TRANSFER_TYPE"
  | "STRIPE_CHECKOUT_DISPLAY_OR_ELIGIBILITY"
  | "STRIPE_API_DOES_NOT_EXPOSE_ENOUGH_DETAIL"
  | "UNKNOWN";

export type LiveStripeDiagnosticFailureStage =
  | "STRIPE_SESSION_LIST_FAILED"
  | "STRIPE_SESSION_RETRIEVE_FAILED"
  | "PAYMENT_METHOD_CONFIGURATION_READ_FAILED"
  | "PAYMENT_INTENT_READ_FAILED"
  | "CUSTOMER_CASH_BALANCE_READ_FAILED"
  | "STRIPE_EVENTS_READ_FAILED";

export class LiveStripeDiagnosticsStageError extends Error {
  constructor(readonly stage: LiveStripeDiagnosticFailureStage) {
    super(stage);
    this.name = "LiveStripeDiagnosticsStageError";
  }
}

export type LiveStripeSessionDiagnosis = {
  sessionFound: true;
  matchCount: 1;
  livemode: true;
  mode: "payment";
  status: string | null;
  paymentStatus: string | null;
  amountTotal: number | null;
  sessionCurrency: string | null;
  paymentIntent: "PRESENT" | "NULL";
  customer: "PRESENT" | "ABSENT";
  clientReferenceMatch: true;
  paymentMethodTypes: string[];
  customerBalanceInSession: boolean;
  paymentMethodConfiguration: LiveStripeDiagnosticConfiguration;
  paymentMethodConfigurationResolution: string;
  paymentMethodConfigurationDetailsPresent: boolean;
  paymentMethodOptionKeys: string[];
  customerBalanceOptionPresent: boolean;
  customerBalanceFundingType: "bank_transfer" | "unknown" | null;
  customerBalanceBankTransferType: LiveStripeDiagnosticBankTransferType;
  case: "A" | "B" | "C" | "D" | "UNKNOWN";
  rootCauseLayer: LiveStripeDiagnosticRootCauseLayer;
  missingStripeFields: string[];
};

export type LiveStripeSessionDiagnosticResult =
  | { kind: "SESSION_NOT_FOUND"; matchCount: 0 }
  | { kind: "SESSION_AMBIGUOUS"; matchCount: number }
  | { kind: "SESSION_SEARCH_LIMIT_EXCEEDED"; matchCount: number }
  | { kind: "SESSION_RETRIEVAL_MISMATCH"; matchCount: 1 }
  | { kind: "diagnosed"; diagnosis: LiveStripeSessionDiagnosis };

export type LiveStripeComparisonSide = {
  role: "CONTROL_METHOD_VISIBLE" | "FAILED_AFTER_PAY_CLICK";
  amountTotal: number | null;
  currency: string | null;
  livemode: boolean | null;
  mode: string | null;
  created: number | null;
  status: string | null;
  paymentStatus: string | null;
  clientReference: "MATCHED_ORDER" | "PRESENT" | "ABSENT";
  paymentMethodTypes: string[];
  paymentMethodConfigurationDetails: "PRESENT" | "ABSENT";
  paymentMethodConfigurationResolution: string;
  paymentMethodConfiguration: LiveStripeDiagnosticConfiguration;
  customerBalanceInSession: boolean;
  paymentMethodOptionKeys: string[];
  customerBalanceOptionPresent: boolean;
  customerBalanceFundingType: "bank_transfer" | "unknown" | null;
  customerBalanceBankTransferType: LiveStripeDiagnosticBankTransferType;
  locale: string | null;
  uiMode: string | null;
  paymentMethodCollection: string | null;
  billingAddressCollection: string | null;
  customerCreation: string | null;
  submitType: string | null;
  customerPresent: boolean;
  cashBalance: {
    readSupported: boolean;
    livemode: boolean | null;
    availableGbp: number | null;
    reconciliationMode: string | null;
  };
  paymentIntentPresent: boolean;
  paymentIntent: {
    status: string | null;
    livemode: boolean | null;
    amount: number | null;
    currency: string | null;
    paymentMethodTypes: string[];
    lastPaymentErrorPresent: boolean;
    lastPaymentError: {
      type: string | null;
      code: string | null;
      declineCode: string | null;
      param: string | null;
      message: string | null;
    } | null;
    nextActionPresent: boolean;
    nextActionType: "display_bank_transfer_instructions" | "redirect_to_url" | "other" | null;
    latestChargePresent: boolean;
  } | null;
};

export type LiveStripeSessionComparisonResult =
  | { kind: "SESSION_SEARCH_LIMIT_EXCEEDED"; controlMatchCount: number; failedMatchCount: number }
  | { kind: "SESSION_MATCH_COUNT_MISMATCH"; controlMatchCount: number; failedMatchCount: number }
  | {
    kind: "SESSION_EXPECTATION_MISMATCH";
    side: "CONTROL" | "FAILED";
    amountTotal: number | null;
    currency: string | null;
    livemode: boolean | null;
    mode: string | null;
    clientReference: "MATCHED_ORDER" | "PRESENT" | "ABSENT";
  }
  | {
    kind: "diagnosed";
    control: LiveStripeComparisonSide;
    failed: LiveStripeComparisonSide;
    samePaymentMethodConfiguration: boolean | null;
    sessionPaymentMethodSetupDifference: boolean;
    customerCashBalanceDifference: boolean | "UNKNOWN";
    differences: string[];
    failedRelevantEvents: string[];
    failedEventSearchComplete: boolean | null;
    bankTransferWasCreated: boolean;
    bankTransferConfirmationRejected: boolean;
    mobileBrowserOnlyCause: "NO";
    rootCauseConfirmed: boolean;
    rootCauseLayer: string;
    rootCause: string;
  };

/** Create a server-only Stripe client after verifying this is the configured Production Live environment. */
export function createLiveStripeDiagnosticsClient(env: NodeJS.ProcessEnv = process.env): Stripe {
  const secretKey = env.STRIPE_SECRET_KEY;
  if (
    env.NODE_ENV !== "production"
    || env.VERCEL !== "1"
    || env.VERCEL_ENV !== "production"
    || env.STRIPE_BANK_TRANSFER_MODE !== "live"
    || !secretKey?.startsWith("sk_live_")
  ) {
    throw new Error("Live Stripe diagnostics are unavailable outside Production Live Mode.");
  }

  return new Stripe(secretKey, { maxNetworkRetries: 0, timeout: 15_000 });
}

/** Read-only lookup for the one approved order. This function never creates or updates Stripe objects. */
export async function diagnoseExistingLiveStripeSession(
  stripe: Stripe,
  order: LiveStripeDiagnosticOrder,
): Promise<LiveStripeSessionDiagnosticResult> {
  if (
    order.order_number !== TARGET_ORDER_NUMBER
    || !Number.isFinite(order.final_total)
    || Math.round(order.final_total * 100) !== TARGET_AMOUNT_MINOR
    || Math.abs(order.final_total * 100 - TARGET_AMOUNT_MINOR) > 0.00001
    || order.currency.toUpperCase() !== "GBP"
  ) {
    throw new Error("The fixed diagnostic order does not match its approved amount and currency.");
  }

  const matches: Stripe.Checkout.Session[] = [];
  let startingAfter: string | undefined;
  let completed = false;

  for (let pageNumber = 0; pageNumber < MAX_LIST_PAGES; pageNumber += 1) {
    let page: Stripe.ApiList<Stripe.Checkout.Session>;
    try {
      page = await stripe.checkout.sessions.list({
        created: { gte: SESSION_CREATED_FROM, lt: SESSION_CREATED_UNTIL },
        limit: PAGE_SIZE,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
    } catch {
      throw new LiveStripeDiagnosticsStageError("STRIPE_SESSION_LIST_FAILED");
    }

    for (const session of page.data) {
      if (
        session.created >= SESSION_CREATED_FROM
        && session.created < SESSION_CREATED_UNTIL
        && session.livemode === true
        && session.mode === "payment"
        && session.client_reference_id === TARGET_ORDER_NUMBER
        && session.amount_total === TARGET_AMOUNT_MINOR
        && session.currency === TARGET_CURRENCY
      ) matches.push(session);
    }

    if (!page.has_more) {
      completed = true;
      break;
    }

    const lastSession = page.data.at(-1);
    if (!lastSession) return { kind: "SESSION_SEARCH_LIMIT_EXCEEDED", matchCount: matches.length };
    startingAfter = lastSession.id;
  }

  if (!completed) return { kind: "SESSION_SEARCH_LIMIT_EXCEEDED", matchCount: matches.length };
  if (matches.length === 0) return { kind: "SESSION_NOT_FOUND", matchCount: 0 };
  if (matches.length !== 1) return { kind: "SESSION_AMBIGUOUS", matchCount: matches.length };

  const listedSession = matches[0];
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(listedSession.id);
  } catch {
    throw new LiveStripeDiagnosticsStageError("STRIPE_SESSION_RETRIEVE_FAILED");
  }
  if (
    session.id !== listedSession.id
    || session.created < SESSION_CREATED_FROM
    || session.created >= SESSION_CREATED_UNTIL
    || session.livemode !== true
    || session.mode !== "payment"
    || session.client_reference_id !== TARGET_ORDER_NUMBER
    || session.amount_total !== TARGET_AMOUNT_MINOR
    || session.currency !== TARGET_CURRENCY
  ) return { kind: "SESSION_RETRIEVAL_MISMATCH", matchCount: 1 };

  const configurationDetailsId = session.payment_method_configuration_details?.id;
  let resolvedConfiguration: Awaited<ReturnType<typeof resolvePaymentMethodConfiguration>>;
  try {
    resolvedConfiguration = await resolvePaymentMethodConfiguration(stripe, configurationDetailsId);
  } catch {
    throw new LiveStripeDiagnosticsStageError("PAYMENT_METHOD_CONFIGURATION_READ_FAILED");
  }
  const paymentMethodTypes = session.payment_method_types.filter(isSafeIdentifier);
  const paymentMethodOptionKeys = Object.keys(session.payment_method_options ?? {}).filter(isSafeIdentifier);
  const customerBalanceInSession = paymentMethodTypes.includes("customer_balance");
  const customerBalance = resolvedConfiguration.configuration?.customer_balance;
  const configurationValue = safeConfigValue(customerBalance?.display_preference?.value);
  const configurationAvailable = typeof customerBalance?.available === "boolean"
    ? customerBalance.available
    : null;
  const paymentMethodOptions = session.payment_method_options as unknown as Record<string, unknown> | null;
  const customerBalanceOption = asRecord(paymentMethodOptions?.customer_balance);
  const customerBalanceBankTransferOption = asRecord(customerBalanceOption?.bank_transfer);
  const customerBalanceOptionPresent = customerBalanceOption !== null;
  const customerBalanceFundingType = safeFundingType(customerBalanceOption?.funding_type);
  const customerBalanceBankTransferType = safeBankTransferType(customerBalanceBankTransferOption?.type);
  const classification = classifyRootCause(
    configurationValue,
    configurationAvailable,
    customerBalanceInSession,
    customerBalanceOptionPresent,
    customerBalanceFundingType,
    customerBalanceBankTransferType,
  );

  return {
    kind: "diagnosed",
    diagnosis: {
      sessionFound: true,
      matchCount: 1,
      livemode: true,
      mode: "payment",
      status: safeStripeStatus(session.status),
      paymentStatus: safeStripeStatus(session.payment_status),
      amountTotal: session.amount_total,
      sessionCurrency: session.currency,
      paymentIntent: session.payment_intent ? "PRESENT" : "NULL",
      customer: session.customer ? "PRESENT" : "ABSENT",
      clientReferenceMatch: true,
      paymentMethodTypes,
      customerBalanceInSession,
      paymentMethodConfiguration: summarizeConfiguration(resolvedConfiguration.configuration),
      paymentMethodConfigurationResolution: resolvedConfiguration.resolution,
      paymentMethodConfigurationDetailsPresent: Boolean(configurationDetailsId),
      paymentMethodOptionKeys,
      customerBalanceOptionPresent,
      customerBalanceFundingType,
      customerBalanceBankTransferType,
      case: classification.case,
      rootCauseLayer: classification.rootCauseLayer,
      missingStripeFields: classification.missingStripeFields,
    },
  };
}

/**
 * Compare the two pre-approved Live Checkout Sessions by one-way fingerprint.
 * The raw IDs exist only in Stripe SDK call arguments and never enter results.
 * The optional fingerprints are solely for unit-test fixtures; Production calls
 * this function without arguments and uses the two fixed SHA-256 values above.
 */
export async function compareExistingLiveStripeSessions(
  stripe: Stripe,
  order: LiveStripeDiagnosticOrder,
  fingerprints: { control: string; failed: string } = {
    control: CONTROL_SESSION_FINGERPRINT,
    failed: FAILED_SESSION_FINGERPRINT,
  },
): Promise<LiveStripeSessionComparisonResult> {
  if (
    order.order_number !== TARGET_ORDER_NUMBER
    || !Number.isFinite(order.final_total)
    || Math.round(order.final_total * 100) !== TARGET_AMOUNT_MINOR
    || Math.abs(order.final_total * 100 - TARGET_AMOUNT_MINOR) > 0.00001
    || order.currency.toUpperCase() !== TARGET_CURRENCY.toUpperCase()
  ) throw new Error("The fixed diagnostic order does not match its approved amount and currency.");

  if (!isSha256Fingerprint(fingerprints.control) || !isSha256Fingerprint(fingerprints.failed)) {
    throw new Error("The approved session fingerprints are invalid.");
  }

  const matches: Record<"control" | "failed", { count: number; session: Stripe.Checkout.Session | null }> = {
    control: { count: 0, session: null },
    failed: { count: 0, session: null },
  };
  let startingAfter: string | undefined;
  let completed = false;

  for (let pageNumber = 0; pageNumber < MAX_LIST_PAGES; pageNumber += 1) {
    let page: Stripe.ApiList<Stripe.Checkout.Session>;
    try {
      page = await stripe.checkout.sessions.list({
        created: { gte: COMPARISON_CREATED_FROM, lt: COMPARISON_CREATED_UNTIL },
        limit: PAGE_SIZE,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
    } catch {
      throw new LiveStripeDiagnosticsStageError("STRIPE_SESSION_LIST_FAILED");
    }

    for (const session of page.data) {
      const fingerprint = sha256Fingerprint(session.id);
      if (fingerprint === fingerprints.control) {
        matches.control.count += 1;
        matches.control.session ??= session;
      }
      if (fingerprint === fingerprints.failed) {
        matches.failed.count += 1;
        matches.failed.session ??= session;
      }
    }

    if (!page.has_more) {
      completed = true;
      break;
    }

    const lastSession = page.data.at(-1);
    if (!lastSession) break;
    startingAfter = lastSession.id;
  }

  if (!completed) {
    return {
      kind: "SESSION_SEARCH_LIMIT_EXCEEDED",
      controlMatchCount: matches.control.count,
      failedMatchCount: matches.failed.count,
    };
  }

  if (matches.control.count !== 1 || matches.failed.count !== 1) {
    return {
      kind: "SESSION_MATCH_COUNT_MISMATCH",
      controlMatchCount: matches.control.count,
      failedMatchCount: matches.failed.count,
    };
  }

  const listedControl = matches.control.session;
  const listedFailed = matches.failed.session;
  if (!listedControl || !listedFailed) {
    return {
      kind: "SESSION_MATCH_COUNT_MISMATCH",
      controlMatchCount: matches.control.count,
      failedMatchCount: matches.failed.count,
    };
  }

  const [controlSession, failedSession] = await Promise.all([
    retrieveComparisonSession(stripe, listedControl, fingerprints.control),
    retrieveComparisonSession(stripe, listedFailed, fingerprints.failed),
  ]);

  const controlReference = clientReferenceStatus(controlSession.client_reference_id, order.order_number);
  const failedReference = clientReferenceStatus(failedSession.client_reference_id, order.order_number);
  const mismatch = (session: Stripe.Checkout.Session, expectedAmount: number, side: "CONTROL" | "FAILED") => {
    const clientReference = clientReferenceStatus(session.client_reference_id, order.order_number);
    return (
      session.created < COMPARISON_CREATED_FROM
      || session.created >= COMPARISON_CREATED_UNTIL
      || session.livemode !== true
      || session.mode !== "payment"
      || session.amount_total !== expectedAmount
      || session.currency !== TARGET_CURRENCY
      || (side === "FAILED" && clientReference !== "MATCHED_ORDER")
    );
  };

  if (mismatch(controlSession, 4100, "CONTROL")) {
    return {
      kind: "SESSION_EXPECTATION_MISMATCH",
      side: "CONTROL",
      amountTotal: safeAmount(controlSession.amount_total),
      currency: safeCurrency(controlSession.currency),
      livemode: typeof controlSession.livemode === "boolean" ? controlSession.livemode : null,
      mode: safeEnum(controlSession.mode),
      clientReference: controlReference,
    };
  }
  if (mismatch(failedSession, TARGET_AMOUNT_MINOR, "FAILED")) {
    return {
      kind: "SESSION_EXPECTATION_MISMATCH",
      side: "FAILED",
      amountTotal: safeAmount(failedSession.amount_total),
      currency: safeCurrency(failedSession.currency),
      livemode: typeof failedSession.livemode === "boolean" ? failedSession.livemode : null,
      mode: safeEnum(failedSession.mode),
      clientReference: failedReference,
    };
  }

  const [controlRead, failedRead] = await Promise.all([
    readComparisonSession(stripe, controlSession, "CONTROL_METHOD_VISIBLE", order.order_number),
    readComparisonSession(stripe, failedSession, "FAILED_AFTER_PAY_CLICK", order.order_number),
  ]);
  const samePaymentMethodConfiguration = compareConfigurationIdentity(
    controlRead.configurationIdentity,
    failedRead.configurationIdentity,
  );
  const sessionPaymentMethodSetupDifference = hasSessionMethodSetupDifference(controlRead.summary, failedRead.summary);
  const customerCashBalanceDifference = compareCustomerCashBalance(controlRead.summary.cashBalance, failedRead.summary.cashBalance);

  let failedRelevantEvents: string[] = [];
  let failedEventSearchComplete: boolean | null = null;
  const failedIntent = failedRead.summary.paymentIntent;
  if (!failedIntent || !failedIntent.lastPaymentErrorPresent) {
    const eventResult = await readFailedSessionEvents(stripe, failedSession, failedRead.paymentIntentId, order.order_number);
    failedRelevantEvents = eventResult.types;
    failedEventSearchComplete = eventResult.complete;
  }

  const differences = collectSafeDifferences(
    controlRead.summary,
    failedRead.summary,
    samePaymentMethodConfiguration,
  );
  const paymentIntentError = failedIntent?.lastPaymentError;
  const bankTransferWasCreated = Boolean(
    failedIntent?.status === "requires_action"
    && failedIntent.nextActionType === "display_bank_transfer_instructions",
  );
  const bankTransferConfirmationRejected = Boolean(
    failedIntent?.status === "requires_payment_method"
    && failedIntent.lastPaymentErrorPresent,
  );

  let rootCauseConfirmed = false;
  let rootCauseLayer = "INSUFFICIENT_STRIPE_EVIDENCE";
  let rootCause = "Stripe's read-only Session, PaymentIntent and linked-event data did not expose a specific failure cause.";
  if (failedIntent?.lastPaymentErrorPresent) {
    rootCauseConfirmed = true;
    rootCauseLayer = "FAILED_PAYMENT_INTENT_LAST_ERROR";
    rootCause = paymentIntentError?.message
      ?? paymentIntentError?.code
      ?? paymentIntentError?.type
      ?? "Stripe recorded a PaymentIntent last_payment_error; its whitelisted details are reported separately.";
  } else if (bankTransferWasCreated) {
    rootCauseConfirmed = true;
    rootCauseLayer = "STRIPE_CHECKOUT_DISPLAY_OR_SESSION_PRESENTATION";
    rootCause = "The failed Session's PaymentIntent requires action and exposes display_bank_transfer_instructions; Stripe created bank-transfer instructions.";
  } else if (failedRelevantEvents.length > 0) {
    rootCauseLayer = "STRIPE_EVENT_EVIDENCE_WITHOUT_PAYMENT_ERROR_DETAIL";
    rootCause = "Linked Stripe events were found, but no PaymentIntent last_payment_error or bank-transfer instruction action proves why the customer saw the failure.";
  }

  return {
    kind: "diagnosed",
    control: controlRead.summary,
    failed: failedRead.summary,
    samePaymentMethodConfiguration,
    sessionPaymentMethodSetupDifference,
    customerCashBalanceDifference,
    differences,
    failedRelevantEvents,
    failedEventSearchComplete,
    bankTransferWasCreated,
    bankTransferConfirmationRejected,
    mobileBrowserOnlyCause: "NO",
    rootCauseConfirmed,
    rootCauseLayer,
    rootCause,
  };
}

function sha256Fingerprint(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function isSha256Fingerprint(value: string) {
  return /^[a-f0-9]{64}$/.test(value);
}

function clientReferenceStatus(value: unknown, expectedOrder: string): "MATCHED_ORDER" | "PRESENT" | "ABSENT" {
  if (value === expectedOrder) return "MATCHED_ORDER";
  return typeof value === "string" && value.length > 0 ? "PRESENT" : "ABSENT";
}

async function retrieveComparisonSession(stripe: Stripe, listed: Stripe.Checkout.Session, expectedFingerprint: string) {
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(listed.id);
  } catch {
    throw new LiveStripeDiagnosticsStageError("STRIPE_SESSION_RETRIEVE_FAILED");
  }
  if (sha256Fingerprint(session.id) !== expectedFingerprint || session.id !== listed.id) {
    throw new LiveStripeDiagnosticsStageError("STRIPE_SESSION_RETRIEVE_FAILED");
  }
  return session;
}

async function readComparisonSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  role: LiveStripeComparisonSide["role"],
  expectedOrder: string,
) {
  const configurationDetailsId = session.payment_method_configuration_details?.id;
  let resolution: Awaited<ReturnType<typeof resolvePaymentMethodConfiguration>>;
  try {
    resolution = await resolvePaymentMethodConfiguration(stripe, configurationDetailsId);
  } catch {
    throw new LiveStripeDiagnosticsStageError("PAYMENT_METHOD_CONFIGURATION_READ_FAILED");
  }

  const sessionValues = session as unknown as Record<string, unknown>;
  const options = asRecord(sessionValues.payment_method_options);
  const customerBalanceOption = asRecord(options?.customer_balance);
  const bankTransferOption = asRecord(customerBalanceOption?.bank_transfer);
  const methodTypes = safeStringArray(session.payment_method_types, isSafeIdentifier);
  const optionKeys = Object.keys(options ?? {}).filter(isSafeIdentifier);
  const customerBalanceInSession = methodTypes.includes("customer_balance");
  const customerId = stripeObjectId(session.customer);
  const paymentIntentId = stripeObjectId(session.payment_intent);

  const cashBalance = await readCustomerCashBalance(stripe, customerId);
  const paymentIntent = await readComparisonPaymentIntent(stripe, paymentIntentId);
  const configurationIdentity = resolution.configuration?.id ?? null;

  const summary: LiveStripeComparisonSide = {
    role,
    amountTotal: safeAmount(session.amount_total),
    currency: safeCurrency(session.currency),
    livemode: typeof session.livemode === "boolean" ? session.livemode : null,
    mode: safeEnum(session.mode),
    created: Number.isInteger(session.created) ? session.created : null,
    status: safeStripeStatus(session.status),
    paymentStatus: safeStripeStatus(session.payment_status),
    clientReference: clientReferenceStatus(session.client_reference_id, expectedOrder),
    paymentMethodTypes: methodTypes,
    paymentMethodConfigurationDetails: configurationDetailsId ? "PRESENT" : "ABSENT",
    paymentMethodConfigurationResolution: resolution.resolution,
    paymentMethodConfiguration: summarizeConfiguration(resolution.configuration),
    customerBalanceInSession,
    paymentMethodOptionKeys: optionKeys,
    customerBalanceOptionPresent: customerBalanceOption !== null,
    customerBalanceFundingType: safeFundingType(customerBalanceOption?.funding_type),
    customerBalanceBankTransferType: safeBankTransferType(bankTransferOption?.type),
    locale: safeEnum(sessionValues.locale),
    uiMode: safeEnum(sessionValues.ui_mode),
    paymentMethodCollection: safeEnum(sessionValues.payment_method_collection),
    billingAddressCollection: safeEnum(sessionValues.billing_address_collection),
    customerCreation: safeEnum(sessionValues.customer_creation),
    submitType: safeEnum(sessionValues.submit_type),
    customerPresent: customerId !== null,
    cashBalance,
    paymentIntentPresent: paymentIntentId !== null,
    paymentIntent,
  };

  return { summary, configurationIdentity, paymentIntentId };
}

async function readCustomerCashBalance(
  stripe: Stripe,
  customerId: string | null,
): Promise<LiveStripeComparisonSide["cashBalance"]> {
  const customers = stripe.customers as unknown as {
    retrieveCashBalance?: (id: string) => Promise<unknown>;
  };
  if (typeof customers.retrieveCashBalance !== "function") {
    return { readSupported: false, livemode: null, availableGbp: null, reconciliationMode: null };
  }
  if (!customerId) return { readSupported: true, livemode: null, availableGbp: null, reconciliationMode: null };

  let result: unknown;
  try {
    result = await customers.retrieveCashBalance(customerId);
  } catch {
    throw new LiveStripeDiagnosticsStageError("CUSTOMER_CASH_BALANCE_READ_FAILED");
  }
  const balance = asRecord(result);
  const available = asRecord(balance?.available);
  const settings = asRecord(balance?.settings);
  const gbp = available?.gbp;
  return {
    readSupported: true,
    livemode: typeof balance?.livemode === "boolean" ? balance.livemode : null,
    availableGbp: typeof gbp === "number" && Number.isFinite(gbp) ? gbp : 0,
    reconciliationMode: safeEnum(settings?.reconciliation_mode),
  };
}

async function readComparisonPaymentIntent(stripe: Stripe, paymentIntentId: string | null) {
  if (!paymentIntentId) return null;

  let intent: Stripe.PaymentIntent;
  try {
    intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    throw new LiveStripeDiagnosticsStageError("PAYMENT_INTENT_READ_FAILED");
  }

  const values = intent as unknown as Record<string, unknown>;
  const lastError = asRecord(values.last_payment_error);
  const nextAction = asRecord(values.next_action);
  const nextActionRawType = safeEnum(nextAction?.type);
  const nextActionType: NonNullable<LiveStripeComparisonSide["paymentIntent"]>["nextActionType"] = nextActionRawType === "display_bank_transfer_instructions"
    ? "display_bank_transfer_instructions"
    : nextActionRawType === "redirect_to_url"
      ? "redirect_to_url"
      : nextActionRawType
        ? "other"
        : null;

  return {
    status: safeStripeStatus(values.status),
    livemode: typeof values.livemode === "boolean" ? values.livemode : null,
    amount: safeAmount(values.amount),
    currency: safeCurrency(values.currency),
    paymentMethodTypes: safeStringArray(values.payment_method_types, isSafeIdentifier),
    lastPaymentErrorPresent: lastError !== null,
    lastPaymentError: lastError ? {
      type: safeToken(lastError.type),
      code: safeToken(lastError.code),
      declineCode: safeToken(lastError.decline_code),
      param: safeParameter(lastError.param),
      message: safeDiagnosticMessage(lastError.message),
    } : null,
    nextActionPresent: nextAction !== null,
    nextActionType,
    latestChargePresent: stripeObjectId(values.latest_charge) !== null,
  };
}

async function readFailedSessionEvents(stripe: Stripe, failedSession: Stripe.Checkout.Session, paymentIntentId: string | null, expectedOrder: string) {
  const from = Math.max(COMPARISON_CREATED_FROM, failedSession.created - 15 * 60);
  const until = Math.min(COMPARISON_CREATED_UNTIL, failedSession.created + 2 * 60 * 60);
  const types: string[] = [];
  let startingAfter: string | undefined;
  let complete = false;

  for (let pageNumber = 0; pageNumber < MAX_COMPARISON_EVENT_PAGES; pageNumber += 1) {
    let page: Stripe.ApiList<Stripe.Event>;
    try {
      page = await stripe.events.list({
        created: { gte: from, lt: until },
        types: [...RELEVANT_FAILED_SESSION_EVENT_TYPES],
        limit: PAGE_SIZE,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
    } catch {
      throw new LiveStripeDiagnosticsStageError("STRIPE_EVENTS_READ_FAILED");
    }

    for (const event of page.data) {
      if (!RELEVANT_FAILED_SESSION_EVENT_TYPES.includes(event.type as typeof RELEVANT_FAILED_SESSION_EVENT_TYPES[number])) continue;
      const eventData = asRecord(event.data);
      const eventObject = asRecord(eventData?.object);
      const eventObjectId = typeof eventObject?.id === "string" ? eventObject.id : null;
      const metadata = asRecord(eventObject?.metadata);
      const linkedToFailedSession = eventObjectId === failedSession.id
        || (eventObjectId !== null && paymentIntentId !== null && eventObjectId === paymentIntentId)
        || eventObject?.client_reference_id === expectedOrder
        || metadata?.order_number === expectedOrder
        || metadata?.orderNumber === expectedOrder;
      if (linkedToFailedSession && !types.includes(event.type)) types.push(event.type);
    }

    if (!page.has_more) {
      complete = true;
      break;
    }
    const lastEvent = page.data.at(-1);
    if (!lastEvent) break;
    startingAfter = lastEvent.id;
  }

  return { types, complete };
}

function compareConfigurationIdentity(control: string | null, failed: string | null): boolean | null {
  if (!control || !failed) return null;
  return control === failed;
}

function hasSessionMethodSetupDifference(control: LiveStripeComparisonSide, failed: LiveStripeComparisonSide) {
  return [
    [control.paymentMethodTypes, failed.paymentMethodTypes],
    [control.paymentMethodConfigurationDetails, failed.paymentMethodConfigurationDetails],
    [control.paymentMethodOptionKeys, failed.paymentMethodOptionKeys],
    [control.customerBalanceOptionPresent, failed.customerBalanceOptionPresent],
    [control.customerBalanceFundingType, failed.customerBalanceFundingType],
    [control.customerBalanceBankTransferType, failed.customerBalanceBankTransferType],
  ].some(([left, right]) => JSON.stringify(left) !== JSON.stringify(right));
}

function compareCustomerCashBalance(
  control: LiveStripeComparisonSide["cashBalance"],
  failed: LiveStripeComparisonSide["cashBalance"],
): boolean | "UNKNOWN" {
  if (!control.readSupported || !failed.readSupported || control.livemode !== true || failed.livemode !== true) return "UNKNOWN";
  return control.availableGbp !== failed.availableGbp || control.reconciliationMode !== failed.reconciliationMode;
}

function collectSafeDifferences(
  control: LiveStripeComparisonSide,
  failed: LiveStripeComparisonSide,
  sameConfiguration: boolean | null,
) {
  const differences: string[] = [];
  const compare = (label: string, left: unknown, right: unknown) => {
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      differences.push(`${label}: control=${safeDifferenceValue(left)}; failed=${safeDifferenceValue(right)}`);
    }
  };

  compare("created", control.created, failed.created);
  compare("amount_total", control.amountTotal, failed.amountTotal);
  compare("currency", control.currency, failed.currency);
  compare("status", control.status, failed.status);
  compare("payment_status", control.paymentStatus, failed.paymentStatus);
  compare("client_reference", control.clientReference, failed.clientReference);
  compare("payment_method_types", control.paymentMethodTypes, failed.paymentMethodTypes);
  compare("payment_method_configuration_details", control.paymentMethodConfigurationDetails, failed.paymentMethodConfigurationDetails);
  compare("payment_method_option_keys", control.paymentMethodOptionKeys, failed.paymentMethodOptionKeys);
  compare("customer_balance_option_present", control.customerBalanceOptionPresent, failed.customerBalanceOptionPresent);
  compare("customer_balance_funding_type", control.customerBalanceFundingType, failed.customerBalanceFundingType);
  compare("customer_balance_bank_transfer_type", control.customerBalanceBankTransferType, failed.customerBalanceBankTransferType);
  compare("locale", control.locale, failed.locale);
  compare("ui_mode", control.uiMode, failed.uiMode);
  compare("payment_method_collection", control.paymentMethodCollection, failed.paymentMethodCollection);
  compare("billing_address_collection", control.billingAddressCollection, failed.billingAddressCollection);
  compare("customer_creation", control.customerCreation, failed.customerCreation);
  compare("submit_type", control.submitType, failed.submitType);
  if (sameConfiguration === false) differences.push("payment_method_configuration: control and failed Sessions use different configurations");
  if (sameConfiguration === null) differences.push("payment_method_configuration: one or both configurations could not be resolved");
  compare("config_active", control.paymentMethodConfiguration.active, failed.paymentMethodConfiguration.active);
  compare("config_is_default", control.paymentMethodConfiguration.isDefault, failed.paymentMethodConfiguration.isDefault);
  compare("config_livemode", control.paymentMethodConfiguration.livemode, failed.paymentMethodConfiguration.livemode);
  compare("customer_balance_available", control.paymentMethodConfiguration.customerBalanceAvailable, failed.paymentMethodConfiguration.customerBalanceAvailable);
  compare("customer_balance_preference", control.paymentMethodConfiguration.customerBalancePreference, failed.paymentMethodConfiguration.customerBalancePreference);
  compare("customer_balance_value", control.paymentMethodConfiguration.customerBalanceValue, failed.paymentMethodConfiguration.customerBalanceValue);
  compare("customer_balance_overridable", control.paymentMethodConfiguration.customerBalanceOverridable, failed.paymentMethodConfiguration.customerBalanceOverridable);

  if (control.cashBalance.readSupported && failed.cashBalance.readSupported) {
    compare("cash_balance_gbp", control.cashBalance.availableGbp, failed.cashBalance.availableGbp);
    compare("cash_balance_reconciliation_mode", control.cashBalance.reconciliationMode, failed.cashBalance.reconciliationMode);
  }
  return differences;
}

function safeDifferenceValue(value: unknown) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((entry) => String(entry)).join(",") || "NONE";
  return typeof value === "string" ? safeDiagnosticMessage(value) ?? "null" : "null";
}

function safeAmount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function safeCurrency(value: unknown): string | null {
  return typeof value === "string" && /^[a-z]{3}$/.test(value) ? value : null;
}

function safeEnum(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(value) ? value : null;
}

function safeToken(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(value) ? value : null;
}

function safeParameter(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z0-9_.[\]-]{1,120}$/.test(value) ? value : null;
}

function safeDiagnosticMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const safe = value
    .replace(/\b(?:cs_live_|cs_test_|cus_|pi_|pm_|pmc_|evt_|sk_live_|sk_test_)[A-Za-z0-9_]+\b/gi, "[redacted]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted email]")
    .replace(/https?:\/\/\S+/gi, "[redacted URL]")
    .replace(/\b\+?\d[\d\s().-]{7,}\d\b/g, "[redacted number]")
    .replace(/\bclient_secret\b/gi, "[redacted]")
    .replace(/[\r\n\t]+/g, " ")
    .trim();
  return safe.slice(0, 240) || null;
}

function safeStringArray(values: unknown, predicate: (value: string) => boolean): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value): value is string => typeof value === "string" && predicate(value)))];
}

function stripeObjectId(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  const object = asRecord(value);
  return typeof object?.id === "string" && object.id.length > 0 ? object.id : null;
}

async function resolvePaymentMethodConfiguration(stripe: Stripe, configurationId?: string) {
  if (configurationId) {
    const configuration = await stripe.paymentMethodConfigurations.retrieve(configurationId);
    if (configuration.id !== configurationId || configuration.livemode !== true) {
      return { configuration: null, resolution: "SESSION_CONFIGURATION_NOT_LIVE_OR_MISMATCHED" };
    }
    return { configuration, resolution: "SESSION_CONFIGURATION" };
  }

  const configurations: Stripe.PaymentMethodConfiguration[] = [];
  let startingAfter: string | undefined;
  let completed = false;

  for (let pageNumber = 0; pageNumber < MAX_LIST_PAGES; pageNumber += 1) {
    const page = await stripe.paymentMethodConfigurations.list({
      limit: PAGE_SIZE,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    configurations.push(...page.data.filter((configuration) =>
      configuration.livemode === true && configuration.is_default === true && configuration.active === true,
    ));

    if (!page.has_more) {
      completed = true;
      break;
    }

    const lastConfiguration = page.data.at(-1);
    if (!lastConfiguration) break;
    startingAfter = lastConfiguration.id;
  }

  if (!completed) return { configuration: null, resolution: "DEFAULT_CONFIGURATION_LIST_INCOMPLETE" };
  if (configurations.length === 0) return { configuration: null, resolution: "DEFAULT_CONFIGURATION_NOT_FOUND" };
  if (configurations.length !== 1) return { configuration: null, resolution: "DEFAULT_CONFIGURATION_AMBIGUOUS" };
  return { configuration: configurations[0], resolution: "LIVE_DEFAULT_CONFIGURATION" };
}

function summarizeConfiguration(configuration: Stripe.PaymentMethodConfiguration | null) {
  if (!configuration) {
    return {
      present: false,
      active: null,
      isDefault: null,
      livemode: null,
      customerBalanceAvailable: null,
      customerBalancePreference: null,
      customerBalanceValue: null,
      customerBalanceOverridable: null,
      methods: [],
    } satisfies LiveStripeDiagnosticConfiguration;
  }

  const values = configuration as unknown as Record<string, unknown>;
  const methods = Object.entries(values).flatMap(([method, value]) => {
    if (!isSafeIdentifier(method) || !value || typeof value !== "object") return [];
    const methodConfiguration = value as Record<string, unknown>;
    const displayPreference = methodConfiguration.display_preference;
    if (typeof methodConfiguration.available !== "boolean" || !displayPreference || typeof displayPreference !== "object") return [];
    const displayValue = safeConfigValue((displayPreference as Record<string, unknown>).value);
    return [{ method, available: methodConfiguration.available, displayPreferenceValue: displayValue }];
  });

  const customerBalance = values.customer_balance && typeof values.customer_balance === "object"
    ? values.customer_balance as Record<string, unknown>
    : null;
  const customerBalancePreference = customerBalance?.display_preference && typeof customerBalance.display_preference === "object"
    ? safeConfigPreference((customerBalance.display_preference as Record<string, unknown>).preference)
    : null;
  const customerBalanceValue = customerBalance?.display_preference && typeof customerBalance.display_preference === "object"
    ? safeConfigValue((customerBalance.display_preference as Record<string, unknown>).value)
    : null;
  const customerBalanceOverridable = customerBalance?.display_preference && typeof customerBalance.display_preference === "object"
    && typeof (customerBalance.display_preference as Record<string, unknown>).overridable === "boolean"
    ? (customerBalance.display_preference as Record<string, unknown>).overridable as boolean
    : null;

  return {
    present: true,
    active: configuration.active,
    isDefault: configuration.is_default,
    livemode: configuration.livemode,
    customerBalanceAvailable: typeof customerBalance?.available === "boolean" ? customerBalance.available : null,
    customerBalancePreference,
    customerBalanceValue,
    customerBalanceOverridable,
    methods,
  } satisfies LiveStripeDiagnosticConfiguration;
}

function classifyRootCause(
  configurationValue: "on" | "off" | null,
  configurationAvailable: boolean | null,
  customerBalanceInSession: boolean,
  optionPresent: boolean,
  fundingType: "bank_transfer" | "unknown" | null,
  transferType: LiveStripeDiagnosticBankTransferType,
): {
  case: LiveStripeSessionDiagnosis["case"];
  rootCauseLayer: LiveStripeDiagnosticRootCauseLayer;
  missingStripeFields: string[];
} {
  if (configurationValue === "off") {
    return { case: "A", rootCauseLayer: "LIVE_PAYMENT_METHOD_CONFIGURATION_OFF", missingStripeFields: [] };
  }
  if (configurationValue === "on" && configurationAvailable === false) {
    return { case: "B", rootCauseLayer: "STRIPE_ACCOUNT_METHOD_UNAVAILABLE", missingStripeFields: [] };
  }
  if (configurationValue === "on" && configurationAvailable === true && !customerBalanceInSession) {
    return { case: "C", rootCauseLayer: "STRIPE_DYNAMIC_SESSION_FILTERING", missingStripeFields: [] };
  }
  if (customerBalanceInSession) {
    if (!optionPresent) {
      return { case: "D", rootCauseLayer: "CUSTOMER_BALANCE_SESSION_OPTIONS_MISSING", missingStripeFields: [] };
    }
    if (fundingType === null) {
      return {
        case: "UNKNOWN",
        rootCauseLayer: "STRIPE_API_DOES_NOT_EXPOSE_ENOUGH_DETAIL",
        missingStripeFields: ["payment_method_options.customer_balance.funding_type"],
      };
    }
    if (fundingType !== "bank_transfer") {
      return { case: "D", rootCauseLayer: "CUSTOMER_BALANCE_NOT_CONFIGURED_AS_BANK_TRANSFER", missingStripeFields: [] };
    }
    if (transferType === null) {
      return {
        case: "UNKNOWN",
        rootCauseLayer: "STRIPE_API_DOES_NOT_EXPOSE_ENOUGH_DETAIL",
        missingStripeFields: ["payment_method_options.customer_balance.bank_transfer.type"],
      };
    }
    if (transferType !== "gb_bank_transfer") {
      return { case: "D", rootCauseLayer: "WRONG_BANK_TRANSFER_TYPE", missingStripeFields: [] };
    }
    return { case: "D", rootCauseLayer: "STRIPE_CHECKOUT_DISPLAY_OR_ELIGIBILITY", missingStripeFields: [] };
  }

  const missingStripeFields = [
    ...(configurationValue === null ? ["customerBalanceConfigValue"] : []),
    ...(configurationAvailable === null ? ["customerBalanceConfigAvailable"] : []),
  ];
  return missingStripeFields.length
    ? { case: "UNKNOWN", rootCauseLayer: "STRIPE_API_DOES_NOT_EXPOSE_ENOUGH_DETAIL", missingStripeFields }
    : { case: "UNKNOWN", rootCauseLayer: "UNKNOWN", missingStripeFields: [] };
}

function isSafeIdentifier(value: string) {
  return /^[a-z][a-z0-9_]{0,63}$/.test(value);
}

function safeConfigValue(value: unknown): "on" | "off" | null {
  return value === "on" || value === "off" ? value : null;
}

function safeConfigPreference(value: unknown): "on" | "off" | "none" | null {
  return value === "on" || value === "off" || value === "none" ? value : null;
}

function safeStripeStatus(value: unknown) {
  return typeof value === "string" && /^[a-z_]{1,40}$/.test(value) ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function safeFundingType(value: unknown): "bank_transfer" | "unknown" | null {
  if (value === undefined || value === null) return null;
  return value === "bank_transfer" ? "bank_transfer" : "unknown";
}

function safeBankTransferType(value: unknown): LiveStripeDiagnosticBankTransferType {
  if (value === undefined || value === null) return null;
  switch (value) {
    case "gb_bank_transfer":
    case "eu_bank_transfer":
    case "jp_bank_transfer":
    case "mx_bank_transfer":
    case "us_bank_transfer":
      return value as Exclude<LiveStripeDiagnosticBankTransferType, "unknown" | null>;
    default:
      return "unknown";
  }
}
