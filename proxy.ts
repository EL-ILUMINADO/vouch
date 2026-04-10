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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Admin routes ---
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const adminToken = request.cookies.get("vouch_admin")?.value;
    const isAdmin = adminToken ? await verifyAdminSession(adminToken) : false;

    if (!isAdmin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
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
      return NextResponse.redirect(new URL("/radar", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!hasCompletedOnboarding && !pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/onboarding/verify", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
