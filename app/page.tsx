import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Decorative radar rings */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-end">
        {[0.3, 0.55, 0.8, 1.1].map((scale) => (
          <div
            key={scale}
            className="absolute border border-border/25 rounded-full"
            style={{
              width: `${scale * 100}vmin`,
              height: `${scale * 100}vmin`,
              right: `-${scale * 20}vmin`,
            }}
          />
        ))}
      </div>

      {/* Top Controls — mirrors radar page layout */}
      <div className="absolute top-4 left-4 z-50">
        <ThemeToggle />
      </div>
      <div className="absolute top-4 right-4 z-50">
        <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-full shadow-md">
          <p className="text-[10px] font-black uppercase tracking-widest">
            Sector 1 · Active
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center p-8 lg:p-16">
        <div className="max-w-md space-y-12">
          {/* Brand identity */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              University of Benin · Campus Network
            </p>
            <h1 className="text-8xl lg:text-[10rem] font-black tracking-tighter uppercase leading-[0.85]">
              Vouch.
            </h1>
            <p className="text-base text-muted-foreground font-medium max-w-xs tracking-tight leading-relaxed">
              The exclusive campus network.
              <br />
              Verification strictly enforced.
            </p>
          </div>

          {/* CTA card — styled like radar carousel cards */}
          <div className="bg-card border border-border rounded-3xl p-6 space-y-3 shadow-sm">
            <div className="mb-6 space-y-1">
              <h2 className="text-2xl font-black tracking-tighter">Enter.</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Authenticate via student credentials
              </p>
            </div>

            <Button
              asChild
              size="lg"
              className="w-full h-12 text-xs font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white border-0 rounded-2xl"
            >
              <Link href="/login">Authenticate</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full h-12 text-xs font-black uppercase tracking-widest rounded-2xl border-border hover:bg-accent"
            >
              <Link href="/onboarding/vouch">I have a Vouch Code</Link>
            </Button>
          </div>

          {/* Footer */}
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            © {new Date().getFullYear()} Vouch · Sector 1
          </p>
        </div>
      </div>
    </main>
  );
}
