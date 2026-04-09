import { db } from "@/db";
import { platformMessages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Megaphone, Gift } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_CONFIG = {
  warning: {
    icon: ShieldAlert,
    label: "Warning",
    bubble: "bg-red-500/10 border border-red-500/20 text-foreground",
    icon_class: "text-red-500",
  },
  promotion: {
    icon: Gift,
    label: "Promotion",
    bubble: "bg-blue-500/10 border border-blue-500/20 text-foreground",
    icon_class: "text-blue-400",
  },
  announcement: {
    icon: Megaphone,
    label: "Announcement",
    bubble: "bg-card border border-border text-foreground",
    icon_class: "text-rose-500",
  },
};

async function markAllRead(userId: string) {
  await db
    .update(platformMessages)
    .set({ isRead: true })
    .where(eq(platformMessages.recipientId, userId));
}

export default async function InboxPage() {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");
  if (!session) redirect("/");

  const currentUserId = session.userId as string;

  const msgs = await db
    .select()
    .from(platformMessages)
    .where(eq(platformMessages.recipientId, currentUserId))
    .orderBy(asc(platformMessages.createdAt));

  // Mark all as read (fire-and-forget)
  markAllRead(currentUserId).catch(() => {});

  return (
    <main className="min-h-screen bg-background">
      <header className="px-6 py-4 border-b border-border flex items-center gap-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Link
          href="/chats"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          ←
        </Link>
        <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white font-black shrink-0">
          V
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground tracking-tight">
            Vouch
          </h2>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Platform · Read-only
          </p>
        </div>
      </header>

      <div className="p-4 space-y-3 pb-24">
        {msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 space-y-3">
            <Megaphone className="w-12 h-12 stroke-1" />
            <p className="text-sm font-medium">No messages from Vouch yet.</p>
          </div>
        ) : (
          msgs.map((msg) => {
            const cfg = TYPE_CONFIG[msg.type] ?? TYPE_CONFIG.announcement;
            const Icon = cfg.icon;
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[85%] space-y-1">
                  <div className="flex items-center gap-1.5 px-1">
                    <Icon className={`w-3 h-3 ${cfg.icon_class}`} />
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest ${cfg.icon_class}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl rounded-tl-none text-sm whitespace-pre-line shadow-sm ${cfg.bubble}`}
                  >
                    {msg.content}
                  </div>
                  <p className="text-[9px] text-muted-foreground px-1">
                    {new Date(msg.createdAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}

        <div className="pt-4 text-center">
          <p className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-widest">
            Official Vouch Platform Messages · Cannot Reply
          </p>
        </div>
      </div>
    </main>
  );
}
