"use client";

import * as React from "react";
import {
  X,
  MessageCircle,
  ShieldCheck,
  Loader2,
  Clock,
  Check,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { sendRadarPing, respondToRadarRequest } from "./actions";
import { ReportDialog } from "@/components/chat/report-dialog";
import type { RadarRequestState } from "@/types/radar";

interface SignalDetailsProps {
  signal: {
    id: string;
    name: string;
    department: string;
    level: string;
    hideLevel: boolean | null;
    distance: number;
  } | null;
  onClose: () => void;
  isPending?: boolean;
  requestState: RadarRequestState;
  onRequestSent: (signalId: string) => void;
}

export function SignalDetails({
  signal,
  onClose,
  isPending,
  requestState,
  onRequestSent,
}: SignalDetailsProps) {
  const router = useRouter();
  const [isBusy, setIsBusy] = React.useState(false);

  // Reset busy state when a different signal is shown.
  React.useEffect(() => {
    setIsBusy(false);
  }, [signal?.id]);

  if (!signal) return null;

  const handleSendPing = async () => {
    if (isPending) {
      toast.warning("Verification pending", {
        description:
          "Your identity is under review (6–24 hrs). You'll be able to connect once cleared.",
      });
      return;
    }
    try {
      setIsBusy(true);
      await sendRadarPing(signal.id);
      // If we reach here, a pending request was created (no mutual match).
      onRequestSent(signal.id);
      toast.success("Request sent", {
        description: `${signal.name} will be notified. You have 24 hours to connect.`,
      });
      onClose();
    } catch (err) {
      // NEXT_REDIRECT throws — let Next.js handle navigation silently.
      const msg = err instanceof Error ? err.message : "";
      if (!msg.includes("NEXT_REDIRECT")) {
        toast.error(msg || "Something went wrong. Try again.");
      }
      setIsBusy(false);
    }
  };

  const handleRespond = async (action: "accepted" | "declined") => {
    if (requestState.type !== "received") return;
    try {
      setIsBusy(true);
      await respondToRadarRequest(requestState.requestId, action);
      // accepted → redirect handled server-side; declined → close modal.
      if (action === "declined") {
        toast.info("Request declined.");
        onClose();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (!msg.includes("NEXT_REDIRECT")) {
        toast.error(msg || "Something went wrong.");
      }
      setIsBusy(false);
    }
  };

  const handleOpenChat = () => {
    if (requestState.type !== "connected") return;
    router.push(`/uplink/${requestState.conversationId}`);
  };

  const levelLabel = signal.hideLevel ? null : signal.level || "100L";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[320px] bg-card rounded-[2rem] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Banner & Avatar */}
        <div className="relative h-24 bg-rose-50 dark:bg-rose-900/20 flex justify-center">
          {/* Report — top-left */}
          <div className="absolute top-4 left-4">
            <ReportDialog
              reportedUserId={signal.id}
              reportedUserName={signal.name}
            />
          </div>
          {/* Close — top-right */}
          <button
            onClick={onClose}
            disabled={isBusy}
            className="absolute top-4 right-4 p-2 bg-card/60 hover:bg-card rounded-full backdrop-blur-md transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="absolute -bottom-10 w-20 h-20 bg-card rounded-full p-1.5">
            <div className="w-full h-full bg-linear-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-md">
              {signal.name[0]}
            </div>
          </div>
        </div>

        {/* Identity Info */}
        <div className="pt-14 pb-6 px-6 text-center space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {signal.name}
            </h2>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <span>{signal.department}</span>
              {levelLabel && (
                <>
                  <span>•</span>
                  <span>{levelLabel}</span>
                </>
              )}
            </div>
          </div>

          {/* Context Badges */}
          <div className="flex justify-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 rounded-full text-[10px] font-bold tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 animate-pulse" />
              {signal.distance.toFixed(2)} KM
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold tracking-widest uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              Vouched
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="p-4 bg-muted/50 border-t border-border flex flex-col gap-3">
          {requestState.type === "connected" ? (
            <button
              onClick={handleOpenChat}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white bg-emerald-500 hover:bg-emerald-600 shadow-md transition-all active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4 fill-white/20" />
              Open Chat
            </button>
          ) : requestState.type === "sent" ? (
            <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-muted text-muted-foreground border border-border">
              <Check className="w-4 h-4" />
              Request Sent
            </div>
          ) : requestState.type === "received" ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleRespond("declined")}
                disabled={isBusy}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm border border-border text-muted-foreground hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 dark:hover:bg-rose-950/20 transition-all disabled:opacity-50"
              >
                {isBusy ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Decline"
                )}
              </button>
              <button
                onClick={() => handleRespond("accepted")}
                disabled={isBusy}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white bg-rose-500 hover:bg-rose-600 shadow-md transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {isBusy ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Accept"
                )}
              </button>
            </div>
          ) : isPending ? (
            <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-muted text-muted-foreground border border-border">
              <Clock className="w-4 h-4" />
              Verification Pending
            </div>
          ) : (
            <button
              onClick={handleSendPing}
              disabled={isBusy}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-200 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  Send Ping
                </>
              )}
            </button>
          )}

          <div className="flex justify-between items-center px-2">
            {requestState.type === "none" && !isPending ? (
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Costs 1 Radar Ping
              </span>
            ) : requestState.type === "received" ? (
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest animate-pulse">
                Pinged you!
              </span>
            ) : (
              <span />
            )}
            <button
              onClick={onClose}
              disabled={isBusy}
              className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
