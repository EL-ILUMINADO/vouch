import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-12">
        <div className="space-y-4">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Return to home page"
          >
            ← Return
          </Link>
          <h1 className="text-4xl font-black tracking-tighter uppercase">
            Authenticate.
          </h1>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
