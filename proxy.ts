import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/onboarding/vouch",
  "/onboarding/verify",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
