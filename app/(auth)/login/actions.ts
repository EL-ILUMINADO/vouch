"use server";

import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { redirect } from "next/navigation";

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
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.passwordHash) {
      return { error: "Invalid credentials or unauthorized access." };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return { error: "Invalid credentials or unauthorized access." };
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
