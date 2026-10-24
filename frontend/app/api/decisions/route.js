import { api, readJson } from "../../../lib/nigeria/http.mjs";
import { createDecision, listDecisions } from "../../../lib/nigeria/decisions.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = api((request) => {
  const params = new URL(request.url).searchParams;
  return listDecisions(Number(params.get("limit") || 20), Number(params.get("offset") || 0));
});
export const POST = api(async (request) => createDecision(await readJson(request)));
