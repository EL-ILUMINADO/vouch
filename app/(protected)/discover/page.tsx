import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, not, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { SwipeStack } from "./swipe-stack";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");
  const currentUserId = session?.userId as string;

  const [currentUserRows, peers] = await Promise.all([
    db
      .select({ interests: users.interests })
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1),

    db
      .select({
        id: users.id,
        name: users.name,
        department: users.department,
        level: users.level,
        hideLevel: users.hideLevel,
        interests: users.interests,
        bio_headline: users.bio_headline,
        intent: users.intent,
        social_energy: users.social_energy,
        energy_vibe: users.energy_vibe,
        profileImage: users.profileImage,
        images: users.images,
        prompt_question: users.prompt_question,
        prompt_answer: users.prompt_answer,
        verificationStatus: users.verificationStatus,
      })
      .from(users)
      .where(and(not(eq(users.id, currentUserId)), eq(users.isBanned, false)))
      .limit(30),
  ]);

  const myInterests = currentUserRows[0]?.interests ?? [];

  return (
    <main className="min-h-screen bg-background pb-28">
      <header className="px-6 py-6">
        <h1 className="text-3xl font-black text-foreground tracking-tighter italic">
          DISCOVER.
        </h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
          {peers.length} people near you
        </p>
      </header>

      <SwipeStack peers={peers} myInterests={myInterests} />
    </main>
  );
}
