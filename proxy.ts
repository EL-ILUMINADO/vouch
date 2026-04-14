import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/codes",
  "/onboarding/vouch",
  "/onboarding/verify",
];

const ALLOWED_METHODS = ["GET", "HEAD", "POST", "OPTIONS"];

const CSP = [
  "default-src 'self'",
  // Next.js requires unsafe-inline / unsafe-eval for its runtime
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  // Cloudinary for user images/videos
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "media-src 'self' blob: https://res.cloudinary.com",
  // Pusher WebSocket & HTTP endpoints + Cloudinary direct upload
  "connect-src 'self' wss://ws-mt1.pusher.com https://sockjs-mt1.pusher.com https://api.pusherapp.com https://api.cloudinary.com",
  "font-src 'self'",
  // Prevent this page from being embedded anywhere (clickjacking)
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
].join("; ");

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("Content-Security-Policy", CSP);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=()",
  );
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block any HTTP method that isn't needed by this app
  if (!ALLOWED_METHODS.includes(request.method)) {
    return new NextResponse(null, {
      status: 405,
      headers: { Allow: ALLOWED_METHODS.join(", ") },
    });
  }

  // --- Admin routes ---
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return withSecurityHeaders(NextResponse.next());
    }

    const adminToken = request.cookies.get("vouch_admin")?.value;
    const isAdmin = adminToken ? await verifyAdminSession(adminToken) : false;

    if (!isAdmin) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/admin/login", request.url)),
      );
    }

    return withSecurityHeaders(NextResponse.next());
  }

  // --- User routes ---
  const isAuthenticated = request.cookies.has("vouch_session");
  const vouchStatus = request.cookies.get("vouch_status")?.value;

  // "verified"       → admin-approved, full access
  // "pending_review" → liveness submitted, awaiting review, can browse radar
  const hasCompletedOnboarding =
    vouchStatus === "verified" || vouchStatus === "pending_review";

  if (PUBLIC_ROUTES.includes(pathname)) {
    if (isAuthenticated && hasCompletedOnboarding && pathname === "/") {
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/radar", request.url)),
      );
    }
    return withSecurityHeaders(NextResponse.next());
  }

  if (!isAuthenticated) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/", request.url)),
    );
  }

  if (!hasCompletedOnboarding && !pathname.startsWith("/onboarding")) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/onboarding/verify", request.url)),
    );
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
