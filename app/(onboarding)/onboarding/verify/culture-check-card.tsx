"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { HyperCaptchaModal } from "@/components/verification/HyperCaptchaModal";

interface Props {
  universityId: string;
  universityName: string;
}

export function CultureCheckCard({ universityId, universityName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div
        className="group relative flex flex-col justify-between p-8 rounded-3xl border-2 border-border bg-card text-foreground hover:border-rose-300 dark:hover:border-rose-500/50 hover:shadow-lg transition-all duration-300 min-h-[320px] cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <div className="space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-rose-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black tracking-tight">Culture Check</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Answer 3 campus-specific questions that only a real{" "}
              {universityName} student would know.
            </p>
          </div>

          <ul className="space-y-1.5">
            {[
              "3 questions, 10 seconds each",
              "3 attempts total",
              "Instant result — no waiting",
            ].map((point) => (
              <li
                key={point}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span className="h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="w-full h-12 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-rose-200 dark:shadow-none mt-6"
        >
          <ShieldCheck className="w-4 h-4" />
          Start Culture Check
        </button>
      </div>

      <HyperCaptchaModal
        isOpen={isOpen}
        universityId={universityId}
        universityName={universityName}
        onSuccess={() => router.push("/onboarding/photos")}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
