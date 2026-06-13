import Link from "next/link";
import { Category } from "@/lib/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link className="cat-card" href={`/category/${category.slug}`}>
      <div className="frame">
        <div className={`cat-fill tone-${category.tone}`} />
      </div>
      <span className="name">{category.name === "Jeans & Trousers" ? "Trousers" : category.name}</span>
    </Link>
  );
}
