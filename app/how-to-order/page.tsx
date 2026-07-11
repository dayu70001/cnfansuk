import type { Metadata } from "next";
import Link from "next/link";
import { GuideCta } from "@/components/GuideCta";
import { GuideRelated } from "@/components/GuideRelated";
import { buildGuideMetadata } from "@/lib/seoPage";

export const metadata: Metadata = buildGuideMetadata({
  path: "/how-to-order",
  title: "How to Order from CNFans UK | Simple Step-by-Step Guide",
  description:
    "Learn how to order from CNFans UK, choose clothing styles, check size information and contact the team before placing an order.",
});

const steps = [
  {
    number: "01",
    title: "Browse products",
    body: "Start with New In or a category like tops, bottoms or outerwear. Open any style to see its photos and details.",
  },
  {
    number: "02",
    title: "Check size and style details",
    body: "Read the description and our size guide, and note the colour and fit before you decide. This is the step that saves most returns.",
  },
  {
    number: "03",
    title: "Contact us if unsure",
    body: "Between sizes or not sure a style will suit you? Message us first. A quick question now beats guessing at checkout.",
  },
  {
    number: "04",
    title: "Place your order",
    body: "Add your items to the bag, enter your delivery details and complete checkout. You will get an order number to keep.",
  },
  {
    number: "05",
    title: "Track your delivery",
    body: "We prepare and dispatch your order, then share tracking when it is available. Follow updates through your order number.",
  },
];

export default function HowToOrderPage() {
  return (
    <main className="seo-page">
      <header className="seo-hero">
        <p className="eyebrow">CNFans UK guide</p>
        <h1>How to Order from CNFans UK</h1>
        <p className="seo-lead">
          Ordering is straightforward. CNFans UK is an independent clothing store and product discovery site, and these five
          simple steps take you from browsing to tracking your parcel.
        </p>
      </header>

      <section className="seo-section">
        <ol className="seo-steps">
          {steps.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="seo-section">
        <h2>Before you order</h2>
        <p>
          Two things make the biggest difference: getting the size right and having your delivery details correct. Take a
          moment to read the <Link href="/cnfans-size-guide">size guide</Link> and double-check your name, address, postcode and
          phone number at checkout.
        </p>
        <p>
          If anything is unclear, <Link href="/contact">contact us</Link> before ordering. We would rather answer a question early
          than sort out a swap later.
        </p>
      </section>

      <section className="seo-section">
        <h2>Why these steps matter</h2>
        <p>
          Most problems with online clothing orders come down to two things: the wrong size, or a small mistake in the
          delivery details. The steps above are built to catch both before they cost you time. A minute spent checking the
          fit and your address is the easiest way to make sure the parcel that arrives is the one you wanted.
        </p>
        <p>
          There is no rush. Take your time browsing, save anything you like, and come back when you are ready. Styles are
          added in batches, so if something is not quite right today there is usually more to see soon on the{" "}
          <Link href="/category/new-in">New In</Link> page.
        </p>
      </section>

      <section className="seo-section">
        <h2>Before you commit to a size</h2>
        <p>
          If there is one place to slow down, it is sizing. Compare the fit described on the product page with a garment you
          already own and like, and have a quick read of our <Link href="/cnfans-size-guide">size guide</Link> for the style you are
          buying. Hoodies and jackets in particular can have a relaxed cut, so a moment here saves a lot of hassle later.
        </p>
      </section>

      <section className="seo-section">
        <h2>At the checkout</h2>
        <p>
          When you are ready, add your items to the bag and open the checkout. You will enter your delivery name, address,
          city, postcode, country and a contact number so we can keep you updated. Double-check these before you confirm
          &mdash; a correct postcode and phone number help your parcel move smoothly.
        </p>
        <p>
          After you place the order, an order number is shown on screen. Keep it somewhere safe; it is the quickest reference
          if you ever need to ask us about your order.
        </p>
      </section>

      <section className="seo-section">
        <h2>After you order</h2>
        <p>
          Keep the order number shown after checkout &mdash; it helps us find your details quickly. Your order is prepared
          and dispatched, and tracking is shared when the courier provides it. For timings and what to do if a parcel is
          delayed, see the <Link href="/cnfans-delivery-uk">delivery guide</Link>.
        </p>
      </section>

      <section className="seo-section">
        <h2>Common questions before ordering</h2>
        <p>
          <strong>Can I change my order after checkout?</strong> If you spot a mistake, message us straight away with your
          order number. We cannot promise a change once an order is being prepared, but we will always try to help if you
          catch it early.
        </p>
        <p>
          <strong>What if my size is wrong when it arrives?</strong> This is exactly why the size step matters. If a fit is
          not right, get in touch and we will talk through the options with you. Reading the size guide first is the surest
          way to avoid this.
        </p>
        <p>
          <strong>How do I keep track of my order?</strong> Hold on to the order number from checkout and follow updates
          through the track order page. It is the quickest reference if you ever need to ask us anything.
        </p>
        <p>
          <strong>Not sure a style will suit you?</strong> That is a good reason to message us before ordering rather than
          after. A quick description of what you are after helps us point you towards the right piece, and it saves you the
          hassle of guessing at checkout.
        </p>
      </section>

      <GuideCta browseLabel="Start browsing" />

      <GuideRelated
        links={[
          { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Fit notes for hoodies, jackets, tops and bottoms." },
          { href: "/cnfans-delivery-uk", title: "CNFans UK Delivery Guide", blurb: "Timings, tracking and order updates." },
          { href: "/contact", title: "Contact CNFans UK", blurb: "Ask about sizing or an existing order." },
          { href: "/cnfans-finds", title: "CNFans Finds UK", blurb: "Browse hoodies, jackets, tops and sets." },
        ]}
      />
    </main>
  );
}
