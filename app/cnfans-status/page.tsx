import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { buildGuideMetadata, buildGuidePageSchemas } from "@/lib/seoPage";

const pageDescription =
  "Looking for a CNFans status update? See what we could verify about CNFans.com, why a failed link does not prove closure, and independent UK clothing options.";

export const metadata: Metadata = buildGuideMetadata({
  path: "/cnfans-status",
  title: "Is CNFans Down? Website Status & Updates",
  description: pageDescription,
});

const checkedDate = "2026-11-28";
const questions = [
  {
    question: "Can we confirm that CNFans.com has shut down?",
    answer:
      "A 502 response from our external page-check service does not establish permanent closure. Check CNFans.com and announcements from its operator for the latest information.",
  },
  {
    question: "What should I do if a CNFans product link does not open?",
    answer:
      "A product link may have moved, expired or encountered a temporary access issue. Check the original source and current listing details; a failed link alone does not prove that a whole website is offline.",
  },
];

const schemas = [
  ...buildGuidePageSchemas({
    path: "/cnfans-status",
    name: "CNFans Website Status",
    description: pageDescription,
  }),
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  },
];

export default function CnfansStatusPage() {
  return (
    <main className="seo-page">
      <JsonLd data={schemas} />
      <header className="seo-hero">
        <p className="eyebrow">CNFANS UK information</p>
        <h1>Is CNFans Down? What We Know About the Website Status</h1>
        <p className="seo-lead">
          On 28 November 2026, an external page-check service received a 502 Bad Gateway response from CNFans.com. This
          page records that check and explains what it can—and cannot—tell you.
        </p>
      </header>

      <section className="seo-section" aria-labelledby="current-status-heading">
        <h2 id="current-status-heading">Current CNFans Website Status</h2>
        <p>
          <strong>Last checked: <time dateTime={checkedDate}>28 November 2026</time>.</strong> An external page-check
          request to <a href="https://cnfans.com/" target="_blank" rel="noreferrer">CNFans.com</a> returned a 502 Bad
          Gateway. That is the response seen by this checking service; it does not establish whether other visitors can
          connect, why the request failed or whether the service has closed.
        </p>
        <p>
          We could not verify an official status announcement during this check. For account or order information, use the
          original service&rsquo;s own website and verified communication channels. Do not share login or recovery details with
          an unrelated site.
        </p>
      </section>

      <section className="seo-section">
        <h2>What happened to CNFans?</h2>
        <p>
          A 502 means the checking service did not receive a successful response through the gateway it contacted. We have
          no verified statement from the operator explaining the cause or scope of this response.
        </p>
        <p>
          If you are troubleshooting a saved product URL, read our guide to{" "}
          <Link href="/cnfans-dead-links">CNFans links that stop working</Link>. It covers moved listings, expired links
          and temporary access problems separately.
        </p>
      </section>

      <section className="seo-section">
        <h2>Has CNFans shut down permanently?</h2>
        <p>
          The 502 response recorded above does not establish permanent closure. Check the original service and its verified
          announcements for newer information.
        </p>
      </section>

      <section className="seo-section">
        <h2>Is CNFANS UK the same website as CNFans.com?</h2>
        <p>
          No. CNFANS.co.uk is an independent clothing retailer with its own catalogue, customer service and order process.
          It is not an official replacement or successor to CNFans.com. CNFANS.co.uk cannot sign in to or retrieve another
          service&rsquo;s account, wallet, warehouse stock, refund or order history.
        </p>
      </section>

      <section className="seo-section">
        <h2>Independent clothing shopping options</h2>
        <p>
          If you are looking for a separate way to shop for clothes, read about the{" "}
          <Link href="/cnfans-alternative">CNFANS.co.uk direct-shopping model</Link>, browse the current{" "}
          <Link href="/category/new-in">clothing catalogue</Link>, or explore the <Link href="/cnfans-spreadsheet">CNFans spreadsheet guide</Link>.
        </p>
      </section>

      <section className="seo-section" id="frequently-asked-questions">
        <h2>Frequently Asked Questions</h2>
        {questions.map(({ question, answer }) => (
          <article key={question}>
            <h3>{question}</h3>
            <p>{answer}</p>
          </article>
        ))}
      </section>

      <section className="seo-section">
        <h2>Sources and last checked date</h2>
        <p>
          Source: an external page-check request to <a href="https://cnfans.com/" target="_blank" rel="noreferrer">CNFans.com</a>,
          which returned 502 Bad Gateway on <time dateTime={checkedDate}>28 November 2026</time>. This page reports that
          observation only, not a confirmed service-wide status.
        </p>
      </section>
    </main>
  );
}
