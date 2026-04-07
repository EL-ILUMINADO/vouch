import Link from "next/link";
import { VouchForm } from "./vouch-form";

export default function VouchOnboardingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header Navigation */}
      <nav className="p-8 border-b border-border flex justify-between items-center bg-background sticky top-0 z-10">
        <Link
          href="/"
          className="text-2xl font-black tracking-tighter uppercase"
          aria-label="Vouch Home"
        >
          Vouch.
        </Link>
        <Link
          href="/"
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel Registration
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-16 lg:py-24 space-y-16">
        {/* Contextual Header */}
        <header className="space-y-4 max-w-2xl">
          <h1 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-none">
            Claim Your <br /> Identity.
          </h1>
          <p className="text-xl text-muted-foreground font-light tracking-tight">
            Entrance to the network requires a valid Vouch Code and verified
            institutional standing within your university/school premises.
          </p>
        </header>

        {/* Interaction Layer */}
        <div className="bg-card border border-border p-8 lg:p-12">
          <VouchForm />
        </div>

        {/* Footer Metadata */}
        <footer className="pt-12 border-t border-border flex flex-col md:flex-row justify-between gap-4 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/50">
          <div className="flex gap-8">
            <span>Protocol: Vouch-Beta-v1</span>
            <span>Auth: RSA-4096 / AES-GCM</span>
          </div>
          <span>Uniben / Sector 1 / {new Date().getFullYear()}</span>
        </footer>
      </div>
    </main>
  );
}
