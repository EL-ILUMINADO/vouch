"use server";

import { db } from "@/db";
import {
  users,
  conversations,
  messages,
  vouchCodes,
  reports,
  pushSubscriptions,
} from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearAuthCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  cookieStore.delete("vouch_session");
  cookieStore.delete("vouch_status");
}

/**
 * Extracts the Cloudinary public_id from a secure URL.
 * e.g. "https://res.cloudinary.com/mycloud/image/upload/v123/vouch-images/abc.jpg"
 *   → "vouch-images/abc"
 */
function extractPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
  return match?.[1] ?? null;
}

// Shared session helper — returns userId or redirects.
async function requireSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) redirect("/login");
  const session = await decrypt(token);
  if (!session) redirect("/login");
  return session.userId as string;
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logout(): Promise<void> {
  await requireSession();
  const cookieStore = await cookies();
  clearAuthCookies(cookieStore);
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Delete account
// ---------------------------------------------------------------------------

export async function deleteAccount(): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) redirect("/login");

  const session = await decrypt(token);
  if (!session) redirect("/");

  const userId = session.userId;

  try {
    // 1. Fetch user to get stored image URLs before we wipe the DB row.
    const [user] = await db
      .select({ images: users.images })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      clearAuthCookies(cookieStore);
      redirect("/login");
    }

    // 2. Delete Cloudinary assets.
    //    Fire-and-forget individual failures so a missing asset doesn't
    //    abort the whole deletion.
    if (user.images && user.images.length > 0) {
      await Promise.allSettled(
        user.images
          .map(extractPublicId)
          .filter((id): id is string => id !== null)
          .map((publicId) =>
            cloudinary.uploader.destroy(publicId, { resource_type: "image" }),
          ),
      );
    }

    // 3. Delete messages sent by this user.
    //    Must happen before deleting conversations because messages.senderId
    //    has a FK to users.id with no cascade.
    await db.delete(messages).where(eq(messages.senderId, userId));

    // 4a. Delete reports filed by or against this user (references conversations).
    await db
      .delete(reports)
      .where(
        or(eq(reports.reporterId, userId), eq(reports.reportedUserId, userId)),
      );

    // 4. Delete conversations the user participated in.
    //    The onDelete: "cascade" on messages.conversationId handles any
    //    remaining messages in those conversations (sent by the other party).
    await db
      .delete(conversations)
      .where(
        or(
          eq(conversations.userOneId, userId),
          eq(conversations.userTwoId, userId),
        ),
      );

    // 5. Delete vouch codes issued by or used by this user.
    await db
      .delete(vouchCodes)
      .where(
        or(eq(vouchCodes.issuerId, userId), eq(vouchCodes.usedById, userId)),
      );

    // 6. Finally delete the user record itself.
    await db.delete(users).where(eq(users.id, userId));

    // 7. Clear session cookies.
    clearAuthCookies(cookieStore);
  } catch (err) {
    console.error("[deleteAccount]", err);
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/login");
}

// ---------------------------------------------------------------------------
// Photo management
// ---------------------------------------------------------------------------

export async function setProfilePhoto(
  imageUrl: string,
): Promise<{ error?: string }> {
  const userId = await requireSession();

  try {
    const [user] = await db
      .select({ images: users.images })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return { error: "Account not found." };
    if (!(user.images ?? []).includes(imageUrl))
      return { error: "Photo not found in your gallery." };

    await db
      .update(users)
      .set({ profileImage: imageUrl })
      .where(eq(users.id, userId));

    return {};
  } catch (err) {
    console.error("[setProfilePhoto]", err);
    return { error: "Failed to update profile photo. Please try again." };
  }
}

export async function deletePhoto(
  imageUrl: string,
): Promise<{ error?: string }> {
  const userId = await requireSession();

  try {
    const [user] = await db
      .select({ images: users.images, profileImage: users.profileImage })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return { error: "Account not found." };

    const current = user.images ?? [];

    if (current.length <= 2)
      return { error: "You must keep at least 2 photos." };

    if (!current.includes(imageUrl)) return { error: "Photo not found." };

    const publicId = extractPublicId(imageUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    }

    const updatedImages = current.filter((u) => u !== imageUrl);

    // If the deleted photo was the profile image, promote the first remaining one.
    const updatedProfileImage =
      user.profileImage === imageUrl
        ? (updatedImages[0] ?? null)
        : user.profileImage;

    await db
      .update(users)
      .set({ images: updatedImages, profileImage: updatedProfileImage })
      .where(eq(users.id, userId));

    return {};
  } catch (err) {
    console.error("[deletePhoto]", err);
    return { error: "Failed to delete photo. Please try again." };
  }
}

export async function toggleHideLevel(
  hideLevel: boolean,
): Promise<{ error?: string }> {
  const userId = await requireSession();
  try {
    await db
      .update(users)
      .set({ hideLevel, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return {};
  } catch {
    return { error: "Failed to update setting." };
  }
}

export async function toggleRadarVisible(
  isRadarVisible: boolean,
): Promise<{ error?: string }> {
  const userId = await requireSession();
  try {
    await db
      .update(users)
      .set({ isRadarVisible, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return {};
  } catch {
    return { error: "Failed to update setting." };
  }
}

export async function toggleCodePublic(
  codeId: string,
  isPublic: boolean,
): Promise<{ error?: string }> {
  const userId = await requireSession();
  try {
    await db
      .update(vouchCodes)
      .set({ isPublic })
      .where(
        // Ensure the code actually belongs to this user
        and(eq(vouchCodes.id, codeId), eq(vouchCodes.issuerId, userId)),
      );
    return {};
  } catch {
    return { error: "Failed to update code visibility." };
  }
}

export async function updateBio(bio: string): Promise<{ error?: string }> {
  const userId = await requireSession();

  const trimmed = bio.trim();
  if (trimmed.length > 300)
    return { error: "Bio must be 300 characters or less." };

  try {
    await db
      .update(users)
      .set({ bio_headline: trimmed || null, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return {};
  } catch {
    return { error: "Failed to update bio. Please try again." };
  }
}

export async function updateInterests(
  interests: string[],
): Promise<{ error?: string }> {
  const userId = await requireSession();

  if (interests.length < 3) return { error: "Pick at least 3 interests." };

  try {
    await db
      .update(users)
      .set({ interests, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return {};
  } catch {
    return { error: "Failed to save interests. Please try again." };
  }
}

export async function addPhoto(
  base64: string,
): Promise<{ error?: string; url?: string }> {
  const userId = await requireSession();

  try {
    const [user] = await db
      .select({ images: users.images })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return { error: "Account not found." };

    const current = user.images ?? [];

    if (current.length >= 4) return { error: "Maximum 4 photos allowed." };

    const result = await cloudinary.uploader.upload(base64, {
      folder: "vouch-images",
      resource_type: "image",
    });

    await db
      .update(users)
      .set({ images: [...current, result.secure_url] })
      .where(eq(users.id, userId));

    return { url: result.secure_url };
  } catch (err) {
    console.error("[addPhoto]", err);
    return { error: "Failed to upload photo. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// Vibe fields (intent, social_energy, energy_vibe, relationship_style,
//              conflict_style)
// ---------------------------------------------------------------------------

export async function updateVibeFields(fields: {
  intent: string | null;
  socialEnergy: string | null;
  energyVibe: string | null;
  relationshipStyle: string | null;
  conflictStyle: string | null;
}): Promise<{ error?: string }> {
  const userId = await requireSession();
  try {
    await db
      .update(users)
      .set({
        intent: fields.intent,
        social_energy: fields.socialEnergy,
        energy_vibe: fields.energyVibe,
        relationship_style: fields.relationshipStyle,
        conflict_style: fields.conflictStyle,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    return {};
  } catch {
    return { error: "Failed to update. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// Deep dive text fields (lifestyle_snapshot, deal_breakers,
//                        relationship_vision)
// ---------------------------------------------------------------------------

export async function updateDeepDives(fields: {
  lifestyleSnapshot: string | null;
  dealBreakers: string | null;
  relationshipVision: string | null;
}): Promise<{ error?: string }> {
  const userId = await requireSession();
  try {
    await db
      .update(users)
      .set({
        lifestyle_snapshot: fields.lifestyleSnapshot,
        deal_breakers: fields.dealBreakers,
        relationship_vision: fields.relationshipVision,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    return {};
  } catch {
    return { error: "Failed to update. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// Prompt (prompt_question + prompt_answer)
// ---------------------------------------------------------------------------

export async function updatePrompt(fields: {
  promptQuestion: string | null;
  promptAnswer: string | null;
}): Promise<{ error?: string }> {
  const userId = await requireSession();

  if (fields.promptAnswer && fields.promptAnswer.trim().length > 120)
    return { error: "Answer must be 120 characters or less." };

  try {
    await db
      .update(users)
      .set({
        prompt_question: fields.promptQuestion,
        prompt_answer: fields.promptAnswer?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    return {};
  } catch {
    return { error: "Failed to update prompt. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// Onboarding JSONB answers (passion_signal, misunderstood_trait, etc.)
// ---------------------------------------------------------------------------

export async function updateOnboardingAnswers(
  updates: Record<string, string | null>,
): Promise<{ error?: string }> {
  const userId = await requireSession();
  try {
    const [user] = await db
      .select({ answers: users.onboarding_answers })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const current = (user?.answers as Record<string, unknown>) ?? {};
    const merged = { ...current, ...updates };

    await db
      .update(users)
      .set({ onboarding_answers: merged, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return {};
  } catch {
    return { error: "Failed to update. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// Push Subscriptions
// ---------------------------------------------------------------------------

export async function savePushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<{ success: true } | { error: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return { error: "Not authenticated." };

  const session = await decrypt(token);
  if (!session) return { error: "Invalid session." };

  const userId = session.userId as string;

  try {
    await db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      })
      .onConflictDoNothing();

    return { success: true };
  } catch {
    return { error: "Failed to save subscription." };
  }
}
