const DEFAULT_CATALOG_API_BASE = "https://cnfansuk-catalog-api.dayu70001.workers.dev";

/**
 * Resolve the catalogue Worker base URL for both public reads and server-side
 * proxy routes. The private server variable wins, followed by the public
 * deployment variable, and finally the known CNFans Worker endpoint.
 */
export function getCatalogApiBase(): string {
  return (
    process.env.CATALOG_API_BASE?.trim() ||
    process.env.NEXT_PUBLIC_CATALOG_API_BASE?.trim() ||
    DEFAULT_CATALOG_API_BASE
  ).replace(/\/+$/, "");
}

export { DEFAULT_CATALOG_API_BASE };
