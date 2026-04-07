"use client";

import * as React from "react";
import {
  Camera,
  X,
  Lock,
  Loader2,
  ShieldAlert,
  Check,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { scanImage } from "@/lib/moderation";
import { deletePhoto, addPhoto, setProfilePhoto } from "./actions";

// Same compression logic as the onboarding photos page.
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Canvas not supported");
      const MAX = 1200;
      let w = img.width;
      let h = img.height;
      if (w > h ? w > MAX : h > MAX) {
        if (w > h) {
          h *= MAX / w;
          w = MAX;
        } else {
          w *= MAX / h;
          h = MAX;
        }
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface Props {
  initialImages: string[];
  initialProfileImage: string | null;
  onProfileImageChange?: (url: string | null) => void;
}

export function ProfilePhotos({
  initialImages,
  initialProfileImage,
  onProfileImageChange,
}: Props) {
  const [images, setImages] = React.useState(initialImages);
  const [profileImage, setProfileImage] = React.useState(initialProfileImage);

  const updateProfileImage = (url: string | null) => {
    setProfileImage(url);
    onProfileImageChange?.(url);
  };
  const [confirmDeleteUrl, setConfirmDeleteUrl] = React.useState<string | null>(
    null,
  );
  const [deletingUrl, setDeletingUrl] = React.useState<string | null>(null);
  const [settingProfileUrl, setSettingProfileUrl] = React.useState<
    string | null
  >(null);
  const [addPhase, setAddPhase] = React.useState<
    "idle" | "scanning" | "uploading"
  >("idle");
  const [addPreview, setAddPreview] = React.useState<string | null>(null);
  const [addError, setAddError] = React.useState<string | null>(null);

  const canDelete = images.length > 2;
  const canAdd = images.length < 4 && addPhase === "idle";

  // ── Delete flow ────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async (url: string) => {
    setConfirmDeleteUrl(null);
    setDeletingUrl(url);
    const result = await deletePhoto(url);
    setDeletingUrl(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      const remaining = images.filter((u) => u !== url);
      setImages(remaining);
      // Mirror the server-side auto-promote logic
      if (profileImage === url) updateProfileImage(remaining[0] ?? null);
      toast.success("Photo removed.");
    }
  };

  // ── Set profile photo ──────────────────────────────────────────────────────

  const handleSetProfilePhoto = async (url: string) => {
    setSettingProfileUrl(url);
    const result = await setProfilePhoto(url);
    setSettingProfileUrl(null);
    if (result?.error) {
      toast.error(result.error);
    } else {
      updateProfileImage(url);
      toast.success("Profile photo updated.");
    }
  };

  // ── Add flow ───────────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const preview = URL.createObjectURL(file);
    setAddPreview(preview);
    setAddError(null);
    setAddPhase("scanning");

    const scanResult = await scanImage(file);
    if (!scanResult.isSafe) {
      URL.revokeObjectURL(preview);
      setAddPreview(null);
      setAddPhase("idle");
      setAddError(scanResult.reason ?? "Inappropriate content detected.");
      toast.error("Photo failed security scan.");
      return;
    }

    setAddPhase("uploading");
    try {
      const base64 = await compressImage(file);
      const result = await addPhoto(base64);
      URL.revokeObjectURL(preview);
      setAddPreview(null);
      setAddPhase("idle");
      if (result.error) {
        setAddError(result.error);
        toast.error(result.error);
      } else {
        setImages((prev) => [...prev, result.url!]);
        toast.success("Photo added.");
      }
    } catch {
      URL.revokeObjectURL(preview);
      setAddPreview(null);
      setAddPhase("idle");
      setAddError("Upload failed. Please try again.");
      toast.error("Upload failed.");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
          Your Photos
        </h3>
        <span className="text-[10px] font-bold text-muted-foreground">
          {images.length} / 4
        </span>
      </div>

      {!canDelete && (
        <p className="text-[10px] text-muted-foreground px-2 italic">
          You need at least 2 photos. Add more before you can delete any.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {images.map((url) => {
          const isProfile = url === profileImage;
          const isBusy = deletingUrl === url || settingProfileUrl === url;
          return (
            <div
              key={url}
              className={`relative aspect-3/4 rounded-2xl overflow-hidden bg-muted border transition-colors ${
                isProfile
                  ? "border-indigo-500 ring-2 ring-indigo-500/30"
                  : "border-border"
              }`}
            >
              <img
                src={url}
                alt="Profile photo"
                className="w-full h-full object-cover"
              />

              {/* Crown badge on current profile photo */}
              {isProfile && (
                <div className="absolute top-2 left-2 bg-indigo-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    Profile
                  </span>
                </div>
              )}

              {/* Busy spinner (deleting or setting profile) */}
              {isBusy && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}

              {/* Confirm-delete overlay */}
              {!isBusy && confirmDeleteUrl === url && (
                <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3 p-3">
                  <p className="text-white text-xs font-bold text-center leading-snug">
                    Delete this photo?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteConfirm(url)}
                      className="p-2.5 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteUrl(null)}
                      className="p-2.5 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Idle controls: "Set as profile" + delete/lock */}
              {!isBusy && confirmDeleteUrl !== url && (
                <>
                  {/* Set as profile button — only on non-profile photos */}
                  {!isProfile && (
                    <button
                      onClick={() => handleSetProfilePhoto(url)}
                      className="absolute bottom-2 left-2 right-10 bg-black/60 hover:bg-indigo-600 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest py-1.5 rounded-full transition-colors flex items-center justify-center gap-1"
                    >
                      <Crown className="w-3 h-3" /> Set as Profile
                    </button>
                  )}

                  {/* Delete / lock */}
                  <button
                    onClick={() =>
                      canDelete ? setConfirmDeleteUrl(url) : undefined
                    }
                    disabled={!canDelete}
                    title={
                      canDelete ? "Remove photo" : "Need at least 2 photos"
                    }
                    className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-colors ${
                      canDelete
                        ? "bg-black/50 text-white hover:bg-red-500 cursor-pointer"
                        : "bg-black/30 text-white/40 cursor-not-allowed"
                    }`}
                  >
                    {canDelete ? <X size={13} /> : <Lock size={13} />}
                  </button>
                </>
              )}
            </div>
          );
        })}

        {/* In-progress tile while scanning / uploading */}
        {addPhase !== "idle" && addPreview && (
          <div className="relative aspect-3/4 rounded-2xl overflow-hidden border border-indigo-500/50 bg-muted">
            <img
              src={addPreview}
              alt="Processing"
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white bg-black/50 px-2 py-0.5 rounded-full">
                {addPhase === "scanning" ? "Scanning…" : "Uploading…"}
              </span>
            </div>
          </div>
        )}

        {/* Add photo tile */}
        {canAdd && (
          <label className="relative aspect-3/4 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-muted/50 cursor-pointer transition-colors">
            <Camera className="text-muted-foreground" size={22} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Add Photo
            </span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      {/* Scan / upload error banner */}
      {addError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-red-500">Photo rejected</p>
            <p className="text-[10px] text-red-400 mt-0.5 leading-relaxed">
              {addError}
            </p>
          </div>
          <button
            onClick={() => setAddError(null)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </section>
  );
}
