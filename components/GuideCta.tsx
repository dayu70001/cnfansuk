import Link from "next/link";
import { fetchSiteSettings } from "@/lib/siteSettings";

// Shared call-to-action row for the CNFans UK guide pages.
// Always offers "Browse New In" and an internal "Contact us" link; the
// WhatsApp button is only shown when a support number is configured.
export async function GuideCta({ browseHref = "/category/new-in", browseLabel = "Browse New In" }: { browseHref?: string; browseLabel?: string }) {
  const { links } = await fetchSiteSettings();
  const whatsapp = links.personalWhatsappUrl?.trim();

  return (
    <div className="seo-cta">
      <Link className="btn btn-solid" href={browseHref}>
        {browseLabel}
      </Link>
      <Link className="btn btn-ghost" href="/contact">
        Contact us
      </Link>
      {whatsapp ? (
        <a className="btn btn-ghost" href={whatsapp} target="_blank" rel="noreferrer">
          Message us on WhatsApp
        </a>
      ) : null}
    </div>
  );
}
