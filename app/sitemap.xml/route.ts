import { fetchSitemapCatalogSnapshot } from "@/lib/catalogApi";
import { buildSitemapEntries, SITEMAP_STATIC_MANIFEST_HASH, SitemapProtocolError, validateSitemapXml } from "@/lib/sitemap";
import { SitemapSnapshotError } from "@/lib/sitemapSnapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SNAPSHOT_AGE_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const snapshot = await fetchSitemapCatalogSnapshot(SITEMAP_STATIC_MANIFEST_HASH);
    if (snapshot.totalCount === 0) throw new SitemapSnapshotError("empty_catalog_rejected");
    const ageMs = Date.now() - Date.parse(snapshot.generatedAt);
    if (ageMs < -5 * 60 * 1000 || ageMs > MAX_SNAPSHOT_AGE_MS) {
      throw new SitemapSnapshotError("snapshot_age_exceeded");
    }
    const entries = buildSitemapEntries(snapshot);
    const { xml } = validateSitemapXml(entries);
    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    const reason = error instanceof SitemapSnapshotError
      ? error.code
      : error instanceof SitemapProtocolError
        ? error.code
      : error instanceof Error && /^sitemap_catalog_[a-z_]+$/.test(error.message)
        ? error.message
        : "sitemap_generation_failed";
    console.error(JSON.stringify({
      event: "sitemap_generation_failed",
      reason,
      ...(error instanceof SitemapProtocolError ? { url_count: error.urlCount, xml_bytes: error.xmlBytes } : {}),
    }));
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><error>Temporarily unavailable</error>',
      {
        status: 503,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "no-store",
          "Retry-After": "60",
        },
      },
    );
  }
}
