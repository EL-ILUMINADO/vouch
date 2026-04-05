// src/db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  pgEnum,
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
  gender: text("gender"),
  lookingFor: text("looking_for"),
  hideLevel: boolean("hide_level").default(false).notNull(),

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
