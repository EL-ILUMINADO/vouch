import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET;

if (!secretKey) {
  throw new Error("SESSION_SECRET environment variable is strictly required.");
}

const key = new TextEncoder().encode(secretKey);

const ADMIN_COOKIE = "vouch_admin";
const EXPIRES_MS = 8 * 60 * 60 * 1000; // 8 hours

export async function createAdminSession(): Promise<void> {
  const token = await new SignJWT({ isAdmin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(key);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    expires: new Date(Date.now() + EXPIRES_MS),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function verifyAdminSession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload.isAdmin === true;
  } catch {
    return false;
  }
}

export async function deleteAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
