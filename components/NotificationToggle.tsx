"use client";

import * as React from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { savePushSubscription } from "@/app/(protected)/profile/actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i);
  return view;
}

export function NotificationToggle() {
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "granted" | "denied" | "unsupported"
  >("idle");

  React.useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "granted") setStatus("granted");
    if (Notification.permission === "denied") setStatus("denied");
  }, []);

  const handleEnable = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications are not supported in this browser.");
      return;
    }

    setStatus("loading");

    try {
      // Reuse the already-registered service worker (PwaInit registers it globally).
      const registration = await navigator.serviceWorker.ready;

      // Request permission.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        toast.error("Notification permission denied.");
        return;
      }

      // Subscribe to push.
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });

      const json = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      const result = await savePushSubscription(json);

      if ("error" in result) {
        toast.error(result.error);
        setStatus("idle");
        return;
      }

      setStatus("granted");
      toast.success("Notifications enabled!");
    } catch (err) {
      console.error("[PUSH_ENABLE]", err);
      toast.error("Failed to enable notifications.");
      setStatus("idle");
    }
  };

  if (status === "unsupported") return null;

  if (status === "granted") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
        <Bell className="w-4 h-4 text-green-500 shrink-0" />
        <span className="text-xs font-semibold text-green-600 dark:text-green-400">
          Notifications enabled
        </span>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border">
        <BellOff className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-muted-foreground">
          Notifications blocked — enable in browser settings
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleEnable}
      disabled={status === "loading"}
      className="flex items-center gap-3 w-full px-4 py-3 bg-card border border-border rounded-2xl hover:bg-muted transition-colors disabled:opacity-50 text-left"
    >
      {status === "loading" ? (
        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
      ) : (
        <Bell className="w-4 h-4 text-muted-foreground shrink-0" />
      )}
      <div>
        <span className="block text-sm font-bold text-foreground">
          Enable Notifications
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
          Get alerted when you match
        </span>
      </div>
    </button>
  );
}
