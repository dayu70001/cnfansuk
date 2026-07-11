import Link from "next/link";

export type RelatedLink = { href: string; title: string; blurb: string };

// Internal-linking block shown at the foot of each guide page.
export function GuideRelated({ heading = "Related CNFans UK guides", links }: { heading?: string; links: RelatedLink[] }) {
  return (
    <nav className="seo-related" aria-label={heading}>
      <h2>{heading}</h2>
      <div className="seo-related-grid">
        {links.map((link) => (
          <Link href={link.href} key={link.href}>
            <strong>{link.title}</strong>
            <span>{link.blurb}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
