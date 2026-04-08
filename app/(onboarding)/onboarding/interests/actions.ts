"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function saveInterests(interests: string[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;

  if (!token) return { error: "Session expired. Please log in again." };

  const session = await decrypt(token);
  if (!session?.userId) return { error: "Invalid session." };

  if (interests.length < 5)
    return { error: "Pick at least 5 interests to continue." };

  try {
    await db
      .update(users)
      .set({ interests })
      .where(eq(users.id, session.userId as string));
  } catch {
    return { error: "Failed to save interests. Please try again." };
  }

  redirect("/onboarding/bio");
}
