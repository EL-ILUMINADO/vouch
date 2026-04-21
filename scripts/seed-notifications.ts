/**
 * Seed test notifications for a given user.
 *
 * Usage:
 *   TEST_USER_ID=<uuid> pnpm tsx scripts/seed-notifications.ts
 *   TEST_USER_ID=<uuid> TEST_ACTOR_ID=<uuid> pnpm tsx scripts/seed-notifications.ts
 *
 * Optional flags (pass as the last CLI arg):
 *   --all        seed one of every type (default)
 *   --match
 *   --like
 *   --radar-ping
 *   --radar-accept
 *   --admin-announce
 *   --admin-warn
 *   --clear      delete all notifications for TEST_USER_ID first
 */

import "dotenv/config";
import { db } from "../db";
import { notifications } from "../db/schema";
import { eq } from "drizzle-orm";

const userId = process.env.TEST_USER_ID;
const actorId = process.env.TEST_ACTOR_ID ?? null;

if (!userId) {
  console.error("❌  Set TEST_USER_ID in your .env or environment.");
  process.exit(1);
}

const flag = process.argv[2] ?? "--all";

type Seed = {
  userId: string;
  type:
    | "match"
    | "like_received"
    | "radar_request"
    | "radar_accepted"
    | "admin";
  title: string;
  body: string;
  actionUrl?: string;
  actorId?: string | null;
};

const ALL_SEEDS: Seed[] = [
  {
    userId,
    type: "like_received",
    title: "Someone liked you ❤️",
    body: "A new person just liked your profile. Check who it is!",
    actorId,
  },
  {
    userId,
    type: "match",
    title: "You got a match! ⚡",
    body: "You and someone else liked each other. Start the conversation.",
    actionUrl: "/chats",
    actorId,
  },
  {
    userId,
    type: "radar_request",
    title: "Radar ping incoming 📡",
    body: "Someone on radar wants to connect with you.",
    actionUrl: "/chats",
    actorId,
  },
  {
    userId,
    type: "radar_accepted",
    title: "Radar request accepted ✅",
    body: "Your radar request was accepted. You can now chat.",
    actionUrl: "/chats",
    actorId,
  },
  {
    userId,
    type: "admin",
    title: "Message from Vouch 📢",
    body: "Welcome! We are thrilled to have you on Vouch. Complete your profile to start connecting.",
    actorId: null,
  },
  {
    userId,
    type: "admin",
    title: "⚠️ Account Warning",
    body: "Your account was reported for violating community guidelines. This is your 1st warning. You have 2 more before a permanent ban.",
    actorId: null,
  },
];

const FLAG_MAP: Record<string, Seed[]> = {
  "--like": [ALL_SEEDS[0]],
  "--match": [ALL_SEEDS[1]],
  "--radar-ping": [ALL_SEEDS[2]],
  "--radar-accept": [ALL_SEEDS[3]],
  "--admin-announce": [ALL_SEEDS[4]],
  "--admin-warn": [ALL_SEEDS[5]],
  "--all": ALL_SEEDS,
};

async function main() {
  if (flag === "--clear") {
    const deleted = await db
      .delete(notifications)
      .where(eq(notifications.userId, userId!))
      .returning({ id: notifications.id });
    console.log(`🗑  Cleared ${deleted.length} notifications for ${userId}`);
    process.exit(0);
  }

  const seeds = FLAG_MAP[flag] ?? ALL_SEEDS;

  for (const seed of seeds) {
    await db.insert(notifications).values(seed);
    console.log(`✓  [${seed.type}] ${seed.title}`);
  }

  console.log(
    `\n✅  Done — ${seeds.length} notification(s) seeded for user ${userId}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ ", err);
  process.exit(1);
});
