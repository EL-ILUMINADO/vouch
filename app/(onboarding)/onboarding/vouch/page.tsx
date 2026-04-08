import Link from "next/link";
import { VouchForm } from "./vouch-form";

export default function VouchOnboardingPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-rose-50 via-background to-pink-50/30 dark:from-rose-950/20 dark:via-background dark:to-pink-950/10 relative overflow-hidden">
      {/* Blob */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-rose-200/25 dark:bg-rose-500/8 blur-3xl" />

      {/* Nav */}
      <nav className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-background/80 dark:bg-background/80 backdrop-blur-lg border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight">
            vouch<span className="text-rose-500">.</span>
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </Link>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12 space-y-10">
        {/* Header */}
        <header className="space-y-2 max-w-lg">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">
            You were invited 🎉
          </p>
          <h1 className="text-4xl font-black tracking-tight leading-tight">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Enter your vouch code and student details to join. Only verified
            students from supported universities can sign up.
          </p>
        </header>

        {/* Form card */}
        <div className="bg-card border border-border rounded-3xl p-6 lg:p-10 shadow-sm">
          <VouchForm />
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-rose-500 hover:text-rose-600 transition-colors"
          >
            Sign in →
          </Link>
        </p>
      </div>
    </main>
  );
}
