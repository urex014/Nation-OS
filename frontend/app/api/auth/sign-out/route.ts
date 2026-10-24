import { readJson } from "../../../../lib/nigeria/http.mjs";
import { clearSession, httpFailure } from "../../../../lib/auth/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Signing out only removes the cookie. The token is not stored on the server. */
export async function POST(request: Request) {
  try {
    await readJson(request);
    return clearSession({ ok: true });
  } catch (error) {
    return httpFailure(error);
  }
}
