import { api, readJson } from "../../../lib/nigeria/http.mjs";
import { calculateAndStore } from "../../../lib/nigeria/decisions.mjs";
export const runtime = "nodejs";
export const POST = api(async (request) => calculateAndStore((await readJson(request)).config));
