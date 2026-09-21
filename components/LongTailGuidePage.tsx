import Link from "next/link";
import type { ReactNode } from "react";
import { GuideCta } from "@/components/GuideCta";
import { GuideRelated } from "@/components/GuideRelated";
import { JsonLd } from "@/components/JsonLd";
import { buildGuidePageSchemas } from "@/lib/seoPage";
import type { LongTailGuide } from "@/lib/phaseFourGuides";

export function LongTailGuidePage({ guide }: { guide: LongTailGuide }) {
  return (
    <main className="seo-page seo-longtail-page">
      <JsonLd data={buildGuidePageSchemas({ path: guide.path, name: guide.h1, description: guide.description })} />
      <header className="seo-hero">
        <p className="eyebrow">CNFans UK clothing guide</p>
        <h1>{guide.h1}</h1>
        <p className="seo-lead">{guide.intro}</p>
      </header>

      {guide.sections.map((section) => (
        <section className="seo-section" key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{renderGuideText(paragraph)}</p>)}
          {section.items ? (
            <ul>
              {section.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
        </section>
      ))}

      <section className="seo-section seo-longtail-note">
        <h2>Keep the decision practical</h2>
        <p>{renderGuideText(guide.note)}</p>
      </section>

      <GuideCta browseHref={guide.browseHref || "/category/new-in"} browseLabel={guide.browseLabel || "Browse New In"} />
      <GuideRelated links={guide.related} />
    </main>
  );
}

function renderGuideText(text: string) {
  const parts: ReactNode[] = [];
  const linkPattern = /<a href="(\/[^\"]+)">([^<]+)<\/a>/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(text))) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    parts.push(<Link href={match[1]} key={`${match[1]}-${match.index}`}>{match[2]}</Link>);
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}
