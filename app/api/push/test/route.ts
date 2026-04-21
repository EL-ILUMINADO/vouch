import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { notify } from "@/lib/notifications";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const title = body.title ?? "Test Notification";
  const message = body.body ?? "Push notifications are working! 🎉";
  const url = body.url ?? "/notifications";

  // Writes to the notifications table AND fires a web push.
  await notify({
    userId: session.userId,
    type: "match",
    title,
    body: message,
    actionUrl: url,
  });

  return NextResponse.json({ ok: true });
}
