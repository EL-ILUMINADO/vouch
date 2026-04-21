// db/seed-chats.ts — Demo conversation seed for testing reports
import { db } from "@/db";
import { users, conversations, messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const DEMO_USERS = [
  {
    email: "amaka.obi@uniben.edu.ng",
    name: "Amaka Obi",
    password: "password123",
    university: "uniben",
    department: "Mass Communication",
    level: "300",
    gender: "female",
  },
  {
    email: "chidi.nwosu@uniben.edu.ng",
    name: "Chidi Nwosu",
    password: "password123",
    university: "uniben",
    department: "Computer Science",
    level: "400",
    gender: "male",
  },
];

const DEMO_MESSAGES = [
  { from: 0, text: "Hey! saw you on radar 👀" },
  { from: 1, text: "Lol hi! Yeah I just joined" },
  { from: 0, text: "Welcome to Vouch then 😄 how did you get a code?" },
  { from: 1, text: "My friend Tunde vouched for me. You?" },
  { from: 0, text: "Same, my roomie vouched me like 2 weeks ago" },
  { from: 1, text: "Cool cool. So what dept are you in?" },
  { from: 0, text: "Mass Comm. 300l. You?" },
  { from: 1, text: "CS, 400l. We should've crossed paths at SUB honestly" },
  { from: 0, text: "Hahaha SUB is too far from our faculty" },
  { from: 1, text: "Fair point. You usually around the library side?" },
  { from: 0, text: "Sometimes. I prefer the bench behind the lecture halls" },
  { from: 1, text: "Noted 👀 anyway what are your interests?" },
  { from: 0, text: "Photography, writing, and honestly just eating good food" },
  { from: 1, text: "A woman of culture. I respect that" },
  { from: 0, text: "LOL what about you?" },
  { from: 1, text: "Gaming, coding, and trying not to fail my exams" },
  { from: 0, text: "Sounds like a full time job honestly" },
  { from: 1, text: "It literally is 😭" },
  {
    from: 0,
    text: "So what made you join Vouch? Looking for something serious?",
  },
  { from: 1, text: "Maybe. I don't know yet. Just seeing" },
  { from: 0, text: "Same honestly. No pressure" },
  { from: 1, text: "Yeah exactly. Keep it easy" },
  { from: 0, text: "Exactly. So do you have WhatsApp or?" },
  { from: 1, text: "Haha smooth. Let's talk here first" },
  { from: 0, text: "Fair enough 😂 I respect the boundary" },
];

async function seedChats(): Promise<void> {
  console.log("--- 💬 SEEDING DEMO CHAT DATA ---");

  try {
    // Get or create the root user to issue vouch codes
    const [rootUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "root@vouch.edu.ng"))
      .limit(1);

    if (!rootUser) {
      console.error("❌ Root user not found. Run `npx tsx db/seed.ts` first.");
      process.exit(1);
    }

    // Upsert demo users
    const userIds: string[] = [];
    for (const demo of DEMO_USERS) {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, demo.email))
        .limit(1);

      if (existing) {
        console.log(`ℹ️  User ${demo.email} already exists`);
        userIds.push(existing.id);
        continue;
      }

      const passwordHash = await bcrypt.hash(demo.password, 10);
      const [created] = await db
        .insert(users)
        .values({
          name: demo.name,
          email: demo.email,
          passwordHash,
          university: demo.university,
          department: demo.department,
          level: demo.level,
          gender: demo.gender,
          verificationStatus: "verified",
          verificationMethod: "vouch",
          vouchedById: rootUser.id,
        })
        .returning({ id: users.id });

      userIds.push(created.id);
      console.log(`✅ Created user: ${demo.name}`);
    }

    const [userAId, userBId] = userIds;

    // Check for existing conversation
    const [existingConvo] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userOneId, userAId))
      .limit(1);

    let conversationId: string;

    if (existingConvo) {
      conversationId = existingConvo.id;
      console.log(`ℹ️  Conversation already exists: ${conversationId}`);
    } else {
      const [newConvo] = await db
        .insert(conversations)
        .values({ userOneId: userAId, userTwoId: userBId })
        .returning({ id: conversations.id });

      conversationId = newConvo.id;
      console.log(`✅ Created conversation: ${conversationId}`);

      // Seed messages with staggered timestamps
      const baseTime = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago

      for (let i = 0; i < DEMO_MESSAGES.length; i++) {
        const msg = DEMO_MESSAGES[i];
        const senderId = msg.from === 0 ? userAId : userBId;
        const createdAt = new Date(baseTime + i * 90_000); // 90s apart

        await db.insert(messages).values({
          conversationId,
          senderId,
          content: msg.text,
          createdAt,
        });
      }

      console.log(`✅ Seeded ${DEMO_MESSAGES.length} messages`);
    }

    console.log("\n--- ✅ DONE ---");
    console.log(`Conversation ID: ${conversationId}`);
    console.log(`User A (${DEMO_USERS[0].name}): ${userAId}`);
    console.log(`User B (${DEMO_USERS[1].name}): ${userBId}`);
    console.log(`\nLogin as either user with password: password123`);
    console.log(`Then open /uplink/${conversationId} to test the report flow`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ SEED FAILED: ${msg}`);
    process.exit(1);
  }
}

seedChats();
