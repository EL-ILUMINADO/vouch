"use server";

import {
  sendPlatformMessage,
  sendPlatformMessageToAll,
} from "@/lib/platform-messages";
import { revalidatePath } from "next/cache";

export type SendMessageState = { error?: string; success?: boolean };

export async function sendAdminMessage(
  _prev: SendMessageState,
  formData: FormData,
): Promise<SendMessageState> {
  const recipientId = formData.get("recipientId") as string;
  const type = formData.get("type") as "warning" | "promotion" | "announcement";
  const content = (formData.get("content") as string)?.trim();

  if (!content) return { error: "Message content is required." };
  if (!type) return { error: "Message type is required." };

  try {
    if (recipientId === "all") {
      await sendPlatformMessageToAll(content, type);
    } else {
      if (!recipientId) return { error: "Select a recipient." };
      await sendPlatformMessage(recipientId, content, type);
    }

    revalidatePath("/admin/messages");
    return { success: true };
  } catch (err) {
    console.error("[ADMIN_MESSAGE_ERROR]", err);
    return { error: "Failed to send message." };
  }
}
