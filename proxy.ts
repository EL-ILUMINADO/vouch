// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/onboarding/vouch",
  "/onboarding/verify",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // TODO: Replace with actual session token read (e.g., Auth.js or custom JWT)
  const isAuthenticated = request.cookies.has("vouch_session");
  const isVerified = request.cookies.get("vouch_status")?.value === "verified";

  if (PUBLIC_ROUTES.includes(pathname)) {
    if (isAuthenticated && isVerified && pathname === "/") {
      return NextResponse.redirect(new URL("/radar", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isVerified && !pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/onboarding/verify", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
