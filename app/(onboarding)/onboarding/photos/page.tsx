"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LaserScanner } from "@/components/onboarding/laser-scanner";
import {
  Camera,
  ShieldCheck,
  X,
  ShieldAlert,
  Check,
  UserCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { scanImage } from "@/lib/moderation";
import { uploadAndSavePhotos, getCurrentUserId } from "./actions";
import { setProfilePhoto } from "@/app/(protected)/profile/actions";

// In-Browser Compression Utility
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Canvas not supported");

      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };

    img.onerror = (err) => reject(err);
    img.src = url;
  });
};

type Status =
  | "idle"
  | "scanning"
  | "uploaded"
  | "picking"
  | "confirming"
  | "failed";

export default function PhotosPage() {
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [botMessage, setBotMessage] = useState("Initializing Security...");
  const [failedIndices, setFailedIndices] = useState<number[]>([]);
  const [scanErrors, setScanErrors] = useState<string[]>([]);

  // After upload: Cloudinary URLs for the picking step
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [selectedProfileUrl, setSelectedProfileUrl] = useState<string | null>(
    null,
  );

  React.useEffect(() => {
    getCurrentUserId().then(setCurrentUserId);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 4) {
      return toast.error("Maximum 4 photos allowed");
    }
    setFiles([...files, ...selectedFiles]);
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const startSecurityScan = async () => {
    if (files.length < 2) return toast.error("Upload at least 2 photos");
    if (!currentUserId) return toast.error("User session not found.");

    setStatus("scanning");
    setBotMessage("Initializing Security...");
    setProgress(5);
    setFailedIndices([]);
    setScanErrors([]);

    try {
      const results = await Promise.all(files.map((f) => scanImage(f)));

      const failed = results.reduce<number[]>((acc, r, i) => {
        if (!r.isSafe) acc.push(i);
        return acc;
      }, []);

      if (failed.length > 0) {
        const errors = failed.map(
          (i) =>
            `Photo ${i + 1}: ${results[i].reason ?? "Inappropriate content"}`,
        );
        console.warn("[NSFW Scan] Blocked images:", errors);
        setFailedIndices(failed);
        setScanErrors(errors);
        setStatus("failed");
        setBotMessage("Security Breach: Inappropriate Content Detected");
        toast.error(
          `${failed.length} photo${failed.length > 1 ? "s" : ""} failed the security scan.`,
        );
        return;
      }

      const base64Images = await Promise.all(files.map(compressImage));
      const uploadTask = uploadAndSavePhotos(currentUserId, base64Images);

      const theaterTask = new Promise((resolve) => {
        let currentProgress = 5;
        const interval = setInterval(() => {
          currentProgress += 1;
          setProgress(currentProgress);
          if (currentProgress === 25)
            setBotMessage("Neural pattern analysis...");
          if (currentProgress === 50)
            setBotMessage("Encrypting visual data...");
          if (currentProgress === 75)
            setBotMessage("Campus compliance check...");
          if (currentProgress >= 100) {
            clearInterval(interval);
            resolve(true);
          }
        }, 150);
      });

      type UploadResult = { success: boolean; urls?: string[] };
      const [uploadResult] = await Promise.all([uploadTask, theaterTask]);

      if ((uploadResult as UploadResult).success) {
        setUploadedUrls((uploadResult as UploadResult).urls ?? []);
        setSelectedProfileUrl((uploadResult as UploadResult).urls?.[0] ?? null);
        setStatus("picking");
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error(error);
      setStatus("failed");
      setBotMessage("Scan Error: System Timeout");
      toast.error("Vetting failed. Check your connection.");
    }
  };

  const confirmProfilePhoto = async () => {
    if (!selectedProfileUrl) return;
    setStatus("confirming");
    const result = await setProfilePhoto(selectedProfileUrl);
    if (result?.error) {
      toast.error(result.error);
      setStatus("picking");
    } else {
      router.push("/onboarding/verify");
    }
  };

  // ── Picking step — replaces the whole page ─────────────────────────────────
  if (status === "picking" || status === "confirming") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 max-w-md mx-auto">
        <div className="w-full text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-indigo-600/15 flex items-center justify-center mx-auto mb-4">
            <UserCircle2 className="w-6 h-6 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">
            Your Profile Photo
          </h1>
          <p className="text-muted-foreground text-sm">
            Choose which photo others will see first.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full mb-8">
          {uploadedUrls.map((url) => {
            const isSelected = url === selectedProfileUrl;
            return (
              <button
                key={url}
                onClick={() => setSelectedProfileUrl(url)}
                disabled={status === "confirming"}
                className={`relative aspect-3/4 rounded-2xl overflow-hidden border-2 transition-all ${
                  isSelected
                    ? "border-indigo-500 ring-2 ring-indigo-500/40 scale-[1.02]"
                    : "border-border opacity-60 hover:opacity-80"
                }`}
              >
                <img
                  src={url}
                  alt="Option"
                  className="w-full h-full object-cover"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-indigo-500/20 flex items-end justify-center pb-3">
                    <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={confirmProfilePhoto}
            disabled={!selectedProfileUrl || status === "confirming"}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
          >
            {status === "confirming" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              <>Confirm & Continue</>
            )}
          </button>
        </div>
      </main>
    );
  }

  // ── Default upload step ────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      <div className="w-full text-center mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-2">
          Vouch Security
        </h1>
        <p className="text-muted-foreground text-sm">
          Upload 2-4 clear photos of yourself to enter the Domain.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full mb-8">
        {previews.map((src, i) => (
          <div
            key={i}
            className={`relative aspect-3/4 rounded-2xl bg-muted overflow-hidden border group transition-colors ${
              failedIndices.includes(i)
                ? "border-red-500 ring-2 ring-red-500/40"
                : "border-border"
            }`}
          >
            <img
              src={src}
              className="w-full h-full object-cover"
              alt="Preview"
            />
            {failedIndices.includes(i) && (
              <div className="absolute inset-0 bg-red-500/30 flex flex-col items-center justify-center gap-1">
                <ShieldAlert className="w-7 h-7 text-red-500 drop-shadow" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white bg-red-500 px-2 py-0.5 rounded-full">
                  Flagged
                </span>
              </div>
            )}
            {status === "idle" && (
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            )}
            <LaserScanner isScanning={status === "scanning"} />
          </div>
        ))}

        {previews.length < 4 && status === "idle" && (
          <label className="relative aspect-3/4 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-muted/50 cursor-pointer transition-colors">
            <Camera className="text-muted-foreground" size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Add Photo
            </span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              multiple
            />
          </label>
        )}
      </div>

      <div className="w-full space-y-6">
        {status === "scanning" && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-end">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500">
                {botMessage}
              </p>
              <p className="text-xs font-mono font-bold text-muted-foreground">
                {Math.round(progress)}%
              </p>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-150 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {status === "idle" && (
          <button
            disabled={files.length < 2}
            onClick={startSecurityScan}
            className="w-full py-4 bg-foreground text-background rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
          >
            <ShieldCheck size={18} />
            Begin Security Vetting
          </button>
        )}

        {status === "failed" && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-red-500">
                {botMessage}
              </p>
              {scanErrors.map((msg, i) => (
                <p key={i} className="text-xs text-red-400 font-medium">
                  • {msg}
                </p>
              ))}
              <p className="text-[10px] text-muted-foreground pt-1">
                Remove the flagged photo{scanErrors.length > 1 ? "s" : ""} and
                try again.
              </p>
            </div>
            <button
              onClick={() => {
                setStatus("idle");
                setFailedIndices([]);
                setScanErrors([]);
              }}
              className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold transition-all active:scale-95"
            >
              Reset Security Protocol
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
