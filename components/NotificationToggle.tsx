"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  savePushSubscription,
  deletePushSubscriptions,
} from "@/app/(protected)/profile/actions";

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
  const [enabled, setEnabled] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [denied, setDenied] = React.useState(false);
  const [unsupported, setUnsupported] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setUnsupported(true);
      return;
    }
    if (Notification.permission === "denied") {
      setDenied(true);
      return;
    }
    if (Notification.permission === "granted") {
      // Check if there's actually an active push subscription.
      navigator.serviceWorker.ready.then((reg) =>
        reg.pushManager.getSubscription().then((sub) => setEnabled(!!sub)),
      );
    }
  }, []);

  const handleEnable = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications are not supported in this browser.");
      return;
    }

    setPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();

      if (permission === "denied") {
        setDenied(true);
        toast.error("Notifications blocked — allow them in browser settings.");
        setPending(false);
        return;
      }

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
        setPending(false);
        return;
      }

      setEnabled(true);
      toast.success("Notifications enabled!");
    } catch (err) {
      console.error("[PUSH_ENABLE]", err);
      toast.error("Failed to enable notifications.");
    } finally {
      setPending(false);
    }
  };

  const handleDisable = async () => {
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      await subscription?.unsubscribe();

      await deletePushSubscriptions();
      setEnabled(false);
      toast.success("Notifications disabled.");
    } catch (err) {
      console.error("[PUSH_DISABLE]", err);
      toast.error("Failed to disable notifications.");
    } finally {
      setPending(false);
    }
  };

  if (unsupported) return null;

  return (
    <div className="bg-card p-4 rounded-3xl border border-border shadow-sm flex justify-between items-center">
      <div>
        <span className="block text-sm font-bold text-foreground">
          Notifications
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
          {denied
            ? "Blocked in browser settings"
            : enabled
              ? "Alerts for matches & pings"
              : "Get alerted when you match"}
        </span>
      </div>

      {denied ? (
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Blocked
        </span>
      ) : pending ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : (
        <button
          onClick={enabled ? handleDisable : handleEnable}
          title={enabled ? "Disable notifications" : "Enable notifications"}
          className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
            enabled ? "bg-rose-500" : "bg-muted border border-border"
          }`}
        >
          <span
            className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      )}
    </div>
  );
}
