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
