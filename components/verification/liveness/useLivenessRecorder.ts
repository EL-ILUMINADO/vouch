"use client";

import * as React from "react";
import { type Phase } from "./types";
import { pickInstructions } from "./instructions";
import {
  submitLiveness,
  getCloudinaryVideoSignature,
} from "@/app/actions/submit-liveness";

// ─── Public interface ─────────────────────────────────────────────────────────

export interface LivenessRecorderState {
  isOpen: boolean;
  phase: Phase;
  countdown: number;
  recordingTime: number;
  instructions: string[];
  error: string | null;
  previewUrl: string | null;
  recordedBlob: Blob | null;
  /** Attach to the live <video> element inside CameraViewfinder. */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Attach to the playback <video> element inside PreviewPanel. */
  previewRef: React.RefObject<HTMLVideoElement | null>;
}

export interface LivenessRecorderActions {
  openModal: () => Promise<void>;
  closeModal: () => void;
  startRecording: () => void;
  handleRetake: () => Promise<void>;
  handleSubmit: () => Promise<void>;
}

export type LivenessRecorder = LivenessRecorderState & LivenessRecorderActions;

// ─── Camera constraints ───────────────────────────────────────────────────────

const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: "user",
  width: { ideal: 720 },
  height: { ideal: 960 },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLivenessRecorder(): LivenessRecorder {
  // ── State ──────────────────────────────────────────────────────────────────

  const [isOpen, setIsOpen] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [instructions, setInstructions] = React.useState<string[]>([]);
  const [countdown, setCountdown] = React.useState(3);
  const [recordingTime, setRecordingTime] = React.useState(10);
  const [recordedBlob, setRecordedBlob] = React.useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // ── Refs ───────────────────────────────────────────────────────────────────

  /**
   * Holds the live MediaStream from getUserMedia().
   * A ref (not state) because changing it must NOT trigger a re-render —
   * we only need it imperatively to attach to <video>.srcObject and to
   * stop tracks on cleanup.
   */
  const streamRef = React.useRef<MediaStream | null>(null);

  /**
   * Holds the active MediaRecorder instance.
   * Same rationale as streamRef — the recorder is imperative infrastructure,
   * not something the UI needs to observe directly.
   */
  const recorderRef = React.useRef<MediaRecorder | null>(null);

  /**
   * Holds the active setInterval ID (countdown or recording timer).
   * Storing in a ref lets clearActiveTimer() reach it from any callback
   * without stale-closure issues, because refs are always current.
   */
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  /** Passed to CameraViewfinder so it can attach the live stream. */
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  /** Passed to PreviewPanel so it can load the recorded blob URL. */
  const previewRef = React.useRef<HTMLVideoElement | null>(null);

  // ── Utilities ──────────────────────────────────────────────────────────────

  /** Cancels whichever setInterval is currently running (countdown or record). */
  const clearActiveTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  /**
   * Stops every track on the active MediaStream and clears the ref.
   * Stopping tracks is what turns off the browser's camera-in-use indicator.
   */
  const stopStream = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  /**
   * Revokes a blob: URL created with URL.createObjectURL().
   * Must be called whenever the URL is no longer needed to avoid memory leaks.
   * The browser holds a reference to the underlying buffer until revokeObjectURL
   * is called, even after the component re-renders with a new URL.
   */
  const revokePreview = React.useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  // ── Side-effects ───────────────────────────────────────────────────────────

  /**
   * Assigns the live MediaStream to the <video> element whenever we enter a
   * phase where the viewfinder should be active.
   *
   * Why a useEffect instead of doing it directly in openModal?
   * React batches state updates, so the DOM ref may not be populated by the
   * time openModal's synchronous code runs. The effect fires after the render
   * that sets phase → "ready", guaranteeing the element exists.
   */
  React.useEffect(() => {
    if (
      (phase === "ready" || phase === "countdown" || phase === "recording") &&
      videoRef.current &&
      streamRef.current
    ) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [phase]);

  /**
   * Assigns the recorded blob URL to the preview <video> element once we
   * enter the preview phase. Same reasoning as above — the DOM element is
   * only guaranteed to exist after the render.
   */
  React.useEffect(() => {
    if (phase === "preview" && previewRef.current && previewUrl) {
      previewRef.current.src = previewUrl;
    }
  }, [phase, previewUrl]);

  // ── Open ───────────────────────────────────────────────────────────────────

  /**
   * Opens the modal and immediately requests camera + mic.
   * On success  → phase "ready" (viewfinder is live).
   * On failure  → phase "denied" (permission fallback UI).
   */
  const openModal = React.useCallback(async () => {
    setIsOpen(true);
    setPhase("requesting");
    setError(null);
    setInstructions(pickInstructions(3));
    setRecordedBlob(null);
    setPreviewUrl((prev) => {
      revokePreview(prev);
      return null;
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: VIDEO_CONSTRAINTS,
        audio: true,
      });
      streamRef.current = stream;
      setPhase("ready");
    } catch {
      // getUserMedia throws DOMException on denial or hardware unavailability.
      stopStream();
      setPhase("denied");
    }
  }, [stopStream, revokePreview]);

  // ── Close ──────────────────────────────────────────────────────────────────

  /**
   * Tears everything down and resets all state to defaults.
   * Safe to call from any phase — it defensively stops the recorder and stream
   * regardless of whether they're active.
   */
  const closeModal = React.useCallback(() => {
    clearActiveTimer();
    recorderRef.current?.stop();
    recorderRef.current = null;
    stopStream();
    setPreviewUrl((prev) => {
      revokePreview(prev);
      return null;
    });
    setIsOpen(false);
    setPhase("idle");
    setCountdown(3);
    setRecordingTime(10);
    setRecordedBlob(null);
    setError(null);
  }, [stopStream, revokePreview]);

  // ── Record ─────────────────────────────────────────────────────────────────

  /**
   * Starts a 3-second countdown, then begins MediaRecorder capture for 10s.
   *
   * A single timerRef is reused for both the countdown interval and the
   * recording interval. The countdown clears itself before handing off to
   * the recording interval, so timerRef always points to the currently
   * active timer — making clearActiveTimer() reliable from any path.
   *
   * MediaRecorder is given `timeslice: 100` so ondataavailable fires every
   * 100 ms, producing small chunks. This guards against data loss if the
   * recorder is stopped before the internal buffer is flushed.
   */
  const startRecording = React.useCallback(() => {
    if (!streamRef.current) return;

    let count = 3;
    setCountdown(count);
    setPhase("countdown");

    timerRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);

      if (count === 0) {
        // Countdown finished — clear it before starting the recording interval.
        clearInterval(timerRef.current!);
        timerRef.current = null;

        const stream = streamRef.current;
        if (!stream) return;

        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm";

        const chunks: Blob[] = [];
        const recorder = new MediaRecorder(stream, { mimeType });

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        /**
         * onstop fires after recorder.stop() is called AND all pending
         * ondataavailable events have been flushed. Only here can we safely
         * assemble the final blob from all chunks.
         */
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          setRecordedBlob(blob);
          setPreviewUrl(url);
          // Camera no longer needed — turn off the in-use indicator.
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          setPhase("preview");
        };

        recorder.start(100);
        recorderRef.current = recorder;
        setPhase("recording");
        setRecordingTime(10);

        let timeLeft = 10;
        timerRef.current = setInterval(() => {
          timeLeft -= 1;
          setRecordingTime(timeLeft);
          if (timeLeft <= 0) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            // Calling stop() triggers onstop asynchronously after final flush.
            recorder.stop();
          }
        }, 1000);
      }
    }, 1000);
  }, []);

  // ── Retake ─────────────────────────────────────────────────────────────────

  /**
   * Discards the current recording and re-opens the camera for a new attempt.
   * New instructions are picked so the session stays unpredictable.
   */
  const handleRetake = React.useCallback(async () => {
    clearActiveTimer();
    recorderRef.current?.stop();
    recorderRef.current = null;
    stopStream();
    setPreviewUrl((prev) => {
      revokePreview(prev);
      return null;
    });
    setRecordedBlob(null);
    setInstructions(pickInstructions(3));
    setError(null);
    setPhase("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: VIDEO_CONSTRAINTS,
        audio: true,
      });
      streamRef.current = stream;
      setPhase("ready");
    } catch {
      setPhase("denied");
    }
  }, [stopStream, revokePreview]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  /**
   * Three-step submission pipeline:
   *
   * 1. getCloudinaryVideoSignature() — server action that returns a short-lived
   *    Cloudinary signature. The API secret never leaves the server.
   *
   * 2. Direct fetch to Cloudinary's /video/upload endpoint — the blob goes
   *    straight to Cloudinary's CDN, bypassing Next.js body-size limits.
   *    We send the signed params from step 1 alongside the file.
   *
   * 3. submitLiveness(videoUrl) — server action that writes the secure_url
   *    to the DB and flips verificationStatus → "pending_review".
   *
   * On any error we surface the message and fall back to "preview" so the
   * user can retry or retake without losing their recording.
   */
  const handleSubmit = React.useCallback(async () => {
    if (!recordedBlob) return;
    setPhase("submitting");
    setError(null);

    // Step 1 — get a signed upload token from the server.
    const sigResult = await getCloudinaryVideoSignature();
    if ("error" in sigResult) {
      setError(sigResult.error);
      setPhase("preview");
      return;
    }

    // Step 2 — POST blob directly to Cloudinary.
    const uploadForm = new FormData();
    uploadForm.append("file", recordedBlob, "liveness.webm");
    uploadForm.append("timestamp", String(sigResult.timestamp));
    uploadForm.append("signature", sigResult.signature);
    uploadForm.append("api_key", sigResult.apiKey);
    uploadForm.append("folder", sigResult.folder);
    uploadForm.append("resource_type", "video");

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${sigResult.cloudName}/video/upload`,
      { method: "POST", body: uploadForm },
    );

    if (!uploadRes.ok) {
      setError("Upload failed. Check your connection and try again.");
      setPhase("preview");
      return;
    }

    const { secure_url: videoUrl } = (await uploadRes.json()) as {
      secure_url: string;
    };

    // Step 3 — persist the URL and transition DB status.
    const result = await submitLiveness(videoUrl);
    if (result.error) {
      setError(result.error);
      setPhase("preview");
      return;
    }

    setPhase("submitted");
  }, [recordedBlob]);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    isOpen,
    phase,
    countdown,
    recordingTime,
    instructions,
    error,
    previewUrl,
    recordedBlob,
    videoRef,
    previewRef,
    openModal,
    closeModal,
    startRecording,
    handleRetake,
    handleSubmit,
  };
}
