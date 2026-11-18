export type DuplicateProductLike = {
  id: number | string;
  product_code: string;
  title: string;
  category?: string | null;
  subcategory?: string | null;
};

export type DuplicateTitleGroup<T extends DuplicateProductLike = DuplicateProductLike> = {
  key: string;
  title: string;
  count: number;
  kind: "exact" | "normalized";
  rawTitles: string[];
  productIds: Array<number | string>;
  productCodes: string[];
  products: T[];
};

/** Normalize only presentation differences; meaningful title tokens are retained. */
export function normalizeProductTitle(title: string): string {
  return title
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function buildDuplicateTitleGroups<T extends DuplicateProductLike>(products: T[]): DuplicateTitleGroup<T>[] {
  const buckets = new Map<string, T[]>();
  for (const product of products) {
    const key = normalizeProductTitle(product.title || "");
    if (!key) continue;
    const bucket = buckets.get(key) || [];
    bucket.push(product);
    buckets.set(key, bucket);
  }

  return Array.from(buckets, ([key, members]) => {
    if (members.length < 2) return null;
    const titleCounts = new Map<string, number>();
    for (const member of members) titleCounts.set(member.title, (titleCounts.get(member.title) || 0) + 1);
    const rawTitles = Array.from(titleCounts.keys()).sort((a, b) => a.localeCompare(b, "en"));
    const title = rawTitles.slice().sort((a, b) =>
      (titleCounts.get(b) || 0) - (titleCounts.get(a) || 0) || a.localeCompare(b, "en"))[0];
    return {
      key,
      title,
      count: members.length,
      kind: rawTitles.length === 1 ? "exact" as const : "normalized" as const,
      rawTitles,
      productIds: members.map((product) => product.id),
      productCodes: members.map((product) => product.product_code),
      products: members,
    };
  })
    .filter((group): group is DuplicateTitleGroup<T> => group !== null)
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, "en"));
}

export function countExactTitleGroups(products: DuplicateProductLike[]): number {
  const counts = new Map<string, number>();
  for (const product of products) counts.set(product.title, (counts.get(product.title) || 0) + 1);
  return Array.from(counts.values()).filter((count) => count > 1).length;
}
