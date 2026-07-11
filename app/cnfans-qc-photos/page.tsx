import type { Metadata } from "next";
import Link from "next/link";
import { GuideCta } from "@/components/GuideCta";
import { GuideRelated } from "@/components/GuideRelated";
import { buildGuideMetadata } from "@/lib/seoPage";

export const metadata: Metadata = buildGuideMetadata({
  path: "/cnfans-qc-photos",
  title: "CNFans QC Photos Guide | How to Check Clothing Before Ordering",
  description:
    "Learn how CNFans UK buyers can review product details, sizing, materials and photos before choosing clothing styles.",
});

export default function CnfansQcPhotosPage() {
  return (
    <main className="seo-page">
      <header className="seo-hero">
        <p className="eyebrow">CNFans UK guide</p>
        <h1>CNFans QC Photos Guide</h1>
        <p className="seo-lead">
          &ldquo;QC&rdquo; simply means quality check. CNFans UK is an independent clothing store and product discovery site,
          and this guide shows how to check the photos and details on a product page so you feel confident before you order.
        </p>
      </header>

      <section className="seo-section">
        <h2>What checking photos means here</h2>
        <p>
          Here, checking simply means having a good look at a product page before you buy. Everything you need is on the page
          itself: every style shows photos and a description, so you can look closely and decide before you order rather than
          after.
        </p>
        <p>
          Think of it as a quick once-over. Spend a minute looking at the images and reading the details, and you will avoid
          most surprises.
        </p>
      </section>

      <section className="seo-section">
        <h2>Why it is worth a minute</h2>
        <p>
          Buying clothing online always involves a little trust, but a careful look at the product page removes most of the
          uncertainty. The details are there for a reason: they tell you how a piece is likely to fit, feel and wear. Reading
          them properly is the difference between a piece you love and one that sits unworn.
        </p>
        <p>
          The checks below only take a moment each, and they quickly become second nature once you have done them a few times.
        </p>
      </section>

      <section className="seo-section">
        <h2>Size</h2>
        <p>
          Size is the number one thing to check. Look at the fit described on the page, then compare it with our{" "}
          <Link href="/cnfans-size-guide">size guide</Link>. Hoodies and jackets often have a relaxed cut, so if you prefer a
          closer fit you may want to size down.
        </p>
      </section>

      <section className="seo-section">
        <h2>Fabric</h2>
        <p>
          Read the description for the material and weight. A heavier fabric feels warmer and more structured; a lighter one
          is better for layering. If the feel of a fabric matters to you, this is worth a second look before ordering.
        </p>
      </section>

      <section className="seo-section">
        <h2>Colour</h2>
        <p>
          Screens vary, so colours can look slightly different in real life. Check the product photos in more than one image
          if available, and pick the shade name that matches what you want. If you are unsure, ask us and we will describe it
          honestly.
        </p>
      </section>

      <section className="seo-section">
        <h2>Stitching and finish</h2>
        <p>
          Zoom in on the photos to see seams, cuffs, hems and any prints or trims. Neat, even stitching and tidy edges are a
          good sign of a garment that will hold up to everyday wear and washing.
        </p>
      </section>

      <section className="seo-section">
        <h2>Fit notes</h2>
        <p>
          Finally, picture how the piece fits into your wardrobe. Will it layer over a tee, or under a jacket? Does it match
          something you already own? A quick think here makes an item much more likely to earn its place.
        </p>
        <p>
          Still not sure after checking everything? <Link href="/contact">Contact us</Link> before you order and we will help. When
          you are ready, browse the latest <Link href="/cnfans-finds">finds</Link> and open any style to run through these checks.
        </p>
      </section>

      <section className="seo-section">
        <h2>A quick checklist before you order</h2>
        <p>Run through this short list on any product page and you will rarely be caught out:</p>
        <ul>
          <li>Is the size right for how you like to wear it?</li>
          <li>Does the fabric and weight suit the season?</li>
          <li>Is the colour the shade you actually want?</li>
          <li>Do the seams, cuffs and hems look neat in the photos?</li>
          <li>Does it go with something you already own?</li>
        </ul>
        <p>
          If you can tick all five, you are ready to add it to your bag with confidence. If one is a maybe, that is your cue
          to ask us before ordering rather than after.
        </p>
      </section>

      <section className="seo-section">
        <h2>Comparing similar styles</h2>
        <p>
          If two styles look close, put their product pages side by side and read the details on each. Small differences in
          fabric, weight or cut can matter more than they first appear, and comparing them yourself is the best way to pick
          the one that suits you. There is no rush to decide &mdash; the information stays on the page for you to check again.
        </p>
        <p>
          All of this is something you do as the buyer, before you order, using the photos and details we publish. The aim is
          to give you clear, honest product information up front &mdash; size, fabric, colour, stitching and fit &mdash; so you
          can judge a piece for yourself. If anything is missing or unclear, <Link href="/contact">ask us</Link> and we will describe
          it as plainly as we can.
        </p>
      </section>

      <GuideCta />

      <GuideRelated
        links={[
          { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Fit notes for hoodies, jackets, tops and bottoms." },
          { href: "/cnfans-finds", title: "CNFans Finds UK", blurb: "Browse styles and open a product page to check." },
          { href: "/how-to-order", title: "How to Order", blurb: "The full ordering process, step by step." },
          { href: "/category/new-in", title: "New In", blurb: "See the latest arrivals to check and choose." },
        ]}
      />
    </main>
  );
}
