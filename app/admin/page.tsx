import Link from "next/link";
import { notFound } from "next/navigation";

export default function AdminPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <section className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>CNFans UK Admin</h1>
        <p>Local mock admin for orders and product visibility.</p>
      </div>
      <div className="admin-cards">
        <Link href="/admin/orders">
          <h2>Orders</h2>
          <p>View localStorage mock orders, update status and copy order details.</p>
        </Link>
        <Link href="/admin/products">
          <h2>Products</h2>
          <p>Review mock product data and prepare future product management.</p>
        </Link>
      </div>
    </section>
  );
}
