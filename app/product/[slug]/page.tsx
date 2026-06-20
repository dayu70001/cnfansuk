import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { getProduct } from "@/data/products";
import { fetchCatalogProductBySlug } from "@/lib/catalogApi";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = (await fetchCatalogProductBySlug(slug)) || getProduct(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
