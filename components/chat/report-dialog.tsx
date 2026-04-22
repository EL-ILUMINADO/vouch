"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import { reportUser } from "@/app/(protected)/uplink/[id]/actions/report";

const REASONS = [
  { value: "harassment", label: "Harassment" },
  { value: "fake_profile", label: "Fake Profile" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];

interface ReportDialogProps {
  conversationId?: string;
  reportedUserId: string;
  reportedUserName: string;
}

export function ReportDialog({
  conversationId,
  reportedUserId,
  reportedUserName,
}: ReportDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("harassment");
  const [description, setDescription] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError("");

    const result = await reportUser(
      conversationId ?? null,
      reportedUserId,
      reason,
      description,
    );

    setIsPending(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setDescription("");
        setReason("harassment");
      }, 1500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" />
        }
        aria-label="Report user"
      >
        <Flag className="w-4 h-4" />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {reportedUserName}</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="py-6 text-center space-y-1">
            <p className="font-bold text-foreground">Report submitted.</p>
            <p className="text-sm text-muted-foreground">
              Our team will review this and take action.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Reason
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {REASONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm font-medium ${
                      reason === value
                        ? "border-destructive/60 bg-destructive/10 text-destructive"
                        : "border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={value}
                      checked={reason === value}
                      onChange={() => setReason(value)}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Additional details{" "}
                <span className="normal-case font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened..."
                rows={3}
                className="w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring placeholder:text-muted-foreground/50"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}

            <p className="text-xs text-muted-foreground">
              {conversationId
                ? "The last 20 messages from this conversation will be included with your report for review."
                : "Your report will be reviewed by our moderation team."}
            </p>

            <DialogFooter showCloseButton>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-destructive hover:bg-destructive/90 text-white font-bold"
              >
                {isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
