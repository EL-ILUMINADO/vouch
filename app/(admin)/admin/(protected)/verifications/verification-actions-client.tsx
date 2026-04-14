"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { approveVerification, rejectVerification } from "./actions";

interface Props {
  userId: string;
  userName: string;
}

export function VerificationActionButtons({ userId, userName }: Props) {
  const router = useRouter();
  const [approvePending, startApprove] = useTransition();
  const [rejectPending, startReject] = useTransition();

  const busy = approvePending || rejectPending;

  function handleApprove() {
    startApprove(async () => {
      const result = await approveVerification(userId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`${userName} approved — verification confirmed.`);
        router.refresh();
      }
    });
  }

  function handleReject() {
    startReject(async () => {
      const result = await rejectVerification(userId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.warning(`${userName} rejected — asked to re-submit.`);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2.5">
      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
        Decision
      </p>
      <Button
        onClick={handleApprove}
        disabled={busy}
        className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-70"
      >
        {approvePending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <ShieldCheck className="w-4 h-4 mr-2" />
        )}
        {approvePending ? "Approving…" : "Approve Identity"}
      </Button>
      <Button
        onClick={handleReject}
        disabled={busy}
        variant="outline"
        className="w-full h-11 border-red-900 text-red-400 hover:bg-red-950 hover:text-red-300 font-bold text-sm rounded-xl transition-colors bg-transparent disabled:opacity-70"
      >
        {rejectPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {rejectPending ? "Rejecting…" : "Reject"}
      </Button>
      <p className="text-zinc-600 text-[10px] text-center leading-relaxed pt-1">
        Approval sends the user a verified confirmation message.
        <br />
        Rejection prompts them to re-submit.
      </p>
    </div>
  );
}
