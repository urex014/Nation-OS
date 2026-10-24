import { readJson } from "../../../../lib/nigeria/http.mjs";
import { httpFailure, jsonError, withSession } from "../../../../lib/auth/http";
import {
  authenticate,
  clearFailures,
  registerFailure,
  tooManyAttempts,
} from "../../../../lib/auth/service";
import { destinationFor } from "../../../../lib/auth/types";
import { fieldErrorsFrom, signInSchema } from "../../../../lib/auth/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const parsed = signInSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return jsonError("Check the form and try again.", 400, fieldErrorsFrom(parsed.error));
    }
    if (tooManyAttempts(parsed.data.email)) {
      return jsonError("Too many attempts. Wait a few minutes and try again.", 429);
    }
    const result = await authenticate(parsed.data.email, parsed.data.password);
    if (!result) {
      registerFailure(parsed.data.email);
      return jsonError("Email or password is incorrect.", 401);
    }
    clearFailures(parsed.data.email);
    return withSession(
      { user: result.user, dashboardPath: destinationFor(result.user.role, parsed.data.next) },
      result.token,
    );
  } catch (error) {
    return httpFailure(error);
  }
}
