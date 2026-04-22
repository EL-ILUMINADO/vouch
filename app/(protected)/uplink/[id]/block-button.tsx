"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldX, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { blockUser } from "./actions/block";

interface BlockButtonProps {
  conversationId: string;
  targetId: string;
  targetName: string;
}

export function BlockButton({
  conversationId,
  targetId,
  targetName,
}: BlockButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleBlock = async () => {
    setLoading(true);
    const result = await blockUser(conversationId, targetId);
    setLoading(false);
    setOpen(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(`${targetName} has been blocked.`);
    router.replace("/chats");
  };

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="More options"
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
      >
        <MoreVertical className="w-5 h-5 text-foreground" />
      </button>

      {/* Confirmation sheet */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed bottom-20 left-4 right-4 z-50 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            <div className="p-4 border-b border-border">
              <p className="text-sm font-bold text-foreground">
                Unmatch &amp; Block
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This will close your chat and prevent{" "}
                <span className="font-semibold">{targetName}</span> from
                appearing on your Radar or Discover. This cannot be undone.
              </p>
            </div>
            <div className="p-1.5 space-y-0.5">
              <button
                type="button"
                onClick={handleBlock}
                disabled={loading}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-colors text-left disabled:opacity-50"
              >
                <ShieldX className="w-4 h-4" />
                {loading ? "Blocking…" : `Block ${targetName}`}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium hover:bg-muted rounded-xl transition-colors text-left"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
