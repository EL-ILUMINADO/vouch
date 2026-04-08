"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { ProfilePhotos } from "./profile-photos";

interface Props {
  name: string;
  university: string;
  department: string;
  level: string;
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
  university,
  department,
  level,
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
        </div>
      </div>

      {/* Bio section */}
      {(bioHeadline || intent || interests.length > 0) && (
        <div className="bg-card rounded-[2rem] p-6 border border-border space-y-4">
          {bioHeadline && (
            <p className="text-sm text-foreground leading-relaxed italic">
              &ldquo;{bioHeadline}&rdquo;
            </p>
          )}
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
          {interests.length > 0 && (
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
          )}
        </div>
      )}

      {/* Photo management — shares profileImage state via callback */}
      <ProfilePhotos
        initialImages={initialImages}
        initialProfileImage={profileImage}
        onProfileImageChange={setProfileImage}
      />
    </>
  );
}
