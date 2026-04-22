import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { platformMessages, users } from "@/db/schema";
import { desc, eq, lt } from "drizzle-orm";
import { verifyAdminSession } from "@/lib/admin-auth";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  // Admin auth
  const adminToken = req.cookies.get("vouch_admin")?.value;
  if (!adminToken || !(await verifyAdminSession(adminToken))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor"); // ISO timestamp of last seen message

  const rows = await db
    .select({
      id: platformMessages.id,
      type: platformMessages.type,
      content: platformMessages.content,
      createdAt: platformMessages.createdAt,
      recipientId: platformMessages.recipientId,
      recipientName: users.name,
      recipientEmail: users.email,
    })
    .from(platformMessages)
    .leftJoin(users, eq(platformMessages.recipientId, users.id))
    .where(
      cursor ? lt(platformMessages.createdAt, new Date(cursor)) : undefined,
    )
    .orderBy(desc(platformMessages.createdAt))
    .limit(PAGE_SIZE + 1); // Fetch one extra to know if there's a next page

  const hasMore = rows.length > PAGE_SIZE;
  const messages = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor = hasMore
    ? messages[messages.length - 1].createdAt.toISOString()
    : null;

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      type: m.type,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      recipientName: m.recipientName ?? null,
      recipientEmail: m.recipientEmail ?? null,
    })),
    nextCursor,
  });
}
