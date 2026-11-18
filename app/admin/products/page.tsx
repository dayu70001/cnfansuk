import { ProductAdminPanel } from "@/components/ProductAdminPanel";
import { ProductDuplicateManager } from "@/components/ProductDuplicateManager";
import { requireAdmin } from "@/lib/adminAuth";

export default async function AdminProductsPage() {
  await requireAdmin();

  return (
    <section className="page-shell">
      <ProductDuplicateManager />
      <details className="admin-duplicate-legacy">
        <summary>旧版产品管理与 AI 分类扫描</summary>
        <p>原有分类、品牌编辑和分类扫描功能仍保留在这里。</p>
        <ProductAdminPanel />
      </details>
    </section>
  );
}
