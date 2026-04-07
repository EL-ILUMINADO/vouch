// lib/auth.ts
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET;

if (!secretKey) {
  throw new Error("SESSION_SECRET environment variable is strictly required.");
}

const key = new TextEncoder().encode(secretKey);

export interface SessionPayload extends JWTPayload {
  userId: string;
  isVerified: boolean;
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(
  userId: string,
  isVerified: boolean,
): Promise<void> {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const payload: SessionPayload = { userId, isVerified };

  const session = await encrypt(payload);
  const cookieStore = await cookies();

  cookieStore.set("vouch_session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  cookieStore.set("vouch_status", isVerified ? "verified" : "unverified", {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}
