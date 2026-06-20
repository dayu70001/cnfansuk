"use client";

import { FormEvent, useEffect, useState } from "react";

type AdminImage = { imageUrl?: string; image_url?: string };
type AdminProduct = {
  product_code: string;
  slug: string;
  title: string;
  category: string;
  subcategory: string | null;
  brand: string | null;
  images?: AdminImage[];
};
type SubcategoryOption = { category: string; subcategory: string };
type ProductSearchResult = {
  products?: AdminProduct[];
  categories?: string[];
  subcategories?: SubcategoryOption[];
  error?: string;
};

const categoryLabels: Record<string, string> = {
  outerwear: "外套",
  tops: "上装",
  bottoms: "下装",
  "co-ords-sets": "套装",
};

async function requestProducts(search: string) {
  const response = await fetch(`/api/admin/products?q=${encodeURIComponent(search.trim())}&limit=100`, { cache: "no-store" });
  const result = await response.json().catch(() => ({})) as ProductSearchResult;
  return { response, result };
}

export function ProductAdminPanel() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function searchProducts(search = query) {
    setLoading(true);
    setMessage("");
    const { response, result } = await requestProducts(search);
    if (!response.ok) {
      setMessage(result.error || "读取产品失败。");
      setLoading(false);
      return;
    }
    setProducts(result.products || []);
    setCategories(result.categories || []);
    setSubcategories(result.subcategories || []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    void requestProducts("").then(({ response, result }) => {
      if (!active) return;
      if (!response.ok) setMessage(result.error || "读取产品失败。");
      else {
        setProducts(result.products || []);
        setCategories(result.categories || []);
        setSubcategories(result.subcategories || []);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  function updateProduct(productCode: string, field: "category" | "subcategory" | "brand", value: string) {
    setProducts((current) => current.map((product) => (
      product.product_code === productCode ? { ...product, [field]: value } : product
    )));
  }

  async function saveProduct(product: AdminProduct) {
    if (!window.confirm(`确认保存“${product.title}”的分类、子类目和品牌吗？`)) return;
    setMessage(`正在保存 ${product.product_code}…`);
    const response = await fetch(`/api/admin/products/${encodeURIComponent(product.product_code)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: product.category, subcategory: product.subcategory || "", brand: product.brand || "" }),
    });
    const result = await response.json().catch(() => ({})) as { product?: AdminProduct; error?: string };
    if (!response.ok || !result.product) {
      setMessage(result.error || "保存失败，请重试。");
      return;
    }
    setProducts((current) => current.map((item) => item.product_code === result.product?.product_code ? result.product : item));
    setMessage(`已保存并重新读取确认：${result.product.product_code}`);
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    void searchProducts();
  }

  return (
    <section className="admin-product-manager">
      <form className="admin-toolbar" onSubmit={submitSearch}>
        <input aria-label="搜索产品" placeholder="输入商品编号、标题或品牌" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button className="btn btn-solid" type="submit">搜索</button>
        <button className="btn" type="button" onClick={() => { setQuery(""); void searchProducts(""); }}>重置</button>
      </form>
      {message ? <p className="admin-status">{message}</p> : null}
      {loading ? <p>正在读取产品…</p> : null}
      {!loading && products.length === 0 ? <p>没有找到符合条件的产品。</p> : null}
      <div className="admin-product-results">
        {products.map((product) => {
          const image = product.images?.[0]?.imageUrl || product.images?.[0]?.image_url;
          const availableSubcategories = subcategories.filter((item) => item.category === product.category || item.subcategory === product.subcategory);
          return (
            <article className="admin-product-card" key={product.product_code}>
              <a className="admin-product-image" href={`/product/${product.slug}`} target="_blank" rel="noreferrer">
                {image ? <img src={image} alt={product.title} /> : <span>暂无图片</span>}
              </a>
              <div className="admin-product-copy">
                <h2>{product.title}</h2>
                <p>商品编号：{product.product_code}</p>
                <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer">打开前台商品页 →</a>
              </div>
              <label><span>产品分类</span><select value={product.category} onChange={(event) => updateProduct(product.product_code, "category", event.target.value)}>
                {categories.map((category) => <option value={category} key={category}>{categoryLabels[category] || category}（{category}）</option>)}
              </select></label>
              <label><span>子类目</span><select value={product.subcategory || ""} onChange={(event) => updateProduct(product.product_code, "subcategory", event.target.value)}>
                <option value="">不设置子类目</option>
                {availableSubcategories.map((item) => <option value={item.subcategory} key={`${item.category}-${item.subcategory}`}>{item.subcategory}</option>)}
              </select></label>
              <label><span>品牌</span><input value={product.brand || ""} onChange={(event) => updateProduct(product.product_code, "brand", event.target.value)} /></label>
              <button className="btn btn-solid" type="button" onClick={() => void saveProduct(product)}>保存修改</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
