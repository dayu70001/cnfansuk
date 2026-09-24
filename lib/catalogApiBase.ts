const DEFAULT_CATALOG_API_BASE = "https://cnfansuk-catalog-api.dayu70001.workers.dev";

type CatalogApiEnvironment = {
  NODE_ENV?: string;
  STRIPE_BANK_TRANSFER_MODE?: string;
  CATALOG_API_BASE?: string;
  NEXT_PUBLIC_CATALOG_API_BASE?: string;
};

const LOCAL_MOCK_ISOLATION_ERROR =
  "Local Stripe mock isolation is active, but no safe local/test catalog upstream is configured. Set CATALOG_API_BASE or NEXT_PUBLIC_CATALOG_API_BASE to a loopback or .test URL; Production fallback is blocked.";

function isSafeLocalTestApiBase(value: string): boolean {
  try {
    const url = new URL(value);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) return false;

    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
    return hostname === "localhost"
      || hostname.endsWith(".localhost")
      || hostname === "127.0.0.1"
      || hostname === "::1"
      || hostname.endsWith(".test");
  } catch {
    return false;
  }
}

export function resolveCatalogApiBase(env: CatalogApiEnvironment): string {
  const privateBase = env.CATALOG_API_BASE?.trim();
  const publicBase = env.NEXT_PUBLIC_CATALOG_API_BASE?.trim();

  if (env.NODE_ENV === "development" && env.STRIPE_BANK_TRANSFER_MODE === "mock") {
    const explicitBase = privateBase || publicBase;
    if (!explicitBase || !isSafeLocalTestApiBase(explicitBase)) {
      throw new Error(LOCAL_MOCK_ISOLATION_ERROR);
    }
    return explicitBase.replace(/\/+$/, "");
  }

  return (privateBase || publicBase || DEFAULT_CATALOG_API_BASE).replace(/\/+$/, "");
}

/**
 * Resolve the catalogue Worker base URL for both public reads and server-side
 * proxy routes. The private server variable wins, followed by the public
 * deployment variable, and finally the known CNFans Worker endpoint.
 */
export function getCatalogApiBase(): string {
  return resolveCatalogApiBase(process.env);
}

export { DEFAULT_CATALOG_API_BASE };
