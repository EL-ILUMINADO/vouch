import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function fetchRows(userId: string) {
  return db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      body: notifications.body,
      actionUrl: notifications.actionUrl,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      actorName: users.name,
      actorImage: users.profileImage,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.actorId, users.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");
  if (!session?.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.userId as string;
  const encoder = new TextEncoder();

  const send = (controller: ReadableStreamDefaultController, data: unknown) => {
    try {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch {
      // Stream already closed
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial snapshot.
      const initial = await fetchRows(userId);
      const initUnread = initial.filter((n) => !n.isRead).length;
      send(controller, {
        notifications: initial,
        unreadCount: initUnread,
      });

      let lastTotal = initial.length;
      let lastUnread = initUnread;

      // Poll every 4 seconds and push deltas.
      const poll = setInterval(async () => {
        try {
          const rows = await fetchRows(userId);
          const unread = rows.filter((n) => !n.isRead).length;

          if (rows.length !== lastTotal || unread !== lastUnread) {
            lastTotal = rows.length;
            lastUnread = unread;
            send(controller, { notifications: rows, unreadCount: unread });
          }
        } catch {
          clearInterval(poll);
          clearInterval(keepalive);
          controller.close();
        }
      }, 4000);

      // Keepalive comment every 20 s to prevent proxy timeouts.
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ka\n\n"));
        } catch {
          clearInterval(keepalive);
        }
      }, 20000);

      request.signal.addEventListener("abort", () => {
        clearInterval(poll);
        clearInterval(keepalive);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
