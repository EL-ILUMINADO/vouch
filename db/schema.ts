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
} from "drizzle-orm/pg-core";

export const verificationStatusEnum = pgEnum("verification_status", [
  "unverified",
  "pending_review",
  "verified",
  "banned",
]);
export const verificationMethodEnum = pgEnum("verification_method", [
  "none",
  "vouch",
  "gps",
  "document",
]);

export const users = pgTable("users", {
  // Profile
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  bio: text("bio"),
  profileImage: text("profile_image"),
  gender: text("gender"),
  lookingFor: text("looking_for"),
  hideLevel: boolean("hide_level").default(false).notNull(),
  images: text("images")
    .array()
    .default(sql`'{}'::text[]`),

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

  // Moderation
  trustScore: integer("trust_score").default(0).notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userOneId: uuid("user_one_id")
    .references(() => users.id)
    .notNull(),
  userTwoId: uuid("user_two_id")
    .references(() => users.id)
    .notNull(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
