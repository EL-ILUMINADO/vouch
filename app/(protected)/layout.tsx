import { BottomNav } from "@/components/nav/bottom-nav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh bg-background">
      <div className="pb-16">{children}</div>

      <BottomNav />
    </div>
  );
}
