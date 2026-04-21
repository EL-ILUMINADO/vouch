"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getSession() {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");
  return session;
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session?.userId) return;

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.userId, session.userId),
        eq(notifications.isRead, false),
      ),
    );

  revalidatePath("/notifications");
}

export async function markNotificationRead(id: string) {
  const session = await getSession();
  if (!session?.userId) return;

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(eq(notifications.id, id), eq(notifications.userId, session.userId)),
    );

  revalidatePath("/notifications");
}
