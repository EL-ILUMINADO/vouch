import { db } from "@/db";
import { notifications } from "@/db/schema";
import { sendPushToUser } from "@/lib/push";

type NotificationType =
  | "match"
  | "like_received"
  | "radar_request"
  | "radar_accepted";

export async function notify(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  actorId?: string;
}) {
  await db.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    actionUrl: params.actionUrl ?? null,
    actorId: params.actorId ?? null,
  });

  sendPushToUser(
    params.userId,
    params.title,
    params.body,
    params.actionUrl,
  ).catch(() => {});
}
