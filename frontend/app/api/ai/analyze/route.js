import { getAnalystAPI } from "../../../../lib/http-api.mjs";
export const runtime = "nodejs";
export const maxDuration = 70;
export const POST = (request) => getAnalystAPI().analyze(request);
