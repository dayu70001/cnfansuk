import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { JsonLd } from "@/components/JsonLd";
import { fetchCatalogProductBySlug } from "@/lib/catalogApi";
import { getCategory } from "@/data/categories";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Product pages are stable SEO pages and do not need ten-minute regeneration.
export const revalidate = 21600;

async function resolveProduct(slug: string) {
  return fetchCatalogProductBySlug(slug);
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await resolveProduct(slug);

  if (!product) {
    return {
      title: { absolute: `Product Not Found | ${SITE_NAME}` },
      robots: { index: false, follow: false },
    };
  }

  const title = product.name;
  const description =
    product.shortDescription ||
    `Shop ${product.name} from CNFans UK. Everyday apparel with size support and UK / Europe delivery options.`;
  const canonical = `${SITE_URL}/product/${product.slug}`;
  const image = product.images[0];

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: product.name,
      description,
      url: canonical,
      ...(image ? { images: [image] } : {}),
      type: "website",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await resolveProduct(slug);

  if (!product) {
    notFound();
  }

  const canonical = `${SITE_URL}/product/${product.slug}`;
  const image = product.images[0];
  const description = product.description || product.shortDescription || product.name;
  const category = getCategory(product.category);

  // Product schema: use the catalog brand when it is available; do not add
  // aggregateRating/review fields unless they come from real customer data.
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.images.length ? { image: product.images } : {}),
    description,
    sku: product.id,
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: "GBP",
      price: product.priceGBP,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  // Breadcrumb: Home > Category > Product
  const breadcrumbItems = [
    { name: "Home", url: SITE_URL },
    ...(category
      ? [{ name: category.name, url: `${SITE_URL}/category/${product.category}` }]
      : []),
    { name: product.name, url: canonical },
  ];
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <ProductDetailClient product={product} />
    </>
  );
}
