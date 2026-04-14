"use client";

import { useEffect } from "react";
import { updatePresence } from "@/app/(protected)/actions/presence";

const PING_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Mounted globally in the protected layout. Sends a quiet heartbeat every
 * 3 minutes to keep `last_active_at` fresh for presence indicators.
 */
export function PresencePing() {
  useEffect(() => {
    // Ping immediately on mount.
    updatePresence().catch(() => {});

    const id = setInterval(() => {
      updatePresence().catch(() => {});
    }, PING_INTERVAL_MS);

    return () => clearInterval(id);
  }, []);

  return null;
}
