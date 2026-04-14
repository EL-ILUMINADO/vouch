"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export async function updatePresence(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return;

  const session = await decrypt(token);
  if (!session) return;

  await db
    .update(users)
    .set({ lastActiveAt: new Date() })
    .where(eq(users.id, session.userId as string));
}
