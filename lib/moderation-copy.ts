// Shared message copy for all admin moderation actions.
// Imported by both server-side platform-messages.ts and client-side preview modals.

export const ADMIN_WARNING_COPY: Record<number, string> = {
  1: "Your account is under review by our moderation team for potential violations of community guidelines. ⚠️ This is your first warning (1/3). Two more warnings will result in a permanent account ban.",
  2: "Your account has received a second warning from our moderation team. ⚠️ This is your second warning (2/3). One more warning will result in a permanent account ban.",
  3: "Your account has received a final warning from our moderation team. ⚠️ This is your third and final warning (3/3). Your account is now eligible for a permanent ban at admin discretion.",
};

export const SUSPENSION_COPY =
  "Your account has been temporarily suspended by our moderation team. You may still log in and chat with existing connections, but you cannot like, ping, or edit your profile during this period. If you believe this is a mistake, please contact support.";

export const UNSUSPENSION_COPY =
  "Your account suspension has been lifted by our moderation team. Your account is now fully active again. Please ensure you continue to follow Vouch community guidelines.";

export const ADMIN_BAN_COPY =
  "Your account has been permanently banned by our moderation team for violating community guidelines. This decision is final.";

// Used by the reports auto-ban flow (separate from admin direct-ban)
export const AUTO_BAN_COPY =
  "Your account has been permanently banned for repeatedly violating Vouch community guidelines. This decision is final.";

export const REPORT_WARNING_COPY: Record<number, string> = {
  1: "Your account was reported for violating community guidelines. Please ensure you keep to our community guidelines to keep the platform safe for everyone.\n\n⚠️ This is your 1st warning. You have 2 more warnings before your account is permanently banned.",
  2: "Your account has received another report for violating community guidelines. We take platform safety very seriously.\n\n⚠️ This is your 2nd warning. You have 1 more warning before your account is permanently banned.",
  3: "Your account has been permanently banned for repeatedly violating Vouch community guidelines. This decision is final.",
};
