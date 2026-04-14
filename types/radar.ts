import type { CSSProperties } from "react";

export interface RadarSignal {
  id: string;
  name: string;
  department: string;
  level: string;
  hideLevel: boolean | null;
  distance: number;
  angle?: number;
}

export interface RadarCSS extends CSSProperties {
  "--signal-angle"?: string;
  "--signal-radius"?: string;
}

/**
 * The relationship state between the current user and a radar signal.
 * Drives the action buttons in SignalDetails.
 */
export type RadarRequestState =
  | { type: "none" }
  | { type: "sent" }
  | { type: "received"; requestId: string }
  | { type: "connected"; conversationId: string };
