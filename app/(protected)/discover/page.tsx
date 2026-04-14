import type { Metadata } from "next";
import { db } from "@/db";
import { users, likes, conversations, blocks } from "@/db/schema";

export const metadata: Metadata = {
  title: "Discover",
  description: "Swipe through verified campus profiles and find your match.",
};
import { eq, not, or, inArray, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SwipeStack } from "./swipe-stack";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");
  if (!session) redirect("/");

  const currentUserId = session.userId as string;

  // Collect IDs to exclude from the swipe stack:
  // 1. Users the current user has already liked (pending or rejected — no point showing them again)
  // 2. Users with whom there is already an active conversation
  const [alreadyLiked, conversationPartners, currentUserRows, blockedRows] =
    await Promise.all([
      db
        .select({ likedUserId: likes.likedUserId })
        .from(likes)
        .where(eq(likes.likerId, currentUserId)),

      // Exclude ALL conversations (active or closed) — once two users have
      // ever matched they should never see each other in discover again.
      db
        .select({
          userOneId: conversations.userOneId,
          userTwoId: conversations.userTwoId,
        })
        .from(conversations)
        .where(
          or(
            eq(conversations.userOneId, currentUserId),
            eq(conversations.userTwoId, currentUserId),
          ),
        ),

      db
        .select({ interests: users.interests })
        .from(users)
        .where(eq(users.id, currentUserId))
        .limit(1),

      // Blocks in both directions.
      db
        .select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId })
        .from(blocks)
        .where(
          or(
            eq(blocks.blockerId, currentUserId),
            eq(blocks.blockedId, currentUserId),
          ),
        ),
    ]);

  const excludedIds = new Set<string>([currentUserId]);
  for (const { likedUserId } of alreadyLiked) excludedIds.add(likedUserId);
  for (const { userOneId, userTwoId } of conversationPartners) {
    excludedIds.add(userOneId);
    excludedIds.add(userTwoId);
  }
  for (const { blockerId, blockedId } of blockedRows) {
    excludedIds.add(blockerId);
    excludedIds.add(blockedId);
  }

  const excludedArray = Array.from(excludedIds);

  const peers = await db
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
    .where(
      and(not(inArray(users.id, excludedArray)), eq(users.isBanned, false)),
    )
    .limit(30);

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
