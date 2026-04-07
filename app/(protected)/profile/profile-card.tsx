"use client";

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
}

export function ProfileCard({
  name,
  university,
  department,
  level,
  verificationStatus,
  initialImages,
  initialProfileImage,
}: Props) {
  const [profileImage, setProfileImage] = React.useState(initialProfileImage);

  return (
    <>
      {/* Avatar card */}
      <div className="bg-card rounded-[2.5rem] p-8 shadow-sm border border-border text-center space-y-4">
        {profileImage ? (
          <div className="w-24 h-24 rounded-full mx-auto overflow-hidden shadow-xl ring-4 ring-indigo-600/30">
            <img
              src={profileImage}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-indigo-600 mx-auto flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-200 dark:shadow-none">
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

      {/* Photo management — shares profileImage state via callback */}
      <ProfilePhotos
        initialImages={initialImages}
        initialProfileImage={profileImage}
        onProfileImageChange={setProfileImage}
      />
    </>
  );
}
