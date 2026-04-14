import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EditInterestsClient } from "./edit-interests-client";

export default async function EditInterestsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) redirect("/login");

  const session = await decrypt(token);
  if (!session) redirect("/login");

  const [user] = await db
    .select({ interests: users.interests })
    .from(users)
    .where(eq(users.id, session.userId as string))
    .limit(1);

  if (!user) redirect("/login");

  return <EditInterestsClient currentInterests={user.interests ?? []} />;
}
