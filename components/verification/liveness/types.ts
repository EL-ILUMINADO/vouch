/**
 * Every discrete step in the liveness check flow.
 *
 * idle        → modal is closed; only the "Start Check" trigger is visible.
 * requesting  → getUserMedia() is in-flight; show a spinner.
 * denied      → the user blocked camera/mic; show the fallback help UI.
 * ready       → stream is live; waiting for the user to press Record.
 * countdown   → 3-second countdown overlay before recording begins.
 * recording   → MediaRecorder is active; show the REC pill + live timer.
 * preview     → recording finished; user reviews the clip before submitting.
 * submitting  → Cloudinary upload + server action in-flight.
 * submitted   → success confirmation; modal auto-closes after a short delay.
 */
export type Phase =
  | "idle"
  | "requesting"
  | "denied"
  | "ready"
  | "countdown"
  | "recording"
  | "preview"
  | "submitting"
  | "submitted";
