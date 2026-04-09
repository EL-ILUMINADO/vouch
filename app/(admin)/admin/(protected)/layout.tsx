import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminSidebar />
      {/* pt-14 accounts for the mobile top bar; lg:pt-0 removes it on desktop */}
      <main className="pt-14 lg:pt-0 lg:ml-60 p-4 lg:p-8">{children}</main>
    </>
  );
}
