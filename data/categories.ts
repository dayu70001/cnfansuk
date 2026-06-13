import type { Category } from "@/lib/types";

export const categories: Category[] = [
  { slug: "new-in", name: "New In", description: "Latest arrivals across apparel, sets and daily essentials.", tone: "graphite" },
  { slug: "outerwear", name: "Outerwear", description: "Jackets and coats selected for everyday city layering.", tone: "charcoal" },
  { slug: "tops", name: "Tops", description: "Hoodies, sweatshirts, tees and shirts for clean daily outfits.", tone: "forest" },
  { slug: "bottoms", name: "Bottoms", description: "Jeans, trousers and shorts selected for clean everyday styling.", tone: "ink" },
  { slug: "co-ords-sets", name: "Co-ords & Sets", description: "Matching sets and tracksuits for a clean, complete look.", tone: "navy" },
  { slug: "hoodies", name: "Hoodies", description: "Hoodies, sweatshirts, tees and shirts for clean daily outfits.", tone: "forest" },
  { slug: "tracksuits", name: "Tracksuits", description: "Matching sets and tracksuits for a clean, complete look.", tone: "navy" },
  { slug: "t-shirts", name: "T-Shirts", description: "Hoodies, sweatshirts, tees and shirts for clean daily outfits.", tone: "stone" },
  { slug: "jackets", name: "Jackets", description: "Jackets and coats selected for everyday city layering.", tone: "charcoal" },
  { slug: "jeans-trousers", name: "Jeans & Trousers", description: "Jeans, trousers and shorts selected for clean everyday styling.", tone: "ink" },
  { slug: "sets", name: "Sets", description: "Matching sets and tracksuits for a clean, complete look.", tone: "moss" },
];

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}
