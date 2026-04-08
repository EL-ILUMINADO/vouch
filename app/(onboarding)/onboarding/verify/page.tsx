import { PulseCheck } from "./pulse-check";
import { FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function VerificationHub() {
  return (
    <main className="min-h-screen bg-linear-to-br from-rose-50 via-background to-pink-50/30 dark:from-rose-950/20 dark:via-background dark:to-pink-950/10 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Blob */}
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-pink-200/25 dark:bg-pink-500/8 blur-3xl" />

      <div className="relative z-10 max-w-2xl w-full space-y-8">
        <header className="text-center space-y-2">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">
            Almost there ✨
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            Verify you&apos;re on campus
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            One quick step to confirm you&apos;re a real student at your
            university.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PulseCheck />

          {/* Option B: Document upload */}
          <div
            className={cn(
              "group relative flex flex-col justify-between p-8 rounded-3xl border-2 transition-all duration-300 min-h-[320px] cursor-pointer",
              "border-border bg-card text-foreground",
              "hover:border-rose-300 dark:hover:border-rose-500/50 hover:shadow-lg",
            )}
          >
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-rose-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black tracking-tight">
                  Student ID
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Upload your student ID or admission letter for manual review.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl border-border font-bold mt-6"
            >
              Upload Document
            </Button>
          </div>
        </div>

        <footer className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
          <span>Your location is only used for campus verification</span>
        </footer>
      </div>
    </main>
  );
}
