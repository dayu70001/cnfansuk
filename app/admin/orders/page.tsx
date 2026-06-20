import { AdminOrderPanel } from "@/components/AdminOrderPanel";
import { requireAdmin } from "@/lib/adminAuth";

export default async function AdminOrdersPage() {
  await requireAdmin();

  return (
    <section className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">管理后台</p>
        <h1>订单管理</h1>
      </div>
      <AdminOrderPanel />
    </section>
  );
}
