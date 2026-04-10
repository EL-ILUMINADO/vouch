"use server";

import { z } from "zod";
import { db } from "@/db";
import { users, vouchCodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SUPPORTED_UNIVERSITIES } from "@/lib/constants/universities";

function generateVouchCode(): string {
  // Uses unambiguous chars (no O/0, I/1 confusion)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (n: number) =>
    Array.from(
      { length: n },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
  return `${seg(4)}-${seg(4)}`;
}

const registerSchema = z
  .object({
    email: z.string().email("Invalid institutional email."),
    password: z.string().min(8, "Passphrase must be at least 8 characters."),
    name: z.string().min(2, "Identity label is too short."),
    university: z.string().min(1, "Select a valid institution."),
    department: z.string().min(2, "Department designation required."),
    level: z.string().min(1, "Academic level required."),
    vouchCode: z.string().min(1, "A valid Vouch Code is required for entry."),
  })
  .superRefine((data, ctx) => {
    // Cross-validate email domain against selected university
    const selectedUni = SUPPORTED_UNIVERSITIES.find(
      (u) => u.id === data.university,
    );
    const domain = data.email.split("@")[1];

    if (!selectedUni) {
      ctx.addIssue({
        code: "custom",
        message: "Selected institution is outside the current active sectors.",
        path: ["university"],
      });
      return;
    }

    if (!domain.endsWith(selectedUni.domain)) {
      ctx.addIssue({
        code: "custom",
        message: `Use your official ${selectedUni.name} email address.`,
        path: ["email"],
      });
    }
  });

export type RegisterState = {
  error?: string;
};

export async function registerUser(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const rawEntries = Object.fromEntries(formData.entries()) as Record<
    string,
    unknown
  >;
  const parseResult = registerSchema.safeParse(rawEntries);

  if (!parseResult.success) {
    return { error: parseResult.error.issues[0].message };
  }

  const data = parseResult.data;

  try {
    // 1. Check for the DEV Master Key FIRST
    const masterCode = process.env.MASTER_VOUCH_CODE;
    const isMasterKey = !!masterCode && data.vouchCode === masterCode;

    let issuerId: string | null = null;
    let validCodeId: string | null = null;

    // 2. If it's NOT the master key, verify the code in the DB normally
    if (!isMasterKey) {
      const [validCode] = await db
        .select()
        .from(vouchCodes)
        .where(
          and(
            eq(vouchCodes.code, data.vouchCode),
            eq(vouchCodes.isUsed, false),
          ),
        )
        .limit(1);

      if (!validCode) {
        return { error: "Vouch Code is invalid or has already been depleted." };
      }

      issuerId = validCode.issuerId;
      validCodeId = validCode.id;
    }

    // 3. Ensure they aren't already registered
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingUser) {
      return { error: "This institutional identity is already registered." };
    }

    // 4. Hash the password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // 5. The Transaction
    await db.transaction(async (tx) => {
      // Create the user
      const [newUser] = await tx
        .insert(users)
        .values({
          email: data.email,
          passwordHash,
          name: data.name,
          university: data.university,
          department: data.department,
          level: data.level,
          verificationMethod: "vouch",
          vouchedById: issuerId, // This will be null if they used the Master Key
        })
        .returning({ id: users.id });

      if (validCodeId) {
        await tx
          .update(vouchCodes)
          .set({ isUsed: true, usedById: newUser.id })
          .where(eq(vouchCodes.id, validCodeId));
      }

      // Give the new user 5 vouch codes to invite others
      await tx.insert(vouchCodes).values(
        Array.from({ length: 5 }, () => ({
          code: generateVouchCode(),
          issuerId: newUser.id,
        })),
      );

      // Log them in
      await createSession(newUser.id, false);
    });
  } catch (err: unknown) {
    const log = err instanceof Error ? err.message : "Unknown Error";
    console.error(`[REGISTRATION_ERROR]: ${log}`);
    return { error: "Structural failure during account provisioning." };
  }

  redirect("/onboarding/verify");
}
