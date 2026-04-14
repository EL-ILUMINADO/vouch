"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import Link from "next/link";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProfilePhotos } from "./profile-photos";
import {
  toggleHideLevel,
  updateBio,
  updateVibeFields,
  updateDeepDives,
  updatePrompt,
  updateOnboardingAnswers,
} from "./actions";

// ─── Option lists (mirror onboarding wizard) ───────────────────────────────

const INTENT_OPTIONS = [
  "Long-term",
  "Short-term",
  "Casual/Friends",
  "Networking",
  "Not sure",
];
const SOCIAL_ENERGY_OPTIONS = ["Extrovert", "Introvert", "Ambivert"];
const ENERGY_VIBE_OPTIONS = [
  "Highly Spontaneous",
  "Calculated & Planned",
  "A bit of both",
];
const RELATIONSHIP_STYLE_OPTIONS = [
  "Traditional",
  "Modern/Equal",
  "Independent",
  "Still figuring it out",
];
const CONFLICT_STYLE_OPTIONS = [
  "Direct & Immediate",
  "Need time to process",
  "Avoidant (Working on it)",
];
const PROMPT_QUESTIONS = [
  "The most spontaneous thing I've done is…",
  "You'll win me over if you…",
  "A green flag I look for is…",
  "Hot take:",
  "My version of a perfect Sunday is…",
  "I'll know we're a match if…",
  "The thing I'm most proud of is…",
  "Two truths and a lie:",
  "Change my mind:",
  "I'd describe myself as…",
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  name: string;
  email: string;
  university: string;
  department: string;
  level: string;
  hideLevel: boolean;
  verificationStatus: string;
  initialImages: string[];
  initialProfileImage: string | null;
  // Bio
  bioHeadline?: string | null;
  interests?: string[];
  // Phase 1 — basics
  gender?: string | null;
  lookingFor?: string | null;
  intent?: string | null;
  relationshipStyle?: string | null;
  energyVibe?: string | null;
  // Phase 2 — lifestyle
  socialEnergy?: string | null;
  // Phase 3 — deep
  conflictStyle?: string | null;
  dealBreakers?: string | null;
  // Text fields
  lifestyleSnapshot?: string | null;
  relationshipVision?: string | null;
  // Phase 4 — hook
  promptQuestion?: string | null;
  promptAnswer?: string | null;
  // JSONB quick takes
  passionSignal?: string | null;
  misunderstoodTrait?: string | null;
  growthFocus?: string | null;
  weekendActivity?: string | null;
  happinessTrigger?: string | null;
}

// ─── Tiny helpers ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  );
}

function EditBtn({
  onClick,
  label = "Edit",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors"
    >
      <Pencil className="w-2.5 h-2.5" />
      {label}
    </button>
  );
}

function SaveCancelRow({
  onSave,
  onCancel,
  pending,
  charCount,
  maxChars,
}: {
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
  charCount?: number;
  maxChars?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      {charCount !== undefined && maxChars !== undefined ? (
        <span className="text-[10px] text-muted-foreground">
          {charCount}/{maxChars}
        </span>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={pending}
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors disabled:opacity-50"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={pending}
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-colors disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Check className="w-3 h-3" />
          )}
          Save
        </button>
      </div>
    </div>
  );
}

function PillPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? "" : opt)}
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
              value === opt
                ? "bg-rose-500 border-rose-500 text-white"
                : "bg-muted border-border text-muted-foreground hover:border-rose-400/60"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function ProfileCard({
  name,
  email,
  university,
  department,
  level,
  hideLevel: initialHideLevel,
  verificationStatus,
  initialImages,
  initialProfileImage,
  bioHeadline,
  interests = [],
  gender,
  lookingFor,
  intent,
  relationshipStyle,
  energyVibe,
  socialEnergy,
  conflictStyle,
  dealBreakers,
  lifestyleSnapshot,
  relationshipVision,
  promptQuestion,
  promptAnswer,
  passionSignal,
  misunderstoodTrait,
  growthFocus,
  weekendActivity,
  happinessTrigger,
}: Props) {
  // ── Shared ──
  const [profileImage, setProfileImage] = React.useState(initialProfileImage);
  const [hideLevel, setHideLevel] = React.useState(initialHideLevel);
  const [hideLevelPending, setHideLevelPending] = React.useState(false);

  // ── Bio ──
  const [bioValue, setBioValue] = React.useState(bioHeadline ?? "");
  const [bioEditing, setBioEditing] = React.useState(false);
  const [bioPending, setBioPending] = React.useState(false);
  const [bioError, setBioError] = React.useState<string | null>(null);

  // ── Vibe fields (grouped edit) ──
  const [vibeValues, setVibeValues] = React.useState({
    intent: intent ?? "",
    socialEnergy: socialEnergy ?? "",
    energyVibe: energyVibe ?? "",
    relationshipStyle: relationshipStyle ?? "",
    conflictStyle: conflictStyle ?? "",
  });
  const [vibeEditing, setVibeEditing] = React.useState(false);
  const [vibeDraft, setVibeDraft] = React.useState({ ...vibeValues });
  const [vibePending, setVibePending] = React.useState(false);

  // ── Deep dive text fields (one at a time) ──
  const [deepValues, setDeepValues] = React.useState({
    lifestyle: lifestyleSnapshot ?? "",
    dealBreakers: dealBreakers ?? "",
    vision: relationshipVision ?? "",
  });
  type DeepField = keyof typeof deepValues;
  const [editingDeepField, setEditingDeepField] =
    React.useState<DeepField | null>(null);
  const [deepDraft, setDeepDraft] = React.useState("");
  const [deepPending, setDeepPending] = React.useState(false);
  const [deepError, setDeepError] = React.useState<string | null>(null);

  // ── Prompt (grouped) ──
  const [promptValues, setPromptValues] = React.useState({
    question: promptQuestion ?? "",
    answer: promptAnswer ?? "",
  });
  const [promptEditing, setPromptEditing] = React.useState(false);
  const [promptDraft, setPromptDraft] = React.useState({ ...promptValues });
  const [promptPending, setPromptPending] = React.useState(false);
  const [promptError, setPromptError] = React.useState<string | null>(null);

  // ── Quick takes (JSONB – one at a time) ──
  const [quickValues, setQuickValues] = React.useState({
    passion: passionSignal ?? "",
    misunderstood: misunderstoodTrait ?? "",
    growth: growthFocus ?? "",
    weekend: weekendActivity ?? "",
    happiness: happinessTrigger ?? "",
  });
  type QuickField = keyof typeof quickValues;
  const [editingQuickField, setEditingQuickField] =
    React.useState<QuickField | null>(null);
  const [quickDraft, setQuickDraft] = React.useState("");
  const [quickPending, setQuickPending] = React.useState(false);
  const [quickError, setQuickError] = React.useState<string | null>(null);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleToggleHideLevel() {
    setHideLevelPending(true);
    const next = !hideLevel;
    setHideLevel(next);
    const result = await toggleHideLevel(next);
    if (result.error) setHideLevel(!next);
    setHideLevelPending(false);
  }

  async function handleBioSave() {
    setBioPending(true);
    setBioError(null);
    const result = await updateBio(bioValue);
    if (result.error) {
      setBioError(result.error);
    } else {
      setBioEditing(false);
      toast.success("Bio updated.");
    }
    setBioPending(false);
  }

  function handleBioCancel() {
    setBioValue(bioHeadline ?? "");
    setBioEditing(false);
    setBioError(null);
  }

  // Vibe
  function handleVibeEdit() {
    setVibeDraft({ ...vibeValues });
    setVibeEditing(true);
  }
  function handleVibeCancel() {
    setVibeEditing(false);
  }
  async function handleVibeSave() {
    setVibePending(true);
    const result = await updateVibeFields({
      intent: vibeDraft.intent || null,
      socialEnergy: vibeDraft.socialEnergy || null,
      energyVibe: vibeDraft.energyVibe || null,
      relationshipStyle: vibeDraft.relationshipStyle || null,
      conflictStyle: vibeDraft.conflictStyle || null,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      setVibeValues({ ...vibeDraft });
      setVibeEditing(false);
      toast.success("Vibe updated.");
    }
    setVibePending(false);
  }

  // Deep dives
  function handleDeepEdit(field: DeepField) {
    setDeepDraft(deepValues[field]);
    setEditingDeepField(field);
    setDeepError(null);
  }
  function handleDeepCancel() {
    setEditingDeepField(null);
    setDeepError(null);
  }
  async function handleDeepSave(field: DeepField) {
    setDeepPending(true);
    setDeepError(null);
    const newValues = { ...deepValues, [field]: deepDraft.trim() };
    const result = await updateDeepDives({
      lifestyleSnapshot: newValues.lifestyle || null,
      dealBreakers: newValues.dealBreakers || null,
      relationshipVision: newValues.vision || null,
    });
    if (result.error) {
      setDeepError(result.error);
    } else {
      setDeepValues(newValues);
      setEditingDeepField(null);
      toast.success("Saved.");
    }
    setDeepPending(false);
  }

  // Prompt
  function handlePromptEdit() {
    setPromptDraft({ ...promptValues });
    setPromptEditing(true);
    setPromptError(null);
  }
  function handlePromptCancel() {
    setPromptEditing(false);
    setPromptError(null);
  }
  async function handlePromptSave() {
    setPromptPending(true);
    setPromptError(null);
    const result = await updatePrompt({
      promptQuestion: promptDraft.question || null,
      promptAnswer: promptDraft.answer || null,
    });
    if (result.error) {
      setPromptError(result.error);
    } else {
      setPromptValues({ ...promptDraft });
      setPromptEditing(false);
      toast.success("Prompt updated.");
    }
    setPromptPending(false);
  }

  // Quick takes
  const QUICK_KEY_MAP: Record<QuickField, string> = {
    passion: "passion_signal",
    misunderstood: "misunderstood_trait",
    growth: "growth_focus",
    weekend: "weekend_activity",
    happiness: "happiness_trigger",
  };
  function handleQuickEdit(field: QuickField) {
    setQuickDraft(quickValues[field]);
    setEditingQuickField(field);
    setQuickError(null);
  }
  function handleQuickCancel() {
    setEditingQuickField(null);
    setQuickError(null);
  }
  async function handleQuickSave(field: QuickField) {
    setQuickPending(true);
    setQuickError(null);
    const trimmed = quickDraft.trim();
    const result = await updateOnboardingAnswers({
      [QUICK_KEY_MAP[field]]: trimmed || null,
    });
    if (result.error) {
      setQuickError(result.error);
    } else {
      setQuickValues((prev) => ({ ...prev, [field]: trimmed }));
      setEditingQuickField(null);
      toast.success("Saved.");
    }
    setQuickPending(false);
  }

  // ─── Derived ───────────────────────────────────────────────────────────────

  const hasAnyQuickTake = Object.values(quickValues).some((v) => v);
  const hasAnyVibe = Object.values(vibeValues).some((v) => v);
  const hasAnyDeep = Object.values(deepValues).some((v) => v);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Avatar card ── */}
      <div className="bg-card rounded-[2.5rem] p-8 shadow-sm border border-border text-center space-y-4">
        {profileImage ? (
          <div className="w-24 h-24 rounded-full mx-auto overflow-hidden shadow-xl ring-4 ring-rose-400/30">
            <img
              src={profileImage}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-linear-to-br from-rose-400 to-pink-500 mx-auto flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-rose-200 dark:shadow-none">
            {name[0].toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">
            {name}
          </h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {verificationStatus === "verified"
              ? "Verified Student"
              : "Unverified"}{" "}
            {"// "}
            {university}
          </p>
          <p className="text-[10px] font-medium text-muted-foreground/60 mt-1">
            {department} · {level}
          </p>
          <p className="text-[11px] font-mono text-muted-foreground/50 mt-1.5 tracking-tight">
            {email}
          </p>
          {/* Identity at-a-glance */}
          {(gender || lookingFor) && (
            <div className="flex justify-center gap-2 mt-3 flex-wrap">
              {gender && (
                <span className="text-[9px] font-black uppercase tracking-widest bg-muted border border-border px-2.5 py-1 rounded-full text-muted-foreground">
                  {gender}
                </span>
              )}
              {lookingFor && (
                <span className="text-[9px] font-black uppercase tracking-widest bg-muted border border-border px-2.5 py-1 rounded-full text-muted-foreground">
                  Into {lookingFor}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bio + Interests ── */}
      <div className="bg-card rounded-[2rem] p-6 border border-border space-y-4">
        {/* Bio headline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Bio</SectionLabel>
            {!bioEditing && (
              <EditBtn
                onClick={() => setBioEditing(true)}
                label={bioValue ? "Edit" : "Add"}
              />
            )}
          </div>

          {bioEditing ? (
            <div className="space-y-2">
              <textarea
                value={bioValue}
                onChange={(e) => setBioValue(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Write something about yourself…"
                className="w-full text-sm bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition"
              />
              <SaveCancelRow
                onSave={handleBioSave}
                onCancel={handleBioCancel}
                pending={bioPending}
                charCount={bioValue.length}
                maxChars={300}
              />
              {bioError && (
                <p className="text-[10px] text-red-500">{bioError}</p>
              )}
            </div>
          ) : bioValue ? (
            <p className="text-sm text-foreground leading-relaxed italic">
              &ldquo;{bioValue}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No bio yet —{" "}
              <button
                onClick={() => setBioEditing(true)}
                className="text-rose-500 hover:text-rose-600 font-semibold"
              >
                add one
              </button>
              .
            </p>
          )}
        </div>

        {/* Interests */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Interests</SectionLabel>
            <Link
              href="/profile/edit-interests"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors"
            >
              <Pencil className="w-2.5 h-2.5" />
              Edit
            </Link>
          </div>
          {interests.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {interests.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-bold bg-muted/50 border border-border px-2.5 py-1 rounded-full text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No interests yet —{" "}
              <Link
                href="/profile/edit-interests"
                className="text-rose-500 hover:text-rose-600 font-semibold"
              >
                add some
              </Link>{" "}
              to get better matches.
            </p>
          )}
        </div>
      </div>

      {/* ── Your Vibe ── */}
      <div className="bg-card rounded-[2rem] p-6 border border-border space-y-4">
        <div className="flex items-center justify-between">
          <SectionLabel>Your Vibe</SectionLabel>
          {!vibeEditing && (
            <EditBtn
              onClick={handleVibeEdit}
              label={hasAnyVibe ? "Edit" : "Add"}
            />
          )}
        </div>

        {vibeEditing ? (
          <div className="space-y-4">
            <PillPicker
              label="Intent"
              options={INTENT_OPTIONS}
              value={vibeDraft.intent}
              onChange={(v) => setVibeDraft((d) => ({ ...d, intent: v }))}
            />
            <PillPicker
              label="Social energy"
              options={SOCIAL_ENERGY_OPTIONS}
              value={vibeDraft.socialEnergy}
              onChange={(v) => setVibeDraft((d) => ({ ...d, socialEnergy: v }))}
            />
            <PillPicker
              label="Energy vibe"
              options={ENERGY_VIBE_OPTIONS}
              value={vibeDraft.energyVibe}
              onChange={(v) => setVibeDraft((d) => ({ ...d, energyVibe: v }))}
            />
            <PillPicker
              label="Relationship style"
              options={RELATIONSHIP_STYLE_OPTIONS}
              value={vibeDraft.relationshipStyle}
              onChange={(v) =>
                setVibeDraft((d) => ({ ...d, relationshipStyle: v }))
              }
            />
            <PillPicker
              label="Conflict style"
              options={CONFLICT_STYLE_OPTIONS}
              value={vibeDraft.conflictStyle}
              onChange={(v) =>
                setVibeDraft((d) => ({ ...d, conflictStyle: v }))
              }
            />
            <SaveCancelRow
              onSave={handleVibeSave}
              onCancel={handleVibeCancel}
              pending={vibePending}
            />
          </div>
        ) : hasAnyVibe ? (
          <div className="flex flex-wrap gap-2">
            {vibeValues.intent && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20 px-3 py-1 rounded-full">
                {vibeValues.intent}
              </span>
            )}
            {vibeValues.socialEnergy && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-muted border border-border px-3 py-1 rounded-full text-muted-foreground">
                {vibeValues.socialEnergy}
              </span>
            )}
            {vibeValues.energyVibe && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-muted border border-border px-3 py-1 rounded-full text-muted-foreground">
                {vibeValues.energyVibe}
              </span>
            )}
            {vibeValues.relationshipStyle && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-muted border border-border px-3 py-1 rounded-full text-muted-foreground">
                {vibeValues.relationshipStyle}
              </span>
            )}
            {vibeValues.conflictStyle && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-muted border border-border px-3 py-1 rounded-full text-muted-foreground">
                {vibeValues.conflictStyle}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Nothing here yet —{" "}
            <button
              onClick={handleVibeEdit}
              className="text-rose-500 hover:text-rose-600 font-semibold"
            >
              fill in your vibe
            </button>
            .
          </p>
        )}
      </div>

      {/* ── Your Story (deep dive text fields) ── */}
      <div className="bg-card rounded-[2rem] p-6 border border-border space-y-5">
        <SectionLabel>Your Story</SectionLabel>

        {(
          [
            {
              field: "lifestyle" as DeepField,
              label: "Lifestyle snapshot",
              placeholder: "Your lifestyle in a snapshot…",
            },
            {
              field: "dealBreakers" as DeepField,
              label: "Deal-breakers",
              placeholder: "Hard nos for you?",
            },
            {
              field: "vision" as DeepField,
              label: "Relationship vision",
              placeholder: "What does your ideal relationship look like?",
            },
          ] as const
        ).map(({ field, label, placeholder }) => (
          <div key={field} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {label}
              </p>
              {editingDeepField !== field && (
                <EditBtn
                  onClick={() => handleDeepEdit(field)}
                  label={deepValues[field] ? "Edit" : "Add"}
                />
              )}
            </div>

            {editingDeepField === field ? (
              <div className="space-y-2">
                <textarea
                  value={deepDraft}
                  onChange={(e) => setDeepDraft(e.target.value)}
                  maxLength={80}
                  rows={2}
                  placeholder={placeholder}
                  className="w-full text-sm bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition"
                />
                <SaveCancelRow
                  onSave={() => handleDeepSave(field)}
                  onCancel={handleDeepCancel}
                  pending={deepPending}
                  charCount={deepDraft.length}
                  maxChars={80}
                />
                {deepError && (
                  <p className="text-[10px] text-red-500">{deepError}</p>
                )}
              </div>
            ) : deepValues[field] ? (
              <p className="text-sm text-foreground leading-relaxed">
                {deepValues[field]}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Not filled in yet.
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Your Prompt ── */}
      <div className="bg-card rounded-[2rem] p-6 border border-border space-y-4">
        <div className="flex items-center justify-between">
          <SectionLabel>Your Prompt</SectionLabel>
          {!promptEditing && (
            <EditBtn
              onClick={handlePromptEdit}
              label={promptValues.question ? "Edit" : "Add"}
            />
          )}
        </div>

        {promptEditing ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground">
                Choose a prompt
              </p>
              <div className="space-y-1">
                {PROMPT_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() =>
                      setPromptDraft((d) => ({
                        ...d,
                        question: d.question === q ? "" : q,
                      }))
                    }
                    className={`w-full text-left text-xs px-3 py-2 rounded-xl border transition-colors ${
                      promptDraft.question === q
                        ? "bg-rose-500/10 border-rose-500/40 text-rose-500 font-bold"
                        : "bg-muted/50 border-border text-muted-foreground hover:border-rose-400/40"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground">
                Your answer
              </p>
              <textarea
                value={promptDraft.answer}
                onChange={(e) =>
                  setPromptDraft((d) => ({ ...d, answer: e.target.value }))
                }
                maxLength={120}
                rows={2}
                placeholder="Your answer…"
                className="w-full text-sm bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition"
              />
            </div>
            <SaveCancelRow
              onSave={handlePromptSave}
              onCancel={handlePromptCancel}
              pending={promptPending}
              charCount={promptDraft.answer.length}
              maxChars={120}
            />
            {promptError && (
              <p className="text-[10px] text-red-500">{promptError}</p>
            )}
          </div>
        ) : promptValues.question ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground">
              {promptValues.question}
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {promptValues.answer || (
                <span className="italic text-muted-foreground">
                  No answer yet.
                </span>
              )}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            No prompt set yet —{" "}
            <button
              onClick={handlePromptEdit}
              className="text-rose-500 hover:text-rose-600 font-semibold"
            >
              add one
            </button>
            .
          </p>
        )}
      </div>

      {/* ── Quick Takes (JSONB fields) — only render if at least one value ── */}
      {(hasAnyQuickTake || editingQuickField !== null) && (
        <div className="bg-card rounded-[2rem] p-6 border border-border space-y-5">
          <SectionLabel>More About You</SectionLabel>

          {(
            [
              {
                field: "passion" as QuickField,
                label: "I could talk for hours about…",
                placeholder: "Your biggest passion…",
              },
              {
                field: "misunderstood" as QuickField,
                label: "People tend to misread me as…",
                placeholder: "What people get wrong about you…",
              },
              {
                field: "growth" as QuickField,
                label: "What I'm actively working on…",
                placeholder: "Your current growth focus…",
              },
              {
                field: "weekend" as QuickField,
                label: "My typical weekend…",
                placeholder: "What your weekend looks like…",
              },
              {
                field: "happiness" as QuickField,
                label: "What genuinely makes me happy…",
                placeholder: "Your happiness trigger…",
              },
            ] as const
          )
            .filter(
              ({ field }) => quickValues[field] || editingQuickField === field,
            )
            .map(({ field, label, placeholder }) => (
              <div key={field} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {label}
                  </p>
                  {editingQuickField !== field && (
                    <EditBtn
                      onClick={() => handleQuickEdit(field)}
                      label="Edit"
                    />
                  )}
                </div>

                {editingQuickField === field ? (
                  <div className="space-y-2">
                    <textarea
                      value={quickDraft}
                      onChange={(e) => setQuickDraft(e.target.value)}
                      maxLength={80}
                      rows={2}
                      placeholder={placeholder}
                      className="w-full text-sm bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition"
                    />
                    <SaveCancelRow
                      onSave={() => handleQuickSave(field)}
                      onCancel={handleQuickCancel}
                      pending={quickPending}
                      charCount={quickDraft.length}
                      maxChars={80}
                    />
                    {quickError && (
                      <p className="text-[10px] text-red-500">{quickError}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-foreground leading-relaxed">
                    {quickValues[field]}
                  </p>
                )}
              </div>
            ))}
        </div>
      )}

      {/* ── Privacy settings ── */}
      <div className="bg-card rounded-3xl border border-border shadow-sm p-4 flex justify-between items-center">
        <div>
          <span className="block text-sm font-bold text-foreground">
            Hide Academic Level
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
            {hideLevel
              ? "Level hidden on Discover"
              : "Level visible on Discover"}
          </span>
        </div>
        <button
          onClick={handleToggleHideLevel}
          disabled={hideLevelPending}
          aria-label="Toggle hide level"
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60 ${
            hideLevel ? "bg-rose-500" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              hideLevel ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* ── Photo management ── */}
      <ProfilePhotos
        initialImages={initialImages}
        initialProfileImage={profileImage}
        onProfileImageChange={setProfileImage}
      />
    </>
  );
}
