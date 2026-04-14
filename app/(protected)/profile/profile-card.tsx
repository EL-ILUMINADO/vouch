"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import Link from "next/link";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { ProfilePhotos } from "./profile-photos";
import { toggleHideLevel, updateBio } from "./actions";

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
  bioHeadline?: string | null;
  intent?: string | null;
  socialEnergy?: string | null;
  energyVibe?: string | null;
  interests?: string[];
}

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
  intent,
  socialEnergy,
  energyVibe,
  interests = [],
}: Props) {
  const [profileImage, setProfileImage] = React.useState(initialProfileImage);
  const [hideLevel, setHideLevel] = React.useState(initialHideLevel);
  const [hideLevelPending, setHideLevelPending] = React.useState(false);

  // Bio editing state
  const [bioValue, setBioValue] = React.useState(bioHeadline ?? "");
  const [bioEditing, setBioEditing] = React.useState(false);
  const [bioPending, setBioPending] = React.useState(false);
  const [bioError, setBioError] = React.useState<string | null>(null);

  async function handleToggleHideLevel() {
    setHideLevelPending(true);
    const next = !hideLevel;
    setHideLevel(next); // optimistic
    const result = await toggleHideLevel(next);
    if (result.error) setHideLevel(!next); // revert on error
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
    }
    setBioPending(false);
  }

  function handleBioCancel() {
    setBioValue(bioHeadline ?? "");
    setBioEditing(false);
    setBioError(null);
  }

  return (
    <>
      {/* Avatar card */}
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
        </div>
      </div>

      {/* Bio section */}
      <div className="bg-card rounded-[2rem] p-6 border border-border space-y-4">
        {/* Bio headline — inline edit */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Bio
            </span>
            {!bioEditing && (
              <button
                onClick={() => setBioEditing(true)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors"
              >
                <Pencil className="w-2.5 h-2.5" />
                {bioValue ? "Edit" : "Add"}
              </button>
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
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {bioValue.length}/300
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleBioCancel}
                    disabled={bioPending}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors disabled:opacity-50"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                  <button
                    onClick={handleBioSave}
                    disabled={bioPending}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-colors disabled:opacity-50"
                  >
                    {bioPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Save
                  </button>
                </div>
              </div>
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

        <div className="flex flex-wrap gap-2">
          {intent && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20 px-3 py-1 rounded-full">
              {intent}
            </span>
          )}
          {socialEnergy && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-muted border border-border px-3 py-1 rounded-full text-muted-foreground">
              {socialEnergy}
            </span>
          )}
          {energyVibe && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-muted border border-border px-3 py-1 rounded-full text-muted-foreground">
              {energyVibe}
            </span>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Interests
            </span>
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

      {/* Privacy settings */}
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

      {/* Photo management — shares profileImage state via callback */}
      <ProfilePhotos
        initialImages={initialImages}
        initialProfileImage={profileImage}
        onProfileImageChange={setProfileImage}
      />
    </>
  );
}
