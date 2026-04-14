/* eslint-disable @next/next/no-img-element */
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, BadgeCheck } from "lucide-react";
import { PingLikeButtons } from "./ping-like-buttons";

export const dynamic = "force-dynamic";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

function calcMatch(mine: string[], theirs: string[]): number {
  if (mine.length === 0 && theirs.length === 0) return 0;
  const union = new Set([...mine, ...theirs]);
  const shared = theirs.filter((i) => mine.includes(i));
  return Math.round((shared.length / union.size) * 100);
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { id: targetUserId } = await params;

  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");
  if (!session) redirect("/");

  const currentUserId = session.userId as string;

  // Redirect to own profile page if someone links to themselves
  if (currentUserId === targetUserId) redirect("/profile");

  const [targetUserRow, currentUserRow] = await Promise.all([
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
        isBanned: users.isBanned,
      })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1),

    db
      .select({ interests: users.interests })
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1),
  ]);

  const user = targetUserRow[0];
  if (!user || user.isBanned) notFound();

  const myInterests = currentUserRow[0]?.interests ?? [];
  const matchPct = calcMatch(myInterests, user.interests ?? []);
  const sharedInterests = (user.interests ?? []).filter((i) =>
    myInterests.includes(i),
  );
  const imgSrc = user.profileImage ?? user.images?.[0] ?? null;

  return (
    <main className="min-h-screen bg-background pb-36">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-md z-10 px-4 py-3 flex items-center gap-3 border-b border-border">
        <Link
          href="/discover"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </Link>
        <h2 className="text-base font-bold text-foreground tracking-tight flex-1 truncate">
          {user.name}
        </h2>
      </header>

      {/* Hero image */}
      <div className="w-full aspect-4/5 bg-rose-50 dark:bg-rose-900/20 relative flex items-center justify-center overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[10rem] font-black text-rose-200 dark:text-rose-800">
            {user.name[0]}
          </span>
        )}
        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/80 via-black/30 to-transparent pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-black text-white leading-none">
              {user.name}
            </h1>
            {user.verificationStatus === "verified" && (
              <BadgeCheck className="w-5 h-5 text-rose-300 shrink-0" />
            )}
          </div>
          <p className="text-white/80 text-sm font-medium">
            {user.department}
            {!user.hideLevel && ` • ${user.level}`}
          </p>
          {matchPct > 0 && (
            <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2.5 py-1 rounded-full">
              {matchPct}% match
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Bio headline */}
        {user.bio_headline && (
          <p className="text-sm text-foreground leading-relaxed italic border-l-2 border-rose-500/40 pl-3">
            &ldquo;{user.bio_headline}&rdquo;
          </p>
        )}

        {/* Interests */}
        {(user.interests ?? []).length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Interests
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(user.interests ?? []).map((tag) => {
                const isShared = sharedInterests.includes(tag);
                return (
                  <span
                    key={tag}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                      isShared
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted/50 border-border text-muted-foreground"
                    }`}
                  >
                    {isShared ? "✓ " : ""}
                    {tag}
                  </span>
                );
              })}
            </div>
            {sharedInterests.length > 0 && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {sharedInterests.length} shared interest
                {sharedInterests.length !== 1 ? "s" : ""} with you
              </p>
            )}
          </div>
        )}

        {/* Vibe tags */}
        {(user.intent || user.social_energy || user.energy_vibe) && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Vibe
            </p>
            <div className="flex flex-wrap gap-2">
              {user.intent && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20 px-3 py-1 rounded-full">
                  {user.intent}
                </span>
              )}
              {user.social_energy && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-muted border border-border px-3 py-1 rounded-full text-muted-foreground">
                  {user.social_energy}
                </span>
              )}
              {user.energy_vibe && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-muted border border-border px-3 py-1 rounded-full text-muted-foreground">
                  {user.energy_vibe}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Prompt */}
        {user.prompt_question && user.prompt_answer && (
          <div className="bg-muted/40 rounded-2xl p-4 space-y-1.5">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
              {user.prompt_question}
            </p>
            <p className="text-sm text-foreground font-medium leading-relaxed">
              {user.prompt_answer}
            </p>
          </div>
        )}
      </div>

      {/* Fixed CTA bar */}
      <div className="fixed bottom-16 left-0 right-0 px-6 pb-4 pt-3 bg-background/80 backdrop-blur-md border-t border-border z-10">
        <PingLikeButtons userId={user.id} />
      </div>
    </main>
  );
}
