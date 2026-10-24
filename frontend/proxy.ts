import { NextResponse, type NextRequest } from "next/server";
import { userFromToken } from "./lib/auth/token";
import { SESSION_COOKIE } from "./lib/auth/token";
import {
  GOVERNMENT_PATHS,
  homeFor,
  isGovernmentWrite,
  roleForDashboard,
  type PublicUser,
} from "./lib/auth/types";

const PUBLIC_PAGES = new Set(["/", "/sign-in", "/forbidden"]);
const PUBLIC_API = new Set([
  "/api/auth/sign-in",
  "/api/auth/sign-up",
  "/api/auth/sign-out",
  "/api/auth/session",
]);

function signedOut(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Sign in to continue." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

function wrongRole(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "This role cannot open that route." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.redirect(new URL("/forbidden", request.url));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let user: PublicUser | null = null;
  try {
    user = userFromToken(request.cookies.get(SESSION_COOKIE)?.value);
  } catch {
    user = null;
  }

  if (pathname === "/sign-in" && user) {
    return NextResponse.redirect(new URL(homeFor(user.role), request.url));
  }
  if (pathname === "/dashboard") {
    return user
      ? NextResponse.redirect(new URL(homeFor(user.role), request.url))
      : signedOut(request);
  }

  const required = roleForDashboard(pathname);
  if (required) {
    if (!user) return signedOut(request);
    if (user.role !== required) return wrongRole(request);
    return NextResponse.next();
  }

  const governmentTool = (GOVERNMENT_PATHS as readonly string[]).includes(pathname);
  if (governmentTool || isGovernmentWrite(pathname, request.method)) {
    if (!user) return signedOut(request);
    if (user.role !== "government") return wrongRole(request);
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PAGES.has(pathname) || PUBLIC_API.has(pathname);
  if (!isPublic && !user) return signedOut(request);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
