"use server";

import { db } from "@/db";
import { messages } from "@/db/schema";
import { decrypt } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher-server";
import { cookies } from "next/headers";

export async function sendMessage(conversationId: string, content: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return { error: "Authentication required." };

  const session = await decrypt(token);
  if (!session) return { error: "Invalid session." };

  try {
    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: session.userId as string,
        content,
      })
      .returning();

    // Trigger Pusher event
    // Channel name: The conversation ID
    // Event name: 'new-message'
    await pusherServer.trigger(conversationId, "new-message", newMessage);

    return { success: true };
  } catch {
    return { error: "Broadcast failed." };
  }
}
