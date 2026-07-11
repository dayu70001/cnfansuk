import type { Metadata } from "next";
import Link from "next/link";
import { GuideCta } from "@/components/GuideCta";
import { GuideRelated } from "@/components/GuideRelated";
import { buildGuideMetadata } from "@/lib/seoPage";

export const metadata: Metadata = buildGuideMetadata({
  path: "/cnfans-hoodie-finds",
  title: "CNFans Hoodie Finds UK | Everyday Hoodies & Sets",
  description: "Explore CNFans hoodie finds for UK buyers, including everyday hoodies, sweatshirts and matching sets.",
});

export default function CnfansHoodieFindsPage() {
  return (
    <main className="seo-page">
      <header className="seo-hero">
        <p className="eyebrow">CNFans UK guide</p>
        <h1>CNFans Hoodie Finds UK</h1>
        <p className="seo-lead">
          Your starting point for everyday hoodies. CNFans UK is an independent clothing store and product discovery site,
          and this page rounds up relaxed hoodies, sweatshirts and matching sets that are easy to wear on repeat.
        </p>
      </header>

      <section className="seo-section">
        <h2>Everyday hoodies worth reaching for</h2>
        <p>
          A good hoodie is the piece you keep coming back to. We focus on simple, wearable shapes in colours that go with
          the rest of your wardrobe, rather than loud one-off designs. That means they slot straight into your daily rotation.
        </p>
        <p>
          Browse hoodies and sweatshirts within our <Link href="/category/tops">tops</Link> category, where they sit alongside
          tees and shirts you can layer them over.
        </p>
      </section>

      <section className="seo-section">
        <h2>What makes a good everyday hoodie</h2>
        <p>
          A hoodie you keep reaching for usually gets a few basics right: a comfortable weight of fabric, a hood that sits
          well, cuffs and a hem that hold their shape, and a colour that goes with the rest of your clothes. Get those right
          and the price of the piece matters far less than how often you actually wear it.
        </p>
        <p>
          Heavier cotton feels warmer and more structured, while a lighter loopback is easier to layer and better in milder
          weather. Neither is &ldquo;better&rdquo; &mdash; it just depends on how and when you plan to wear it.
        </p>
      </section>

      <section className="seo-section">
        <h2>Relaxed fits</h2>
        <p>
          Most of our hoodies have a comfortable, relaxed cut. If you like that classic loose look, take your usual size; if
          you prefer something neater, sizing down usually does the trick. Our <Link href="/cnfans-size-guide">size guide</Link> has
          more detail on hoodie fit so you can order with confidence.
        </p>
      </section>

      <section className="seo-section">
        <h2>Seasonal layering</h2>
        <p>
          Hoodies earn their keep all year. On milder days they work on their own; when it turns cold, layer one under a
          jacket for easy warmth. Pair with a <Link href="/cnfans-jacket-finds">jacket</Link> for cooler weather, or keep it simple
          over a tee.
        </p>
      </section>

      <section className="seo-section">
        <h2>Hoodie sets and co-ords</h2>
        <p>
          Want a full look without the effort? A matching hoodie set takes care of it. Browse{" "}
          <Link href="/category/co-ords-sets">co-ords and sets</Link> for hoodie-and-bottom combinations that already work together.
        </p>
      </section>

      <section className="seo-section">
        <h2>Colours that go with everything</h2>
        <p>
          We keep the palette simple on purpose. Blacks, greys, off-whites and muted tones are the ones you end up wearing
          most, because they match whatever else is in your wardrobe. A couple of neutral hoodies will carry you through most
          of the week without any thought at all.
        </p>
        <p>
          If you want one hoodie to start with, a mid-grey or black is the safest pick. From there you can branch out into a
          seasonal colour or a matching set once you know the fit suits you.
        </p>
      </section>

      <section className="seo-section">
        <h2>Looking after your hoodie</h2>
        <p>
          A little care keeps a hoodie looking good for longer. Wash cooler, turn it inside out to protect any print, and dry
          it flat or on a low heat rather than blasting it hot. Heavier cotton hoodies in particular hold their shape far
          better when they are not tumble-dried on high.
        </p>
        <p>
          Following the care label is the short version of all of this. Do that and a good hoodie will stay in your rotation
          season after season.
        </p>
      </section>

      <section className="seo-section">
        <h2>Ready to browse?</h2>
        <p>
          New styles are added in batches, so check <Link href="/category/new-in">New In</Link> for the latest hoodies. If you are
          not sure which size to pick, <Link href="/contact">contact us</Link> before ordering and we will help you choose. It only
          takes a moment and it means you order the right fit first time.
        </p>
      </section>

      <section className="seo-section">
        <h2>Ways to wear a hoodie</h2>
        <p>
          Part of what makes a hoodie so useful is how many ways you can wear it. On its own with jeans or joggers it is the
          easy, everyday option. Layered under a jacket or overshirt it adds warmth without much bulk. And a plain hoodie
          under an open coat is one of the simplest smart-casual looks going.
        </p>
        <p>
          Keep the rest of the outfit simple and a hoodie does the work for you. If you want a fuller look with no thinking
          involved, a matching <Link href="/category/co-ords-sets">hoodie set</Link> pairs the top and bottom for you. Either way,
          a good everyday hoodie tends to become one of the pieces you reach for first.
        </p>
        <p>
          Not sure which shade or weight to start with? Tell us how you plan to wear it and we will suggest a hoodie that
          slots into your week, whether that is a lighter layer for milder days or something warmer for winter.
        </p>
      </section>

      <GuideCta browseHref="/category/tops" browseLabel="Browse Hoodies & Tops" />

      <GuideRelated
        links={[
          { href: "/cnfans-jacket-finds", title: "CNFans Jacket Finds UK", blurb: "Outerwear to layer over your hoodie." },
          { href: "/category/co-ords-sets", title: "Co-ords & Sets", blurb: "Matching hoodie sets for a full look." },
          { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Hoodie fit notes before you order." },
          { href: "/cnfans-finds", title: "CNFans Finds UK", blurb: "See finds across every clothing type." },
        ]}
      />
    </main>
  );
}
