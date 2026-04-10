/* eslint-disable @next/next/no-img-element */
import { db } from "@/db";
import { likes, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Lock, Heart } from "lucide-react";
import { LikerActions } from "./liker-actions";

export const dynamic = "force-dynamic";

const FREE_LIMIT = 5;

export default async function LikesPage() {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");
  if (!session) redirect("/");

  const currentUserId = session.userId as string;

  const [currentUser] = await db
    .select({ verificationStatus: users.verificationStatus })
    .from(users)
    .where(eq(users.id, currentUserId))
    .limit(1);

  const isPending = currentUser?.verificationStatus === "pending_review";

  // Only show pending likes (not ones the user has already rejected)
  const likerRows = await db
    .select({
      likedAt: likes.createdAt,
      liker: {
        id: users.id,
        name: users.name,
        department: users.department,
        level: users.level,
        hideLevel: users.hideLevel,
        profileImage: users.profileImage,
        images: users.images,
        bio_headline: users.bio_headline,
        verificationStatus: users.verificationStatus,
      },
    })
    .from(likes)
    .innerJoin(users, eq(likes.likerId, users.id))
    .where(
      and(eq(likes.likedUserId, currentUserId), eq(likes.status, "pending")),
    )
    .orderBy(desc(likes.createdAt));

  const total = likerRows.length;
  const visible = likerRows.slice(0, FREE_LIMIT);
  const lockedCount = Math.max(0, total - FREE_LIMIT);

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="px-6 py-6">
        <h1 className="text-3xl font-black text-foreground tracking-tighter italic">
          LIKES.
        </h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
          {total === 0
            ? "No likes yet"
            : `${total} person${total !== 1 ? "s" : ""} liked you`}
        </p>
      </header>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 text-muted-foreground/40">
          <Heart className="w-12 h-12 stroke-1" />
          <p className="text-sm font-medium">No likes yet.</p>
          <p className="text-xs">Keep swiping — someone will find you.</p>
        </div>
      ) : (
        <div className="px-4 space-y-6">
          {/* Visible likers */}
          <div className="grid grid-cols-2 gap-3">
            {visible.map(({ liker }) => (
              <LikerCard key={liker.id} liker={liker} isPending={isPending} />
            ))}

            {/* Locked / blurred cards */}
            {lockedCount > 0 &&
              likerRows
                .slice(FREE_LIMIT)
                .map(({ liker }, i) => (
                  <LockedCard key={`locked-${i}`} liker={liker} />
                ))}
          </div>

          {/* Pro upsell banner */}
          {lockedCount > 0 && (
            <div className="bg-linear-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-2xl p-5 text-center space-y-2">
              <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-black text-foreground text-base">
                {lockedCount} more like{lockedCount !== 1 ? "s" : ""} hidden
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upgrade to{" "}
                <span className="font-black text-rose-500">Vouch Pro</span> to
                see everyone who liked you and match instantly.
              </p>
              <button
                disabled
                className="mt-1 w-full h-11 rounded-xl bg-rose-500 text-white font-bold text-sm uppercase tracking-widest opacity-60 cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Liker card (visible) — includes Like Back / Pass buttons
// ---------------------------------------------------------------------------

function LikerCard({
  liker,
  isPending,
}: {
  liker: {
    id: string;
    name: string;
    department: string;
    level: string;
    hideLevel: boolean;
    profileImage: string | null;
    images: string[] | null;
    bio_headline: string | null;
    verificationStatus: string;
  };
  isPending: boolean;
}) {
  const imgSrc = liker.profileImage ?? liker.images?.[0] ?? null;

  return (
    <div className="bg-card rounded-[1.5rem] overflow-hidden border border-border">
      {/* Photo */}
      <div className="aspect-square bg-rose-50 dark:bg-rose-900/20 relative flex items-center justify-center">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={liker.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl font-black text-rose-200 dark:text-rose-800">
            {liker.name[0]}
          </span>
        )}
        {/* Heart badge */}
        <div className="absolute top-2 right-2 w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center shadow-md">
          <Heart className="w-3.5 h-3.5 text-white fill-white" />
        </div>
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="font-bold text-sm text-foreground truncate">
          {liker.name}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {liker.department}
          {!liker.hideLevel && ` · ${liker.level}`}
        </p>
        {liker.bio_headline && (
          <p className="text-[10px] text-muted-foreground/70 mt-1 line-clamp-2 italic">
            {liker.bio_headline}
          </p>
        )}
        {/* Action buttons rendered client-side */}
        <LikerActions likerId={liker.id} isPending={isPending} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Locked card (blurred, Pro teaser)
// ---------------------------------------------------------------------------

function LockedCard({
  liker,
}: {
  liker: {
    name: string;
    profileImage: string | null;
    images: string[] | null;
  };
}) {
  const imgSrc = liker.profileImage ?? liker.images?.[0] ?? null;

  return (
    <div className="bg-card rounded-[1.5rem] overflow-hidden border border-border relative">
      {/* Blurred photo */}
      <div className="aspect-square bg-rose-50 dark:bg-rose-900/20 relative flex items-center justify-center overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="Hidden"
            className="w-full h-full object-cover blur-xl scale-110"
          />
        ) : (
          <span className="text-4xl font-black text-rose-200/40 dark:text-rose-800/40 blur-sm">
            {liker.name[0]}
          </span>
        )}
        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/30 backdrop-blur-sm gap-1">
          <div className="w-8 h-8 bg-background/80 rounded-full flex items-center justify-center">
            <Lock className="w-4 h-4 text-foreground" />
          </div>
        </div>
      </div>
      {/* Blurred info */}
      <div className="p-3 select-none">
        <p className="font-bold text-sm text-foreground blur-sm">Hidden</p>
        <p className="text-[10px] text-muted-foreground blur-sm">Pro feature</p>
      </div>
    </div>
  );
}
