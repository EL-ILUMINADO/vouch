import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminSidebar />
      <main className="ml-60 p-8">{children}</main>
    </>
  );
}
