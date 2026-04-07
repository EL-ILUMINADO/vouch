import { PulseCheck } from "./pulse-check";
import { FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function VerificationHub() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 lg:p-24">
      <div className="max-w-5xl w-full space-y-12">
        <header className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">
            Identity Node: Provisioned
          </p>
          <h1 className="text-7xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.8]">
            Verify.
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PulseCheck />

          {/* Option B: Document OCR Card */}
          <div
            className={cn(
              "group relative flex flex-col justify-between p-10 border-2 transition-all duration-500 ease-expo min-h-[360px] cursor-pointer",
              "border-foreground/10 bg-background text-foreground",
              "hover:bg-foreground hover:text-background hover:border-foreground",
            )}
          >
            <div className="space-y-8 relative z-10">
              <FileText className="w-12 h-12 stroke-[1.2]" />
              <div className="space-y-3">
                <h3 className="text-4xl font-black tracking-tighter uppercase leading-none italic">
                  Document
                </h3>
                <p className="text-sm font-medium transition-colors duration-500 text-muted-foreground group-hover:text-background/70">
                  Manual credential analysis. Upload student ID or admission
                  receipts for biometric verification.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-14 rounded-none border-2 border-foreground/20 bg-transparent font-black uppercase tracking-widest transition-all duration-500 group-hover:border-background group-hover:bg-background group-hover:text-foreground"
            >
              Upload Credentials
            </Button>
          </div>
        </div>

        <footer className="flex justify-between items-center pt-12 border-t border-border">
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Edge Verification Protocol Active</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
            Sector 1 / Beta
          </span>
        </footer>
      </div>
    </main>
  );
}
