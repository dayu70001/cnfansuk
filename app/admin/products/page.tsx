import { ProductAdminPanel } from "@/components/ProductAdminPanel";
import { requireAdmin } from "@/lib/adminAuth";

export default async function AdminProductsPage() {
  await requireAdmin();

  return (
    <section className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">管理后台</p>
        <h1>产品管理</h1>
        <p>按商品标题、商品编号或品牌搜索，修改标题、分类、子类目和品牌后直接保存到 D1。</p>
      </div>
      <ProductAdminPanel />
    </section>
  );
}
