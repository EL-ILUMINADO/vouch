import { BottomNavWrapper } from "@/components/nav/bottom-nav-wrapper";
import { VerificationBanner } from "@/components/verification/VerificationBanner";
import { PresencePing } from "@/components/PresencePing";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh bg-background">
      <PresencePing />
      <VerificationBanner />
      <div className="pb-16">{children}</div>
      <BottomNavWrapper />
    </div>
  );
}
