import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <section className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">管理后台</p>
        <h1>CNFans UK 管理后台</h1>
        <p>管理产品、首页内容和客户订单。</p>
        <AdminLogoutButton />
      </div>
      <div className="admin-cards">
        <Link href="/admin/orders">
          <h2>订单管理</h2>
          <p>查看 D1 订单、商品明细并更新订单状态。</p>
        </Link>
        <Link href="/admin/products">
          <h2>产品管理</h2>
          <p>搜索商品并修改标题、分类、子类目与品牌。</p>
        </Link>
        <Link href="/admin/homepage">
          <h2>首页设置</h2>
          <p>修改首页图片、文案和社交链接，保存后同步到线上。</p>
        </Link>
      </div>
    </section>
  );
}
