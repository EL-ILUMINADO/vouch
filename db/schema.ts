import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  pgEnum,
  doublePrecision,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

export const verificationStatusEnum = pgEnum("verification_status", [
  "unverified",
  "pending_review",
  "verified",
  "rejected",
  "banned",
]);

export const verificationMethodEnum = pgEnum("verification_method", [
  "none",
  "vouch",
  "gps",
  "document",
  "culture_check",
]);

export const users = pgTable("users", {
  // Profile
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  profileImage: text("profile_image"),
  gender: text("gender"),
  lookingFor: text("looking_for"),
  hideLevel: boolean("hide_level").default(false).notNull(),
  isRadarVisible: boolean("is_radar_visible").default(true).notNull(),
  bio: text("bio"),
  interests: text("interests")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),

  // Specific question answers (helps with Radar filtering later!)
  prompt_question: text("prompt_question"),
  prompt_answer: text("prompt_answer"),
  images: text("images")
    .array()
    .default(sql`'{}'::text[]`),

  // Categorized Data for SQL Filtering (Dropdowns)
  intent: text("intent"), // "Long-term", "Short-term", etc.
  social_energy: text("social_energy"), // "Introvert", "Extrovert", "Ambivert"
  conflict_style: text("conflict_style"),
  energy_vibe: text("energy_vibe"), // "Spontaneous" vs "Planned"
  relationship_style: text("relationship_style"), // "Traditional", "Modern/Equal", etc.

  // The "Bio Gold" & Deep Dives (Text Fields)
  bio_headline: text("bio_headline"), // Question 20
  lifestyle_snapshot: text("lifestyle_snapshot"),
  relationship_vision: text("relationship_vision"),
  deal_breakers: text("deal_breakers"),

  // Catch-all for the remaining 20+ answers to keep schema clean
  onboarding_answers: jsonb("onboarding_answers").default({}),

  // Coordinates for the 3.5km domain
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),

  radarPings: integer("radar_pings").notNull().default(10),
  pingsResetAt: timestamp("pings_reset_at", { mode: "date" }),

  // Academic
  university: text("university").notNull(),
  department: text("department").notNull(),
  level: text("level").notNull(),

  // Verification
  verificationStatus: verificationStatusEnum("verification_status")
    .default("unverified")
    .notNull(),
  verificationMethod: verificationMethodEnum("verification_method")
    .default("none")
    .notNull(),
  vouchedById: uuid("vouched_by_id"),
  requiresPulseCheck: boolean("requires_pulse_check").default(false).notNull(),
  verificationVideoUrl: text("verification_video_url"),

  // Captcha lockout (null = not locked; future timestamp = locked until that time)
  captchaLockedUntil: timestamp("captcha_locked_until", { mode: "date" }),

  // Moderation
  trustScore: integer("trust_score").default(0).notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  warningCount: integer("warning_count").default(0).notNull(),

  // Presence
  lastActiveAt: timestamp("last_active_at"),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vouchCodes = pgTable("vouch_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique().notNull(),
  issuerId: uuid("issuer_id")
    .references(() => users.id)
    .notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  usedById: uuid("used_by_id").references(() => users.id),
  // When true, the code appears on the public /codes board
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversationStatusEnum = pgEnum("conversation_status", [
  "active",
  "closed_inactive",
]);

export const conversationOriginEnum = pgEnum("conversation_origin", [
  "discover",
  "radar",
]);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userOneId: uuid("user_one_id")
    .references(() => users.id)
    .notNull(),
  userTwoId: uuid("user_two_id")
    .references(() => users.id)
    .notNull(),
  status: conversationStatusEnum("status").default("active").notNull(),
  /** How this conversation was initiated — useful for moderation auditing. */
  origin: conversationOriginEnum("origin").default("discover").notNull(),
  // Updated whenever a message is sent; used for 24h inactivity enforcement
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  // The user who failed to respond within 24h and caused the closure
  closedByUserId: uuid("closed_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id, { onDelete: "cascade" })
    .notNull(),
  senderId: uuid("sender_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  // Reply threading: snapshot the replied-to message so it persists even if deleted
  replyToId: uuid("reply_to_id"),
  replyToContent: text("reply_to_content"),
  replyToSenderId: uuid("reply_to_sender_id"),
  // Edit tracking
  editedAt: timestamp("edited_at"),
  // Soft-delete for everyone
  deletedAt: timestamp("deleted_at"),
  // Soft-delete for one side only
  deletedForSender: boolean("deleted_for_sender").default(false).notNull(),
  deletedForReceiver: boolean("deleted_for_receiver").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const platformMessageTypeEnum = pgEnum("platform_message_type", [
  "warning",
  "promotion",
  "announcement",
]);

export const platformMessages = pgTable("platform_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientId: uuid("recipient_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: platformMessageTypeEnum("type").default("announcement").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const likeStatusEnum = pgEnum("like_status", ["pending", "rejected"]);

export const likes = pgTable(
  "likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    likerId: uuid("liker_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    likedUserId: uuid("liked_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    status: likeStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("likes_liker_liked_unique").on(table.likerId, table.likedUserId),
  ],
);

export const radarRequestStatusEnum = pgEnum("radar_request_status", [
  "pending",
  "accepted",
  "declined",
  "expired",
]);

export const radarRequests = pgTable("radar_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: uuid("sender_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  receiverId: uuid("receiver_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  status: radarRequestStatusEnum("status").default("pending").notNull(),
  // Requests expire after 24h if not responded to
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Blocks ──────────────────────────────────────────────────────────────────
export const blocks = pgTable(
  "blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blockerId: uuid("blocker_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    blockedId: uuid("blocked_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("blocks_blocker_blocked_unique").on(
      table.blockerId,
      table.blockedId,
    ),
  ],
);

// ─── Push Subscriptions ───────────────────────────────────────────────────────
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "reviewed",
  "dismissed",
  "action_taken",
]);

export const reportReasonEnum = pgEnum("report_reason", [
  "harassment",
  "fake_profile",
  "inappropriate_content",
  "spam",
  "other",
]);

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id")
    .references(() => users.id)
    .notNull(),
  reportedUserId: uuid("reported_user_id")
    .references(() => users.id)
    .notNull(),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  reason: reportReasonEnum("reason").notNull(),
  description: text("description"),
  // Snapshot of the last 20 messages at the time of report
  messageSnapshot: jsonb("message_snapshot")
    .$type<
      Array<{
        senderId: string;
        senderName: string;
        content: string;
        createdAt: string;
      }>
    >()
    .default([]),
  status: reportStatusEnum("status").default("pending").notNull(),
  adminNote: text("admin_note"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
