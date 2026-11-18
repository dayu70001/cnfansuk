"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { normalizeProductTitle } from "@/lib/productDuplicates";

type ProductImage = { image_url?: string | null; imageUrl?: string | null; alt?: string | null };
type ProductOption = { option_name?: string | null; option_value?: string | null };
type AdminProduct = {
  id: number;
  product_code: string;
  slug: string;
  title: string;
  category: string;
  subcategory: string | null;
  status: string;
  price_gbp: number;
  updated_at: string;
  images?: ProductImage[];
  options?: ProductOption[];
};
type DuplicateGroup = {
  key: string;
  title: string;
  count: number;
  kind: "exact" | "normalized";
  rawTitles: string[];
  productIds: number[];
  productCodes: string[];
};
type ProductPage = { products?: AdminProduct[]; total?: number; page?: number; totalPages?: number; error?: string };
type GroupPage = {
  groups?: DuplicateGroup[];
  totalProducts?: number;
  duplicateGroupCount?: number;
  exactDuplicateGroupCount?: number;
  normalizedVariantGroupCount?: number;
  affectedProductCount?: number;
  filteredGroupCount?: number;
  page?: number;
  totalPages?: number;
  error?: string;
};
type GroupProductsPage = { products?: AdminProduct[]; total?: number; page?: number; totalPages?: number; error?: string };
type Stats = Pick<GroupPage, "totalProducts" | "duplicateGroupCount" | "exactDuplicateGroupCount" | "normalizedVariantGroupCount" | "affectedProductCount">;

const PAGE_SIZE = 24;
const GROUP_PAGE_SIZE = 12;

async function readJson<T>(response: Response): Promise<T> {
  return response.json().catch(() => ({} as T)) as Promise<T>;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(value) || 0);
}

function imageUrl(image?: ProductImage) {
  return image?.imageUrl || image?.image_url || "";
}

function productOptions(options: ProductOption[] = []) {
  const byName = new Map<string, Set<string>>();
  for (const option of options) {
    const name = option.option_name?.trim() || "Option";
    const value = option.option_value?.trim();
    if (!value) continue;
    if (!byName.has(name)) byName.set(name, new Set());
    byName.get(name)?.add(value);
  }
  return Array.from(byName, ([name, values]) => `${name}: ${Array.from(values).join(" / ")}`);
}

export function ProductDuplicateManager() {
  const [mode, setMode] = useState<"all" | "duplicates">("all");
  const [query, setQuery] = useState("");
  const [groupPage, setGroupPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const [expandedKey, setExpandedKey] = useState("");
  const [expandedPage, setExpandedPage] = useState(1);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [groupStats, setGroupStats] = useState<Stats>({});
  const [groupPages, setGroupPages] = useState(0);
  const [matchedGroupCount, setMatchedGroupCount] = useState(0);
  const [searchProducts, setSearchProducts] = useState<AdminProduct[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPages, setSearchPages] = useState(0);
  const [expandedProducts, setExpandedProducts] = useState<AdminProduct[]>([]);
  const [expandedTotal, setExpandedTotal] = useState(0);
  const [expandedPages, setExpandedPages] = useState(0);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingExpanded, setLoadingExpanded] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [lightbox, setLightbox] = useState<{ product: AdminProduct; index: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [comparisonNotes, setComparisonNotes] = useState<Set<number>>(() => new Set());
  const lightboxCloseRef = useRef<HTMLButtonElement>(null);
  const lightboxProductCode = lightbox?.product.product_code;

  const groupQuery = useMemo(() => query.trim(), [query]);

  async function refreshStats() {
    const response = await fetch("/api/admin/products/duplicates?status=active&page=1&limit=1", { cache: "no-store" });
    const result = await readJson<GroupPage>(response);
    if (!response.ok) {
      setNotice(result.error || "读取商品统计失败。");
      setNoticeError(true);
      return;
    }
    setGroupStats({
      totalProducts: result.totalProducts,
      duplicateGroupCount: result.duplicateGroupCount,
      exactDuplicateGroupCount: result.exactDuplicateGroupCount,
      normalizedVariantGroupCount: result.normalizedVariantGroupCount,
      affectedProductCount: result.affectedProductCount,
    });
  }

  async function refreshGroups(page = groupPage, q = groupQuery) {
    setLoadingGroups(true);
    const params = new URLSearchParams({ status: "active", page: String(page), limit: String(GROUP_PAGE_SIZE) });
    if (q) params.set("q", q);
    const response = await fetch(`/api/admin/products/duplicates?${params}`, { cache: "no-store" });
    const result = await readJson<GroupPage>(response);
    if (!response.ok) {
      setNotice(result.error || "读取重复标题组失败。");
      setNoticeError(true);
      setGroups([]);
      setMatchedGroupCount(0);
      setLoadingGroups(false);
      return;
    }
    setGroups(result.groups || []);
    setMatchedGroupCount(result.filteredGroupCount || 0);
    setGroupStats((current) => ({
      totalProducts: result.totalProducts ?? current.totalProducts,
      duplicateGroupCount: result.duplicateGroupCount ?? current.duplicateGroupCount,
      exactDuplicateGroupCount: result.exactDuplicateGroupCount ?? current.exactDuplicateGroupCount,
      normalizedVariantGroupCount: result.normalizedVariantGroupCount ?? current.normalizedVariantGroupCount,
      affectedProductCount: result.affectedProductCount ?? current.affectedProductCount,
    }));
    setGroupPages(result.totalPages || 0);
    if (page !== result.page) setGroupPage(result.page || 1);
    setLoadingGroups(false);
  }

  async function refreshSearch(page = searchPage, q = groupQuery) {
    setLoadingSearch(true);
    const params = new URLSearchParams({ status: "active", page: String(page), limit: String(PAGE_SIZE) });
    if (q) params.set("q", q);
    const response = await fetch(`/api/admin/products?${params}`, { cache: "no-store" });
    const result = await readJson<ProductPage>(response);
    if (!response.ok) {
      setNotice(result.error || "搜索商品失败。");
      setNoticeError(true);
      setSearchProducts([]);
      setLoadingSearch(false);
      return;
    }
    setSearchProducts(result.products || []);
    setSearchTotal(result.total || 0);
    setSearchPages(result.totalPages || 0);
    if (page !== result.page) setSearchPage(result.page || 1);
    setLoadingSearch(false);
  }

  async function refreshExpanded(key = expandedKey, page = expandedPage) {
    if (!key) return;
    setLoadingExpanded(true);
    const params = new URLSearchParams({ key, status: "active", page: String(page), limit: String(GROUP_PAGE_SIZE) });
    const response = await fetch(`/api/admin/products/duplicate-items?${params}`, { cache: "no-store" });
    const result = await readJson<GroupProductsPage>(response);
    if (!response.ok) {
      setNotice(result.error || "读取重复组商品失败。");
      setNoticeError(true);
      setExpandedProducts([]);
      setLoadingExpanded(false);
      return;
    }
    setExpandedProducts(result.products || []);
    setExpandedTotal(result.total || 0);
    setExpandedPages(result.totalPages || 0);
    if (page !== result.page) setExpandedPage(result.page || 1);
    setLoadingExpanded(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshStats();
    }, 0);
    return () => window.clearTimeout(timer);
    // The full product list and duplicate counts are independently paginated.
  }, []);

  useEffect(() => {
    if (mode !== "duplicates") return;
    const timer = window.setTimeout(() => { void refreshGroups(groupPage, groupQuery); }, groupQuery ? 220 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, groupPage, groupQuery]);

  useEffect(() => {
    if (mode !== "all") return;
    const timer = window.setTimeout(() => { void refreshSearch(searchPage, groupQuery); }, groupQuery ? 220 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, searchPage, groupQuery]);

  useEffect(() => {
    if (!expandedKey) return;
    if (mode !== "duplicates") return;
    const timer = window.setTimeout(() => { void refreshExpanded(expandedKey, expandedPage); }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, expandedKey, expandedPage]);

  // Only rebind the dialog lifecycle when its product changes, not on each image index.
  useEffect(() => {
    if (!lightboxProductCode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => lightboxCloseRef.current?.focus());
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowRight") setLightbox((current) => current ? { ...current, index: Math.min(current.index + 1, (current.product.images?.length || 1) - 1) } : null);
      if (event.key === "ArrowLeft") setLightbox((current) => current ? { ...current, index: Math.max(current.index - 1, 0) } : null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxProductCode]);

  function showNotice(message: string, error = false) {
    setNotice(message);
    setNoticeError(error);
  }

  async function saveTitle(product: AdminProduct, title: string) {
    const response = await fetch(`/api/admin/products/by-id/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productCode: product.product_code,
        expectedTitle: product.title,
        expectedUpdatedAt: product.updated_at,
        title,
      }),
    });
    const result = await readJson<{ product?: AdminProduct; error?: string }>(response);
    if (!response.ok || !result.product) {
      showNotice(result.error || "标题保存失败。", true);
      return false;
    }
    const updated = result.product;
    setSearchProducts((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
    setExpandedProducts((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
    if (expandedProducts.some((item) => item.id === updated.id) && normalizeProductTitle(updated.title) !== expandedKey) {
      setComparisonNotes((current) => new Set(current).add(updated.id));
    }
    showNotice(`商品 ${product.id} 的标题已保存；当前对比位置保留，离开此组或手动刷新后重新分组。`);
    await refreshStats();
    return true;
  }

  async function confirmUnpublish() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const product = deleteTarget;
    const response = await fetch(`/api/admin/products/by-id/${product.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productCode: product.product_code, expectedTitle: product.title, expectedUpdatedAt: product.updated_at }),
    });
    const result = await readJson<{ product?: AdminProduct; softDeleted?: boolean; error?: string }>(response);
    setDeleting(false);
    setDeleteTarget(null);
    if (!response.ok || !result.softDeleted || !result.product) {
      showNotice(result.error || "商品下架失败。", true);
      return;
    }
    setSearchProducts((current) => current.map((item) => item.id === product.id ? { ...item, ...result.product! } : item));
    setExpandedProducts((current) => current.map((item) => item.id === product.id ? { ...item, ...result.product! } : item));
    showNotice(`商品 ${product.id} 已移除并从前台下架；当前卡位保留，可在这里撤销。`);
    await refreshStats();
  }

  async function restoreProduct(product: AdminProduct) {
    if (restoringId !== null) return;
    setRestoringId(product.id);
    const response = await fetch(`/api/admin/products/by-id/${product.id}/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productCode: product.product_code, expectedTitle: product.title, expectedUpdatedAt: product.updated_at }),
    });
    const result = await readJson<{ product?: AdminProduct; restored?: boolean; error?: string }>(response);
    setRestoringId(null);
    if (!response.ok || !result.restored || !result.product) {
      showNotice(result.error || "撤销删除失败，请刷新后检查商品状态。", true);
      return;
    }
    setSearchProducts((current) => current.map((item) => item.id === product.id ? { ...item, ...result.product! } : item));
    setExpandedProducts((current) => current.map((item) => item.id === product.id ? { ...item, ...result.product! } : item));
    showNotice(`商品 ${product.id} 已恢复在售，当前卡位保持不变。`);
    await refreshStats();
  }

  function changeMode(value: "all" | "duplicates") {
    setMode(value);
    setGroupPage(1);
    setSearchPage(1);
    setExpandedKey("");
    setExpandedPage(1);
    setComparisonNotes(new Set());
  }

  function refreshResults() {
    setExpandedKey("");
    setExpandedProducts([]);
    setComparisonNotes(new Set());
    if (mode === "duplicates") {
      void Promise.all([refreshStats(), refreshGroups(1, groupQuery)]);
      setGroupPage(1);
    } else {
      void Promise.all([refreshStats(), refreshSearch(1, groupQuery)]);
      setSearchPage(1);
    }
  }

  const currentLightboxImages = lightbox?.product.images || [];
  const currentLightboxImage = currentLightboxImages[lightbox?.index || 0];

  return (
    <section className="admin-duplicate-manager" aria-label="商品管理">
      <div className="admin-products-heading">
        <div>
          <p className="eyebrow">管理后台</p>
          <h1>商品管理</h1>
          <p>查询在售商品，或按标题分组比较；所有修改均按单件商品执行。</p>
        </div>
        <strong>在售商品 <span>{groupStats.totalProducts ?? "—"}</span></strong>
      </div>

      <div className="admin-duplicate-stats">
        <article><span>全部商品</span><strong>{groupStats.totalProducts ?? "—"}</strong></article>
        <article><span>重复标题组</span><strong>{groupStats.duplicateGroupCount ?? "—"}</strong></article>
        <article><span>涉及商品</span><strong>{groupStats.affectedProductCount ?? "—"}</strong></article>
      </div>

      <form className="admin-duplicate-search" onSubmit={(event: FormEvent) => event.preventDefault()}>
        <input
          aria-label="搜索标题或商品编号"
          placeholder="搜索商品标题、关键词、商品 ID 或商品码"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setGroupPage(1); setSearchPage(1); }}
        />
        {query ? <button type="button" onClick={() => { setQuery(""); setGroupPage(1); setSearchPage(1); }}>清空搜索</button> : null}
      </form>
      <div className="admin-product-tabs" role="tablist" aria-label="商品视图">
        <button type="button" role="tab" aria-selected={mode === "all"} className={mode === "all" ? "is-active" : ""} onClick={() => changeMode("all")}>全部商品</button>
        <button type="button" role="tab" aria-selected={mode === "duplicates"} className={mode === "duplicates" ? "is-active" : ""} onClick={() => changeMode("duplicates")}>重复标题</button>
        <button type="button" className="admin-product-refresh" onClick={refreshResults}>刷新结果</button>
      </div>
      {notice ? <p className={noticeError ? "admin-duplicate-notice is-error" : "admin-duplicate-notice"} role="status">{notice}</p> : null}

      {mode === "all" ? (
        <section className="admin-duplicate-search-results" aria-label="商品搜索结果">
          <div className="admin-duplicate-section-heading"><h3>{query ? "商品搜索结果" : "在售商品"}</h3><span>{searchTotal} 件</span></div>
          {loadingSearch ? <p>正在读取商品…</p> : null}
          {!loadingSearch && searchProducts.length === 0 ? <p>{query ? "没有找到匹配商品。" : "当前没有在售商品。"}</p> : null}
          <div className="admin-duplicate-grid">
            {searchProducts.map((product) => <DuplicateProductCard key={product.id} product={product} onSaveTitle={saveTitle} onDelete={setDeleteTarget} onRestore={restoreProduct} restoring={restoringId === product.id} onOpenImage={(item) => setLightbox({ product: item, index: 0 })} />)}
          </div>
          <Pagination page={searchPage} totalPages={searchPages} onChange={setSearchPage} />
        </section>
      ) : null}

      {mode === "duplicates" ? <section className="admin-duplicate-groups" aria-label="重复标题组">
        <div className="admin-duplicate-section-heading">
          <h3>{query ? "匹配的重复标题组" : "重复标题组"}</h3>
          <span>{query ? matchedGroupCount : groupStats.duplicateGroupCount ?? 0} 组</span>
        </div>
        {loadingGroups ? <p>正在重新读取商品标题并分组…</p> : null}
        {!loadingGroups && groups.length === 0 ? <p>{query ? "没有匹配的重复标题组。" : "当前范围没有重复标题。"}</p> : null}
        <div className="admin-duplicate-group-list">
          {groups.map((group) => {
            const isOpen = expandedKey === group.key;
            return (
              <article className="admin-duplicate-group" key={group.key}>
                <button
                  className="admin-duplicate-group-toggle"
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setExpandedPage(1);
                    if (isOpen) {
                      setExpandedKey("");
                      setExpandedProducts([]);
                      setComparisonNotes(new Set());
                      void refreshGroups(1, groupQuery);
                      setGroupPage(1);
                    } else {
                      setExpandedKey(group.key);
                    }
                  }}
                >
                  <span className="admin-duplicate-group-title">{group.title}</span>
                  <span className="admin-duplicate-group-count">{group.count} 件</span>
                  <span className={group.kind === "normalized" ? "admin-duplicate-kind is-normalized" : "admin-duplicate-kind"}>
                    {group.kind === "normalized" ? "格式差异合并" : "标题完全一致"}
                  </span>
                  <span className="admin-duplicate-group-action">{isOpen ? "收起 −" : "展开 +"}</span>
                </button>
                {isOpen ? (
                  <div className="admin-duplicate-group-body">
                    {group.rawTitles.length > 1 ? <p className="admin-duplicate-variants">标题格式：{group.rawTitles.join(" · ")}</p> : null}
                    <div className="admin-duplicate-section-heading"><span>组内商品</span><span>{expandedTotal || group.count} 件</span></div>
                    {loadingExpanded ? <p>正在加载本页商品图片及规格…</p> : null}
                    <div className="admin-duplicate-grid">
                      {expandedProducts.map((product) => <DuplicateProductCard key={product.id} product={product} comparisonNote={comparisonNotes.has(product.id) ? "标题已修改" : ""} onSaveTitle={saveTitle} onDelete={setDeleteTarget} onRestore={restoreProduct} restoring={restoringId === product.id} onOpenImage={(item) => setLightbox({ product: item, index: 0 })} />)}
                    </div>
                    <Pagination page={expandedPage} totalPages={expandedPages} onChange={setExpandedPage} />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
        <Pagination page={groupPage} totalPages={groupPages} onChange={setGroupPage} />
      </section> : null}

      {deleteTarget ? (
        <div className="admin-duplicate-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setDeleteTarget(null); }}>
          <section className="admin-duplicate-confirm" role="dialog" aria-modal="true" aria-labelledby="admin-delete-title">
            <h3 id="admin-delete-title">确认删除此商品？</h3>
            <p>只移除这件商品的前台在售状态，商品、图片、规格和历史订单数据都会保留；操作后可在当前卡片撤销。</p>
            <div className="admin-delete-preview">
              {imageUrl(deleteTarget.images?.[0]) ? <img src={imageUrl(deleteTarget.images?.[0])} alt={deleteTarget.title} /> : null}
              <div><strong>{deleteTarget.title}</strong><span>ID：{deleteTarget.id}</span><span>商品码：{deleteTarget.product_code}</span><span>价格：{formatPrice(deleteTarget.price_gbp)}</span></div>
            </div>
            <div className="admin-duplicate-confirm-actions">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}>取消</button>
              <button className="is-danger" type="button" onClick={() => void confirmUnpublish()} disabled={deleting}>{deleting ? "正在删除…" : "确认删除"}</button>
            </div>
          </section>
        </div>
      ) : null}

      {lightbox && currentLightboxImage ? (
        <div className="admin-duplicate-lightbox" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLightbox(null); }}>
          <section className="admin-duplicate-lightbox-panel" role="dialog" aria-modal="true" aria-label={`商品 ${lightbox.product.id} 图片预览`}>
            <header><div><strong>{lightbox.product.title}</strong><span>{lightbox.index + 1} / {currentLightboxImages.length}</span></div><button ref={lightboxCloseRef} type="button" onClick={() => setLightbox(null)} aria-label="关闭图片预览">×</button></header>
            <div className="admin-duplicate-lightbox-main">
              <button type="button" onClick={() => setLightbox((current) => current ? { ...current, index: Math.max(0, current.index - 1) } : null)} disabled={lightbox.index <= 0} aria-label="上一张图片">‹</button>
              <ManagedProductImage
                key={`${lightbox.product.product_code}-${lightbox.index}-${imageUrl(currentLightboxImage)}`}
                src={imageUrl(currentLightboxImage)}
                alt={currentLightboxImage.alt || lightbox.product.title}
                className="admin-duplicate-lightbox-image"
              />
              <button type="button" onClick={() => setLightbox((current) => current ? { ...current, index: Math.min(current.product.images!.length - 1, current.index + 1) } : null)} disabled={lightbox.index >= currentLightboxImages.length - 1} aria-label="下一张图片">›</button>
            </div>
            <div className="admin-duplicate-lightbox-thumbs" aria-label="选择商品图片">
              {currentLightboxImages.map((image, index) => <button type="button" key={`${imageUrl(image)}-${index}`} className={index === lightbox.index ? "is-current" : ""} onClick={() => setLightbox((current) => current ? { ...current, index } : null)} aria-label={`查看图片 ${index + 1}`}><ManagedProductImage key={`${index}-${imageUrl(image)}`} src={imageUrl(image)} alt="" loading="lazy" /></button>)}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="admin-duplicate-pagination" aria-label="商品分页">
      <button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}>上一页</button>
      <span>第 {page} / {totalPages} 页</span>
      <button type="button" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>下一页</button>
    </nav>
  );
}

function ManagedProductImage({ src, alt, loading, className = "" }: { src: string; alt: string; loading?: "lazy" | "eager"; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className={`admin-duplicate-image-fallback ${className}`.trim()} role="img" aria-label={failed ? "图片加载失败" : "暂无图片"}>{failed ? "图片加载失败" : "暂无图片"}</span>;
  }
  return <img className={className || undefined} src={src} alt={alt} loading={loading} onError={() => setFailed(true)} />;
}

function DuplicateProductCard({
  product,
  comparisonNote = "",
  onSaveTitle,
  onDelete,
  onRestore,
  restoring = false,
  onOpenImage,
}: {
  product: AdminProduct;
  comparisonNote?: string;
  onSaveTitle: (product: AdminProduct, title: string) => Promise<boolean>;
  onDelete: (product: AdminProduct) => void;
  onRestore: (product: AdminProduct) => Promise<void>;
  restoring?: boolean;
  onOpenImage: (product: AdminProduct) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(product.title);
  const [saving, setSaving] = useState(false);
  const image = imageUrl(product.images?.[0]);
  const options = productOptions(product.options);

  async function submitTitle(event: FormEvent) {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    if (title === product.title) { setEditing(false); return; }
    setSaving(true);
    const saved = await onSaveTitle(product, title);
    setSaving(false);
    if (saved) {
      setDraft(title);
      setEditing(false);
    }
  }

  return (
    <article className={`admin-duplicate-product-card${product.status === "active" ? "" : " is-removed"}`}>
      <button className="admin-duplicate-product-image" type="button" onClick={() => onOpenImage(product)} disabled={!image} aria-label={`查看商品 ${product.id} 的全部图片`}>
        <ManagedProductImage key={image || "empty"} src={image} alt={product.title} loading="lazy" />
        {product.images && product.images.length > 1 ? <span className="admin-duplicate-image-count">{product.images.length} 张图片 · 点击比较</span> : null}
      </button>
      <div className="admin-duplicate-product-info">
        <h4>{product.title}</h4>
        {comparisonNote ? <p className="admin-duplicate-change-note">{comparisonNote}</p> : null}
        <div className="admin-duplicate-product-meta"><span>ID：{product.id}</span><span className="admin-duplicate-code">商品码：{product.product_code}</span></div>
        <p className="admin-duplicate-price">{formatPrice(product.price_gbp)}</p>
        <div className="admin-duplicate-product-meta"><span>{product.category}{product.subcategory ? ` / ${product.subcategory}` : ""}</span><span>{product.status === "active" ? "在售" : "已移除"}</span></div>
        {options.length ? <div className="admin-duplicate-options">{options.map((option) => <span key={option}>{option}</span>)}</div> : <p>无商品选项</p>}
      </div>
      {product.status === "active" ? (
        <a className="admin-duplicate-product-front-link" href={`/product/${encodeURIComponent(product.slug)}`} target="_blank" rel="noreferrer">查看前台 ↗</a>
      ) : (
        <div className="admin-duplicate-product-front-link is-unavailable">已移除，前台入口已关闭</div>
      )}
      {product.status !== "active" ? (
        <div className="admin-duplicate-product-actions is-undo">
          <button type="button" onClick={() => void onRestore(product)} disabled={restoring}>{restoring ? "正在撤销…" : "撤销删除"}</button>
        </div>
      ) : editing ? (
        <form className="admin-duplicate-edit" onSubmit={(event) => void submitTitle(event)}>
          <label><span>完整商品标题</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={240} rows={3} autoFocus /></label>
          <div><button type="submit" disabled={saving || !draft.trim()}>{saving ? "保存中…" : "保存修改"}</button><button type="button" onClick={() => { setDraft(product.title); setEditing(false); }} disabled={saving}>取消</button></div>
        </form>
      ) : (
        <div className="admin-duplicate-product-actions">
          <button type="button" onClick={() => { setDraft(product.title); setEditing(true); }}>修改标题</button>
          <button type="button" className="is-danger" onClick={() => onDelete(product)} disabled={product.status !== "active"}>删除商品</button>
        </div>
      )}
    </article>
  );
}
