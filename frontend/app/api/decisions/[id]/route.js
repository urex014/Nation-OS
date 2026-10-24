import { api, readJson } from "../../../../lib/nigeria/http.mjs";
import { getDecision, reviewDecision } from "../../../../lib/nigeria/decisions.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = api(async (_, { params }) => getDecision((await params).id));
export const PATCH = api(async (request, { params }) =>
  reviewDecision((await params).id, await readJson(request)),
);
