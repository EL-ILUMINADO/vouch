import { BioWizard } from "@/components/onboarding/BioWizard";

export default function BioSetupPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-rose-50 via-background to-pink-50/30 dark:from-rose-950/20 dark:via-background dark:to-pink-950/10 flex flex-col items-center justify-center p-6 relative overflow-hidden animate-in fade-in duration-500">
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-pink-200/25 dark:bg-pink-500/8 blur-3xl" />

      <div className="relative z-10 max-w-2xl w-full space-y-8">
        <header className="space-y-1">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">
            Step 4 of 4
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            Now, tell us about you
          </h1>
          <p className="text-sm text-muted-foreground">
            The more real you are, the better your matches. Promise.
          </p>
        </header>

        <BioWizard />
      </div>
    </main>
  );
}
