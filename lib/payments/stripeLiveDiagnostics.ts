import "server-only";

import Stripe from "stripe";

const TARGET_ORDER_NUMBER = "CNF-260925-9135";
const TARGET_AMOUNT_MINOR = 2300;
const TARGET_CURRENCY = "gbp";
const SESSION_CREATED_FROM = Math.floor(Date.parse("2026-09-25T11:25:00.000Z") / 1000);
const SESSION_CREATED_UNTIL = Math.floor(Date.parse("2026-09-25T11:36:00.000Z") / 1000);
const MAX_LIST_PAGES = 10;
const PAGE_SIZE = 100;

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
  methods: Array<{
    method: string;
    available: boolean;
    displayPreferenceValue: "on" | "off" | null;
  }>;
};

export type LiveStripeSessionDiagnosis = {
  sessionFound: true;
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
  case: "A" | "B" | "C" | "D" | "UNKNOWN";
};

export type LiveStripeSessionDiagnosticResult =
  | { kind: "SESSION_NOT_FOUND" }
  | { kind: "SESSION_AMBIGUOUS" }
  | { kind: "SESSION_SEARCH_LIMIT_EXCEEDED" }
  | { kind: "SESSION_RETRIEVAL_MISMATCH" }
  | { kind: "diagnosed"; diagnosis: LiveStripeSessionDiagnosis };

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
    const page = await stripe.checkout.sessions.list({
      created: { gte: SESSION_CREATED_FROM, lt: SESSION_CREATED_UNTIL },
      limit: PAGE_SIZE,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

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
    if (!lastSession) return { kind: "SESSION_SEARCH_LIMIT_EXCEEDED" };
    startingAfter = lastSession.id;
  }

  if (!completed) return { kind: "SESSION_SEARCH_LIMIT_EXCEEDED" };
  if (matches.length === 0) return { kind: "SESSION_NOT_FOUND" };
  if (matches.length !== 1) return { kind: "SESSION_AMBIGUOUS" };

  const listedSession = matches[0];
  const session = await stripe.checkout.sessions.retrieve(listedSession.id);
  if (
    session.id !== listedSession.id
    || session.created < SESSION_CREATED_FROM
    || session.created >= SESSION_CREATED_UNTIL
    || session.livemode !== true
    || session.mode !== "payment"
    || session.client_reference_id !== TARGET_ORDER_NUMBER
    || session.amount_total !== TARGET_AMOUNT_MINOR
    || session.currency !== TARGET_CURRENCY
  ) return { kind: "SESSION_RETRIEVAL_MISMATCH" };

  const configurationDetailsId = session.payment_method_configuration_details?.id;
  const resolvedConfiguration = await resolvePaymentMethodConfiguration(stripe, configurationDetailsId);
  const paymentMethodTypes = session.payment_method_types.filter(isSafeIdentifier);
  const paymentMethodOptionKeys = Object.keys(session.payment_method_options ?? {}).filter(isSafeIdentifier);
  const customerBalanceInSession = paymentMethodTypes.includes("customer_balance");
  const customerBalance = resolvedConfiguration.configuration?.customer_balance;
  const configurationValue = safeConfigValue(customerBalance?.display_preference?.value);
  const configurationAvailable = typeof customerBalance?.available === "boolean"
    ? customerBalance.available
    : null;

  return {
    kind: "diagnosed",
    diagnosis: {
      sessionFound: true,
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
      case: classifyDiagnosticCase(configurationValue, configurationAvailable, customerBalanceInSession),
    },
  };
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

  return {
    present: true,
    active: configuration.active,
    isDefault: configuration.is_default,
    livemode: configuration.livemode,
    customerBalanceAvailable: typeof customerBalance?.available === "boolean" ? customerBalance.available : null,
    customerBalancePreference,
    customerBalanceValue,
    methods,
  } satisfies LiveStripeDiagnosticConfiguration;
}

function classifyDiagnosticCase(
  configurationValue: "on" | "off" | null,
  configurationAvailable: boolean | null,
  customerBalanceInSession: boolean,
): LiveStripeSessionDiagnosis["case"] {
  if (customerBalanceInSession) return "D";
  if (configurationValue === "off") return "A";
  if (configurationValue === "on" && configurationAvailable === false) return "B";
  if (configurationValue === "on" && configurationAvailable === true) return "C";
  return "UNKNOWN";
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
