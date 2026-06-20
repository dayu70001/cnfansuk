"use client";

import { FormEvent, useState } from "react";
import { catalogCategories, catalogSubcategories } from "@/lib/catalogTaxonomy";

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
type ProductSearchResult = { products?: AdminProduct[]; error?: string };

async function requestProducts(search: string) {
  const response = await fetch(`/api/admin/products?q=${encodeURIComponent(search.trim())}&limit=20`, { cache: "no-store" });
  const result = await response.json().catch(() => ({})) as ProductSearchResult;
  return { response, result };
}

export function ProductAdminPanel() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [message, setMessage] = useState("");

  async function searchProducts() {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setProducts([]);
      setHasSearched(false);
      setMessage("请输入商品标题、商品编号或品牌后搜索。");
      return;
    }
    setLoading(true);
    setHasSearched(true);
    setMessage("");
    const { response, result } = await requestProducts(cleanQuery);
    if (!response.ok) setMessage(result.error || "读取产品失败。");
    setProducts(response.ok ? result.products || [] : []);
    setLoading(false);
  }

  function updateProduct(productCode: string, field: "title" | "category" | "subcategory" | "brand", value: string) {
    setProducts((current) => current.map((product) => product.product_code === productCode
      ? { ...product, [field]: value, ...(field === "category" ? { subcategory: "" } : {}) }
      : product));
  }

  async function saveProduct(product: AdminProduct) {
    if (!product.title.trim()) {
      setMessage("商品标题不能为空。");
      return;
    }
    if (!window.confirm(`确认保存“${product.title}”的标题、分类、子类目和品牌吗？`)) return;
    setMessage(`正在保存 ${product.product_code}…`);
    const response = await fetch(`/api/admin/products/${encodeURIComponent(product.product_code)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: product.title, category: product.category, subcategory: product.subcategory || "", brand: product.brand || "" }),
    });
    const result = await response.json().catch(() => ({})) as { product?: AdminProduct; error?: string };
    if (!response.ok || !result.product) {
      setMessage(result.error || "保存失败，请重试。");
      return;
    }
    setProducts((current) => current.map((item) => item.product_code === result.product?.product_code ? result.product : item));
    setMessage(`已保存到 D1 并重新读取确认：${result.product.product_code}`);
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    void searchProducts();
  }

  return (
    <section className="admin-product-manager">
      <form className="admin-toolbar" onSubmit={submitSearch}>
        <input aria-label="搜索产品" placeholder="输入商品标题、商品编号或品牌" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button className="btn btn-solid" type="submit">搜索</button>
        <button className="btn" type="button" onClick={() => { setQuery(""); setProducts([]); setHasSearched(false); setMessage(""); }}>清空</button>
      </form>
      {message ? <p className="admin-status">{message}</p> : null}
      {loading ? <p>正在搜索产品…</p> : null}
      {!loading && !hasSearched ? <p>搜索后才会显示对应商品，不再默认展示全部产品。</p> : null}
      {!loading && hasSearched && products.length === 0 ? <p>没有找到符合条件的产品。</p> : null}
      <div className="admin-product-results">
        {products.map((product) => {
          const image = product.images?.[0]?.imageUrl || product.images?.[0]?.image_url;
          const availableSubcategories = catalogSubcategories[product.category] || [];
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
              <label><span>商品标题</span><input value={product.title} onChange={(event) => updateProduct(product.product_code, "title", event.target.value)} /></label>
              <label><span>产品分类</span><select value={product.category} onChange={(event) => updateProduct(product.product_code, "category", event.target.value)}>
                {catalogCategories.map((category) => <option value={category.value} key={category.value}>{category.label}</option>)}
              </select></label>
              <label><span>子类目</span><select value={product.subcategory || ""} onChange={(event) => updateProduct(product.product_code, "subcategory", event.target.value)}>
                <option value="">不设置子类目</option>
                {availableSubcategories.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
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
