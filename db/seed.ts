// db/seed.ts
import { db } from "@/db";
import { users, vouchCodes } from "@/db/schema";
import { eq } from "drizzle-orm";

async function seed(): Promise<void> {
  console.log("--- 🏗️  SYSTEM INITIALIZATION ---");

  try {
    const rootEmail = "root@vouch.edu.ng";
    const masterCode = "VOUCH-ALPHA-2026";

    // 1. Check if the Root User already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, rootEmail))
      .limit(1);

    let userId: string;

    if (!existingUser) {
      console.log("Creating new Root User...");
      const [newUser] = await db
        .insert(users)
        .values({
          name: "System Root",
          email: rootEmail,
          university: "uniben",
          department: "System Administration",
          level: "Staff",
          verificationStatus: "verified",
          verificationMethod: "vouch",
        })
        .returning({ id: users.id });
      userId = newUser.id;
      console.log(`✅ Root User Created: ${userId}`);
    } else {
      userId = existingUser.id;
      console.log(`ℹ️  Root User already exists: ${userId}`);
    }

    // 2. Check if the Master Code already exists
    const [existingCode] = await db
      .select()
      .from(vouchCodes)
      .where(eq(vouchCodes.code, masterCode))
      .limit(1);

    if (!existingCode) {
      console.log("Generating Master Vouch Code...");
      await db.insert(vouchCodes).values({
        code: masterCode,
        issuerId: userId,
        isUsed: false,
      });
      console.log(`✅ Master Code Active: ${masterCode}`);
    } else {
      console.log(`ℹ️  Master Code ${masterCode} is already in the system.`);
    }

    console.log("--- 🚀 SYSTEM READY ---");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Database Sync Error";
    console.error(`❌ SEED FAILED: ${errorMsg}`);
    process.exit(1);
  }
}

seed();
