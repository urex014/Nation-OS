import { readJson } from "../../../../lib/nigeria/http.mjs";
import { httpFailure, jsonError, withSession } from "../../../../lib/auth/http";
import { openSession, registerCitizen } from "../../../../lib/auth/service";
import { destinationFor } from "../../../../lib/auth/types";
import { fieldErrorsFrom, signUpSchema } from "../../../../lib/auth/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const parsed = signUpSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return jsonError("Check the form and try again.", 400, fieldErrorsFrom(parsed.error));
    }
    if (parsed.data.role && parsed.data.role !== "citizen") {
      return jsonError(
        "New accounts are citizen accounts. A government seat is not granted from this form.",
        403,
      );
    }
    const created = registerCitizen(parsed.data);
    if (created === "exists") return jsonError("An account with that email already exists.", 409);
    const session = openSession(created);
    return withSession(
      { user: session.user, dashboardPath: destinationFor(session.user.role, parsed.data.next) },
      session.token,
      201,
    );
  } catch (error) {
    return httpFailure(error);
  }
}
