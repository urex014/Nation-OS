import { readJson } from "../../../../lib/nigeria/http.mjs";
import { clearSession, httpFailure } from "../../../../lib/auth/http";
import { endSession } from "../../../../lib/auth/service";
import { SESSION_COOKIE } from "../../../../lib/auth/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await readJson(request);
    const token = request.headers
      .get("cookie")
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
      ?.slice(SESSION_COOKIE.length + 1);
    endSession(token ? decodeURIComponent(token) : null);
    return clearSession({ ok: true });
  } catch (error) {
    return httpFailure(error);
  }
}
