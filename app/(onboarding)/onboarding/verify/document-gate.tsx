"use client";

import * as React from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";
import { verifyDocument } from "./actions";

export function DocumentGate() {
  // We use useActionState to keep the error visible even if the page re-renders
  const [state, action, isPending] = useActionState(verifyDocument, {});

  return (
    <form
      action={action}
      className="group relative flex flex-col justify-between p-10 border-2 border-foreground/10 bg-background text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-500 ease-expo min-h-[360px]"
    >
      <div className="space-y-8 relative z-10">
        <FileText className="w-12 h-12 stroke-[1.2]" />
        <div className="space-y-3">
          <h3 className="text-4xl font-black tracking-tighter uppercase leading-none italic">
            Document
          </h3>
          <p className="text-sm font-medium transition-colors duration-500 text-muted-foreground group-hover:text-background/70">
            {isPending
              ? "Analyzing biometric and text data..."
              : "Manual credential analysis. Upload student ID or admission receipts."}
          </p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        {state.error && (
          <p className="text-[10px] font-black uppercase tracking-widest text-destructive group-hover:text-destructive-foreground">
            {"// [Auth_Fail]: "}
            {state.error}
          </p>
        )}

        <div className="relative">
          <Input
            type="file"
            name="document"
            accept="image/*,.pdf"
            className="hidden"
            id="doc-upload"
            disabled={isPending}
          />
          <label
            htmlFor="doc-upload"
            className="flex items-center justify-center w-full h-14 border-2 border-dashed border-foreground/20 group-hover:border-background/40 cursor-pointer text-xs font-black uppercase tracking-widest"
          >
            {isPending ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              "Select Credentials"
            )}
          </label>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          variant="outline"
          className="w-full h-14 rounded-none border-2 border-foreground/20 bg-transparent font-black uppercase tracking-widest transition-all duration-500 group-hover:border-background group-hover:bg-background group-hover:text-foreground"
        >
          Upload & Verify
        </Button>
      </div>
    </form>
  );
}
