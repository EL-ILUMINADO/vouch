"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { verifyCaptcha } from "@/app/actions/verify-captcha";
import {
  getTriviaBank,
  pickRandomQuestions,
  type TriviaQuestion,
} from "@/lib/constants/uniben-trivia";

// Types

type Phase = "idle" | "active" | "success" | "locked";

interface Props {
  isOpen: boolean;
  universityId: string; // e.g. "uniben" | "unilag"
  universityName: string; // e.g. "University of Benin"
  onSuccess: () => void;
  onClose?: () => void;
}

const QUESTIONS_PER_ATTEMPT = 3;
const MAX_ATTEMPTS = 3;
const SECONDS_PER_QUESTION = 10;

// Helpers

function formatCountdown(seconds: number): string {
  return seconds < 10 ? `0${seconds}` : `${seconds}`;
}

function timerColorClass(t: number): string {
  if (t > 6) return "bg-emerald-400";
  if (t > 3) return "bg-amber-400";
  return "bg-rose-500";
}

function timerTextClass(t: number): string {
  if (t > 6) return "text-emerald-400";
  if (t > 3) return "text-amber-400";
  return "text-rose-500";
}

// Component

export function HyperCaptchaModal({
  isOpen,
  universityId,
  universityName,
  onSuccess,
  onClose,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");

  // attempt tracking
  const [attemptNum, setAttemptNum] = useState(1);
  const [usedIds, setUsedIds] = useState<Set<number>>(new Set());

  // current attempt state
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // per-question state
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [chosen, setChosen] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  // result state
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(SECONDS_PER_QUESTION);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  // Attempt initialiser

  const startAttempt = useCallback(
    (attempt: number, prevUsedIds: Set<number>) => {
      const bank = getTriviaBank(universityId);
      const picked = pickRandomQuestions(
        bank,
        QUESTIONS_PER_ATTEMPT,
        prevUsedIds,
      );

      if (picked.length < QUESTIONS_PER_ATTEMPT) {
        // Not enough unseen questions — reset used IDs and try again from full bank
        const freshPicked = pickRandomQuestions(
          bank,
          QUESTIONS_PER_ATTEMPT,
          new Set(),
        );
        setQuestions(freshPicked);
        setUsedIds(new Set(freshPicked.map((q) => q.id)));
      } else {
        setQuestions(picked);
        setUsedIds(new Set([...prevUsedIds, ...picked.map((q) => q.id)]));
      }

      setAttemptNum(attempt);
      setQIndex(0);
      setCorrectCount(0);
      setChosen(null);
      setAnswered(false);
      setPhase("active");
    },
    [universityId],
  );

  // Start timer when a new question loads

  useEffect(() => {
    if (phase !== "active" || answered) return;
    startTimer();
    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex, answered]);

  // Auto-fail when timer hits 0

  useEffect(() => {
    if (phase !== "active" || answered || timeLeft > 0) return;
    // Time's up — treat as wrong answer
    setAnswered(true);
    stopTimer();
    // Move on after a short pause so the user sees the timeout feedback
    const timeout = setTimeout(() => advanceAfterAnswer(false), 1200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, answered]);

  // Answer handler

  function handleAnswer(option: string) {
    if (answered) return;
    stopTimer();
    setChosen(option);
    setAnswered(true);

    const isCorrect = option === questions[qIndex].answer;
    setTimeout(() => advanceAfterAnswer(isCorrect), 900);
  }

  // Advance logic

  function advanceAfterAnswer(wasCorrect: boolean) {
    const newCorrect = wasCorrect ? correctCount + 1 : correctCount;

    if (qIndex + 1 < QUESTIONS_PER_ATTEMPT) {
      // More questions in this attempt
      setCorrectCount(newCorrect);
      setQIndex((i) => i + 1);
      setChosen(null);
      setAnswered(false);
      return;
    }

    // Attempt complete
    if (newCorrect === QUESTIONS_PER_ATTEMPT) {
      // Passed — all 3 correct
      handleFinalResult(true);
    } else if (attemptNum < MAX_ATTEMPTS) {
      // Failed this attempt, but retries remain
      setCorrectCount(0);
      setChosen(null);
      setAnswered(false);
      startAttempt(attemptNum + 1, usedIds);
    } else {
      // All attempts exhausted
      handleFinalResult(false);
    }
  }

  // Final result

  async function handleFinalResult(passed: boolean) {
    setSubmitting(true);
    stopTimer();

    const result = await verifyCaptcha(passed);

    setSubmitting(false);

    if (passed && "success" in result) {
      setPhase("success");
      return;
    }

    if (!passed) {
      if ("lockedUntil" in result && result.lockedUntil) {
        setLockedUntil(new Date(result.lockedUntil));
      }
      setPhase("locked");
    }
  }

  // Reset on close

  function handleClose() {
    stopTimer();
    setPhase("idle");
    setAttemptNum(1);
    setUsedIds(new Set());
    setQuestions([]);
    setQIndex(0);
    setCorrectCount(0);
    setChosen(null);
    setAnswered(false);
    setLockedUntil(null);
    onClose?.();
  }

  // ─── Cleanup on unmount ──────────────────────────────────────────────────────

  useEffect(() => () => stopTimer(), [stopTimer]);

  if (!isOpen) return null;

  const currentQuestion = questions[qIndex];
  const progressDots = Array.from({ length: MAX_ATTEMPTS }, (_, i) => i + 1);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={phase === "idle" ? handleClose : undefined}
      />

      {/* Vault container */}
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
              <LockIcon className="h-3.5 w-3.5 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Culture Check
              </p>
              <p className="text-sm font-medium text-zinc-200">
                {universityName}
              </p>
            </div>
          </div>

          {(phase === "idle" || phase === "success" || phase === "locked") && (
            <button
              onClick={handleClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="Close"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── IDLE ─────────────────────────────────────────────────────────── */}
        {phase === "idle" && (
          <div className="flex flex-col items-center gap-6 px-6 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
              <ShieldIcon className="h-8 w-8 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-zinc-100">
                Prove You&apos;re a Real Student
              </h2>
              <p className="text-sm leading-relaxed text-zinc-400">
                Answer{" "}
                <span className="font-semibold text-zinc-200">
                  3 campus questions
                </span>{" "}
                correctly to unlock your profile. You have{" "}
                <span className="font-semibold text-zinc-200">3 attempts</span>{" "}
                and{" "}
                <span className="font-semibold text-zinc-200">10 seconds</span>{" "}
                per question.
              </p>
            </div>
            <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-left">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Rules
              </p>
              <ul className="space-y-1.5">
                {[
                  "3 random questions per attempt",
                  "10 second timer per question",
                  "Each attempt uses different questions",
                  "Fail all 3 attempts = 24h lockout",
                ].map((rule) => (
                  <li
                    key={rule}
                    className="flex items-center gap-2 text-sm text-zinc-400"
                  >
                    <span className="h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => startAttempt(1, new Set())}
              className="w-full rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400 active:scale-[0.98]"
            >
              Start Verification
            </button>
          </div>
        )}

        {/* ── ACTIVE ───────────────────────────────────────────────────────── */}
        {phase === "active" && currentQuestion && (
          <div className="flex flex-col gap-5 px-5 py-5">
            {/* Attempt indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {progressDots.map((n) => (
                  <div
                    key={n}
                    className={`h-1.5 w-6 rounded-full transition-colors ${
                      n < attemptNum
                        ? "bg-zinc-700"
                        : n === attemptNum
                          ? "bg-emerald-400"
                          : "bg-zinc-800"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-zinc-500">
                Attempt {attemptNum}/{MAX_ATTEMPTS} · Q{qIndex + 1}/
                {QUESTIONS_PER_ATTEMPT}
              </span>
            </div>

            {/* Timer bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Time</span>
                <span
                  className={`text-sm font-bold tabular-nums ${timerTextClass(timeLeft)}`}
                >
                  {formatCountdown(timeLeft)}s
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${timerColorClass(timeLeft)}`}
                  style={{
                    width: `${(timeLeft / SECONDS_PER_QUESTION) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="min-h-[64px] rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3.5">
              <p className="text-sm font-medium leading-snug text-zinc-100">
                {currentQuestion.question}
              </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-2.5">
              {currentQuestion.options.map((option) => {
                const isChosen = chosen === option;
                const isCorrect = option === currentQuestion.answer;
                const showFeedback = answered;

                let optionClass =
                  "relative flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all";

                if (!showFeedback) {
                  optionClass +=
                    " border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-100 active:scale-[0.98]";
                } else if (isCorrect) {
                  optionClass +=
                    " border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
                } else if (isChosen && !isCorrect) {
                  optionClass +=
                    " border-rose-500/40 bg-rose-500/10 text-rose-300";
                } else {
                  optionClass +=
                    " border-zinc-800 bg-zinc-900/30 text-zinc-600";
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={answered}
                    className={optionClass}
                  >
                    {showFeedback && isCorrect && (
                      <CheckIcon className="h-4 w-4 shrink-0 text-emerald-400" />
                    )}
                    {showFeedback && isChosen && !isCorrect && (
                      <XIcon className="h-4 w-4 shrink-0 text-rose-400" />
                    )}
                    {(!showFeedback || (!isCorrect && !isChosen)) && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-xs text-zinc-500">
                        {currentQuestion.options.indexOf(option) + 1}
                      </span>
                    )}
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Time expired notice */}
            {timeLeft === 0 && !chosen && answered && (
              <p className="text-center text-xs text-rose-400">
                Time&apos;s up — moving on…
              </p>
            )}

            {submitting && (
              <p className="text-center text-xs text-zinc-500">Verifying…</p>
            )}
          </div>
        )}

        {/* ── SUCCESS ──────────────────────────────────────────────────────── */}
        {phase === "success" && (
          <div className="flex flex-col items-center gap-6 px-6 py-10 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <UnlockIcon className="h-9 w-9 text-emerald-400" />
              <div className="absolute inset-0 animate-ping rounded-full border border-emerald-500/20" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-zinc-100">
                Vault Unlocked
              </h2>
              <p className="text-sm leading-relaxed text-zinc-400">
                You&apos;ve proven you&apos;re a real{" "}
                <span className="font-semibold text-zinc-200">
                  {universityName}
                </span>{" "}
                student. Your profile is now verified.
              </p>
            </div>
            <button
              onClick={() => {
                handleClose();
                onSuccess();
              }}
              className="w-full rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400 active:scale-[0.98]"
            >
              Continue to Vouch
            </button>
          </div>
        )}

        {/* ── LOCKED ───────────────────────────────────────────────────────── */}
        {phase === "locked" && (
          <div className="flex flex-col items-center gap-6 px-6 py-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10">
              <LockIcon className="h-9 w-9 text-rose-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-zinc-100">
                Access Locked
              </h2>
              <p className="text-sm leading-relaxed text-zinc-400">
                You failed all {MAX_ATTEMPTS} attempts. Your account has been
                locked for{" "}
                <span className="font-semibold text-rose-300">24 hours</span> to
                prevent abuse.
              </p>
              {lockedUntil && (
                <p className="text-xs text-zinc-600">
                  Unlocks at{" "}
                  {lockedUntil.toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              )}
            </div>
            <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-left">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                What now?
              </p>
              <p className="text-sm text-zinc-400">
                Come back after the lockout expires and try again. Make sure
                you&apos;re genuinely familiar with the{" "}
                <span className="text-zinc-200">{universityName}</span> campus.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-3.5 text-sm font-medium text-zinc-400 transition-all hover:bg-zinc-800 hover:text-zinc-200 active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inline SVG icons (no external icon library) ─────────────────────────────

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function UnlockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
