import { ProductAdminPanel } from "@/components/ProductAdminPanel";
import { requireAdmin } from "@/lib/adminAuth";

export default async function AdminProductsPage() {
  await requireAdmin();

  return (
    <section className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">管理后台</p>
        <h1>产品分类管理</h1>
        <p>按商品编号、标题或品牌搜索，修改后将直接保存到 D1。</p>
      </div>
      <ProductAdminPanel />
    </section>
  );
}
