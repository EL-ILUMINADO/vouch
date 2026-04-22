export const VERIFICATION_STATUS_STYLE: Record<string, string> = {
  verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  pending_review: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  banned: "bg-red-900/20 text-red-300 border-red-700/40",
  unverified: "bg-zinc-700/40 text-zinc-400 border-zinc-600/40",
  suspended: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

export const REPORT_STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-900/50 text-amber-400 border-amber-800",
  reviewed: "bg-blue-900/50 text-blue-400 border-blue-800",
  dismissed: "bg-zinc-800 text-zinc-500 border-zinc-700",
  action_taken: "bg-red-900/50 text-red-400 border-red-800",
};

export const REPORT_REASON_LABEL: Record<string, string> = {
  harassment: "Harassment",
  fake_profile: "Fake Profile",
  inappropriate_content: "Inappropriate Content",
  spam: "Spam",
  other: "Other",
};
