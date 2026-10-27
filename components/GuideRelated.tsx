import Link from "next/link";
import { formatVisibleBrandName } from "@/lib/visibleBrandName";

export type RelatedLink = { href: string; title: string; blurb: string };

// Internal-linking block shown at the foot of each guide page.
export function GuideRelated({ heading = "Related CNFANS UK guides", links }: { heading?: string; links: RelatedLink[] }) {
  return (
    <nav className="seo-related" aria-label={formatVisibleBrandName(heading)}>
      <h2>{formatVisibleBrandName(heading)}</h2>
      <div className="seo-related-grid">
        {links.map((link) => (
          <Link href={link.href} key={link.href}>
            <strong>{formatVisibleBrandName(link.title)}</strong>
            <span>{formatVisibleBrandName(link.blurb)}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
