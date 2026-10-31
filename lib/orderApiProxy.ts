import { getCatalogApiBase } from "@/lib/catalogApiBase";

type Environment = Readonly<Record<string, string | undefined>>;

export type OrderApiTarget =
  | { ok: true; baseUrl: string }
  | { ok: false; status: number; error: string };

export function resolveOrderApiTarget(request: Request, env: Environment = process.env): OrderApiTarget {
  if (env.NODE_ENV !== "development") {
    return { ok: true, baseUrl: getCatalogApiBase() };
  }

  if (!isLoopbackRequest(request)) {
    return { ok: false, status: 403, error: "Order service is unavailable." };
  }

  const localBaseUrl = env.LOCAL_ORDER_API_BASE?.trim();
  if (!localBaseUrl || !isSafeLocalOrderApiBase(localBaseUrl)) {
    return { ok: false, status: 503, error: "Local order service is not configured." };
  }

  return { ok: true, baseUrl: localBaseUrl.replace(/\/+$/, "") };
}

function isLoopbackRequest(request: Request) {
  try {
    if (!isLoopbackHostname(new URL(request.url).hostname)) return false;
    const requestHost = request.headers.get("host");
    if (requestHost && !isLoopbackHostname(new URL(`http://${requestHost}`).hostname)) return false;
    const origin = request.headers.get("origin");
    return !origin || isLoopbackHostname(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function isLoopbackHostname(hostname: string) {
  const normalisedHostname = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return new Set(["localhost", "127.0.0.1", "::1"]).has(normalisedHostname);
}

function isSafeLocalOrderApiBase(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:"
      && !url.username
      && !url.password
      && !url.search
      && !url.hash
      && isLoopbackHostname(url.hostname);
  } catch {
    return false;
  }
}
