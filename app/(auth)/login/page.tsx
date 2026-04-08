import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-linear-to-br from-rose-50 via-background to-pink-50/30 dark:from-rose-950/20 dark:via-background dark:to-pink-950/10 relative overflow-hidden">
      {/* Soft blob */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-rose-200/30 dark:bg-rose-500/10 blur-3xl" />

      <div className="w-full max-w-sm space-y-10 relative z-10">
        {/* Header */}
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Welcome back
              <span className="text-rose-500"> 👋</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to your Vouch account.
            </p>
          </div>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-muted-foreground">
          New here?{" "}
          <Link
            href="/onboarding/vouch"
            className="font-bold text-rose-500 hover:text-rose-600 transition-colors"
          >
            Join with a Vouch Code →
          </Link>
        </p>
      </div>
    </main>
  );
}
