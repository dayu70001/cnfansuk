import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { AdminLoginForm } from "@/components/AdminLoginForm";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin");
  return <AdminLoginForm />;
}
