import { notFound } from "next/navigation";
import { AdminOrderPanel } from "@/components/AdminOrderPanel";

export default function AdminOrdersPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <section className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Orders</h1>
      </div>
      <AdminOrderPanel />
    </section>
  );
}
