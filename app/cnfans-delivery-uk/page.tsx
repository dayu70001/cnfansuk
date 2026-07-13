import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { GuideCta } from "@/components/GuideCta";
import { GuideRelated } from "@/components/GuideRelated";
import { buildGuideMetadata, buildGuidePageSchemas } from "@/lib/seoPage";

export const metadata: Metadata = buildGuideMetadata({
  path: "/cnfans-delivery-uk",
  title: "CNFans UK Delivery Guide | Shipping, Tracking & Order Updates",
  description:
    "Read the CNFans UK delivery guide, including estimated delivery time, order updates, tracking and support for UK clothing orders.",
});

export default function CnfansDeliveryUkPage() {
  return (
    <main className="seo-page">
      <JsonLd data={buildGuidePageSchemas({ path: "/cnfans-delivery-uk", name: "CNFans UK Delivery Guide", description: "A practical guide to delivery timings, tracking and order updates for CNFans UK shoppers." })} />
      <header className="seo-hero">
        <p className="eyebrow">CNFans UK guide</p>
        <h1>CNFans UK Delivery Guide</h1>
        <p className="seo-lead">
          Everything you need to know about getting your order. CNFans UK is an independent clothing store and product
          discovery site, and this guide covers timings, processing, tracking and what to do if a parcel runs late.
        </p>
      </header>

      <section className="seo-section">
        <h2>Estimated UK delivery time</h2>
        <p>
          Delivery times depend on the item, the courier route and local processing, so we give a realistic window rather
          than a promise we cannot keep. Most UK orders arrive within a couple of weeks once dispatched, though busy periods
          can add a few days.
        </p>
        <p>
          If you need an item by a particular date, <Link href="/contact">contact us</Link> before ordering and we will give you
          an honest idea of timing.
        </p>
      </section>

      <section className="seo-section">
        <h2>Order processing</h2>
        <p>
          After checkout we review your order details, check the item and prepare it for dispatch. This short processing
          step happens before your parcel leaves, and it is worth making sure your name, address, postcode and phone number
          are correct so nothing is held up.
        </p>
        <p>
          You will receive an order number at checkout. Keep it safe &mdash; it is the quickest way for us to find your
          details if you get in touch.
        </p>
      </section>

      <section className="seo-section">
        <h2>Planning around delivery</h2>
        <p>
          If you are ordering for a particular date &mdash; a birthday, a trip or a change of season &mdash; it pays to order
          a little early and allow some breathing room. Busy shopping periods and bank holidays can add a few days to normal
          timings, so a small buffer takes the pressure off.
        </p>
        <p>
          Not in a rush? Then there is nothing to do but wait for your tracking. We will keep things moving at our end and
          share updates as they become available.
        </p>
      </section>

      <section className="seo-section">
        <h2>Tracking updates</h2>
        <p>
          Once your order is dispatched, tracking details are shared as soon as the courier makes them available. Tracking
          can take a short while to start updating after a parcel is collected, which is normal and does not mean anything
          is wrong.
        </p>
        <p>
          You can also follow your order using the <Link href="/track-order">track order</Link> page. If your tracking has not
          moved for several days, get in touch and we will look into it.
        </p>
      </section>

      <section className="seo-section">
        <h2>What to do if delivery is delayed</h2>
        <p>Delays happen from time to time. If your parcel is running late, here is the simple order to work through:</p>
        <ul>
          <li>Check your tracking for the latest scan or update.</li>
          <li>Allow a little extra time during busy periods and around bank holidays.</li>
          <li>Make sure someone can receive the parcel, or that a safe place is available.</li>
          <li>If it still has not arrived, message us with your order number and we will help.</li>
        </ul>
      </section>

      <section className="seo-section">
        <h2>Questions about an order</h2>
        <p>
          For anything to do with an existing order, our <Link href="/contact">contact</Link> page is the best place to start.
          Include your order number and, if it helps, the product name so we can find it faster. New to ordering? Our{" "}
          <Link href="/how-to-order">how to order</Link> guide walks through the whole process.
        </p>
      </section>

      <section className="seo-section">
        <h2>Getting your address right</h2>
        <p>
          The single biggest thing you can do to help delivery run smoothly is to enter your details correctly. Check your
          house number and street, that your postcode is spelled properly, and that your phone number is one the courier can
          reach you on. A small typo in an address is one of the most common causes of a delayed parcel.
        </p>
        <p>
          If you spot a mistake straight after ordering, message us as soon as you can with your order number and we will do
          our best to update it before dispatch.
        </p>
      </section>

      <section className="seo-section">
        <h2>Receiving your parcel</h2>
        <p>
          When your parcel is out for delivery, it helps to have a plan for receiving it. If you will not be in, most
          couriers let you leave a safe-place note or nominate a neighbour, and many offer a redelivery or a nearby
          collection point if the first attempt is missed.
        </p>
        <p>
          Keep an eye on your tracking messages on the day, as they often give a delivery window. If a parcel is marked as
          delivered but you cannot find it, check any safe place or with neighbours first, then <Link href="/contact">contact
          us</Link> with your order number so we can look into it. A little planning at this stage means your order reaches you
          without any fuss.
        </p>
      </section>

      <GuideCta browseLabel="Browse New In" />

      <GuideRelated
        links={[
          { href: "/track-order", title: "Track Order", blurb: "Follow your order once it has been dispatched." },
          { href: "/how-to-order", title: "How to Order", blurb: "A simple step-by-step ordering guide." },
          { href: "/contact", title: "Contact CNFans UK", blurb: "Ask about an existing order or delivery." },
          { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Get the size right before you order." },
        ]}
      />
    </main>
  );
}
