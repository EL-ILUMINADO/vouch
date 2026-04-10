import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { LivenessCapture } from "./liveness-capture";

export default async function OnboardingLivenessPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) redirect("/");

  const session = await decrypt(token);
  if (!session) redirect("/");

  const [user] = await db
    .select({
      verificationStatus: users.verificationStatus,
      verificationVideoUrl: users.verificationVideoUrl,
    })
    .from(users)
    .where(eq(users.id, session.userId as string))
    .limit(1);

  if (!user) redirect("/");

  // Fully verified after admin approval (has video) — skip to radar
  if (user.verificationStatus === "verified" && user.verificationVideoUrl) {
    redirect("/radar");
  }

  // Already submitted — let the client component show a "pending review" screen
  // instead of redirecting here. If we redirect from the server component, Next.js
  // will fire it during the automatic route-refresh that follows a server action,
  // which would snatch the user away before they can click "Go to Radar".
  const alreadyPending = user.verificationStatus === "pending_review";

  return <LivenessCapture alreadyPending={alreadyPending} />;
}
