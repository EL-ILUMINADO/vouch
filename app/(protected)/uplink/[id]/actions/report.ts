"use server";

import { db } from "@/db";
import { reports, users, messages } from "@/db/schema";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { adjustTrustScore, TRUST_DELTAS } from "@/lib/trust-score";

export type ReportResult = { success: true } | { error: string };

export async function reportUser(
  conversationId: string | null,
  reportedUserId: string,
  reason: string,
  description: string,
): Promise<ReportResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return { error: "Authentication required." };

  const session = await decrypt(token);
  if (!session) return { error: "Invalid session." };

  const reporterId = session.userId as string;

  if (reporterId === reportedUserId)
    return { error: "Cannot report yourself." };

  try {
    // Only fetch a message snapshot when there is an associated conversation.
    let snapshot: Array<{
      senderId: string;
      senderName: string;
      content: string;
      createdAt: string;
    }> = [];

    if (conversationId) {
      const last20 = await db
        .select({
          senderId: messages.senderId,
          content: messages.content,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(20);

      const allSenders = await db
        .select({ id: users.id, name: users.name })
        .from(users);
      const nameMap = new Map(allSenders.map((u) => [u.id, u.name]));

      snapshot = last20.reverse().map((m) => ({
        senderId: m.senderId,
        senderName: nameMap.get(m.senderId) ?? "Unknown",
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }));
    }

    await db.insert(reports).values({
      reporterId,
      reportedUserId,
      conversationId,
      reason: reason as
        | "harassment"
        | "fake_profile"
        | "inappropriate_content"
        | "spam"
        | "other",
      description: description || null,
      messageSnapshot: snapshot,
    });

    await adjustTrustScore(reportedUserId, TRUST_DELTAS.REPORT_RECEIVED);

    return { success: true };
  } catch (err) {
    console.error("[REPORT_ERROR]", err);
    return { error: "Failed to submit report." };
  }
}
