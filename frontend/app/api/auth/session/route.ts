import { NextResponse } from "next/server";
import { userFromToken } from "../../../../lib/auth/service";
import { landingFor } from "../../../../lib/auth/types";
import { SESSION_COOKIE } from "../../../../lib/auth/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  const user = userFromToken(token ? decodeURIComponent(token) : null);
  return NextResponse.json(user ? { user, dashboardPath: landingFor(user.role) } : { user: null }, {
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
