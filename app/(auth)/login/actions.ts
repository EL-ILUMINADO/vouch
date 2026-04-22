"use server";

import { z } from "zod";
import { db } from "@/db";
import { users, bannedDevices } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const loginSchema = z.object({
  email: z.string().email("Invalid institutional email format."),
  password: z.string().min(8, "Passphrase must be at least 8 characters."),
});

export type LoginState = {
  error?: string;
  success?: boolean;
};

export async function loginUser(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const rawEntries = Object.fromEntries(formData.entries()) as Record<
    string,
    unknown
  >;
  const parseResult = loginSchema.safeParse(rawEntries);

  if (!parseResult.success) {
    return { error: parseResult.error.issues[0].message };
  }

  const { email, password } = parseResult.data;

  try {
    const cookieStore = await cookies();
    const existingDeviceId = cookieStore.get("vouch_device")?.value;

    // Check if this device is banned before even looking up the user
    if (existingDeviceId) {
      const [bannedDevice] = await db
        .select({ id: bannedDevices.id })
        .from(bannedDevices)
        .where(eq(bannedDevices.deviceId, existingDeviceId))
        .limit(1);

      if (bannedDevice) {
        return {
          error:
            "Access from this device has been permanently revoked. Contact support if you believe this is a mistake.",
        };
      }
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.passwordHash) {
      return { error: "Invalid credentials or unauthorized access." };
    }

    if (user.isBanned) {
      return {
        error:
          "This account has been permanently banned for violating community guidelines.",
      };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return { error: "Invalid credentials or unauthorized access." };
    }

    // Assign or reuse a persistent device fingerprint
    const deviceId = existingDeviceId ?? randomUUID();

    if (!existingDeviceId) {
      cookieStore.set("vouch_device", deviceId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
      });
    }

    // Keep device ID on the user record so banning can reference it
    if (user.deviceId !== deviceId) {
      await db
        .update(users)
        .set({ deviceId, updatedAt: new Date() })
        .where(eq(users.id, user.id));
    }

    const isVerified = user.verificationStatus === "verified";
    await createSession(user.id, isVerified);
  } catch (err: unknown) {
    const log = err instanceof Error ? err.message : "Unknown Error";
    console.error(`[LOGIN_ACTION_ERROR]: ${log}`);

    return { error: "A structural system anomaly occurred. Retry." };
  }

  redirect("/radar");
}
