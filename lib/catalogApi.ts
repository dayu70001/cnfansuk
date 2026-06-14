const DEFAULT_CATALOG_API_BASE = "https://api.cnfans.co.uk";

export const catalogApiBase =
  process.env.NEXT_PUBLIC_CATALOG_API_BASE || DEFAULT_CATALOG_API_BASE;

export function catalogApiUrl(path: string): string {
  const normalisedPath = path.startsWith("/") ? path : `/${path}`;
  return `${catalogApiBase.replace(/\/+$/, "")}${normalisedPath}`;
}

