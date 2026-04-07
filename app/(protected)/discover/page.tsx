// app/(protected)/discover/page.tsx
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, not } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { Heart, X, MessageCircle } from "lucide-react";

export default async function DiscoverPage() {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");

  const peers = await db
    .select()
    .from(users)
    .where(not(eq(users.id, session?.userId as string)))
    .limit(10);

  return (
    <main className="min-h-screen bg-background pb-20 p-4">
      <header className="py-6">
        <h1 className="text-3xl font-black text-foreground tracking-tighter italic">
          DISCOVER.
        </h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          School: UNIBEN Ugbowo
        </p>
      </header>

      <div className="space-y-6 max-w-md mx-auto">
        {peers.map((peer) => (
          <div
            key={peer.id}
            className="bg-card rounded-[2rem] overflow-hidden shadow-sm border border-border group"
          >
            {/* Profile Image Placeholder */}
            <div className="aspect-4/5 bg-indigo-50 dark:bg-indigo-900/20 relative flex items-center justify-center">
              <span className="text-6xl font-black text-indigo-200 dark:text-indigo-800">
                {peer.name[0]}
              </span>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/60 to-transparent">
                <h2 className="text-2xl font-bold text-white leading-none">
                  {peer.name}
                </h2>
                <p className="text-white/80 text-xs font-medium mt-1">
                  {peer.department} • {peer.level}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 flex justify-between items-center bg-card">
              <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors">
                <X className="w-6 h-6" />
              </button>
              <button className="flex-1 mx-4 h-12 rounded-full bg-indigo-600 text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-transform">
                <MessageCircle className="w-4 h-4" /> Ping
              </button>
              <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                <Heart className="w-6 h-6" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
