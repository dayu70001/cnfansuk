import { NextRequest, NextResponse } from "next/server";
import { fetchCatalogSizeOptionsBySlug } from "@/lib/catalogApi";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim() || "";
  if (!slug || slug.length > 180 || !/^[a-z0-9_-]+$/i.test(slug)) {
    return NextResponse.json({ error: "Invalid product identifier." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const sizes = await fetchCatalogSizeOptionsBySlug(slug);
  if (!sizes) {
    return NextResponse.json({ error: "Product not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json({ sizes }, { headers: { "Cache-Control": "no-store" } });
}
