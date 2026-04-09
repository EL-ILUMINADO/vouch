import { BottomNav } from "@/components/nav/bottom-nav";
import { VerificationBanner } from "@/components/verification/VerificationBanner";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh bg-background">
      <VerificationBanner />
      <div className="pb-16">{children}</div>
      <BottomNav />
    </div>
  );
}
