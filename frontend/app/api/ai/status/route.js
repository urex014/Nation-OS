import { getAnalystAPI } from "../../../../lib/http-api.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = (request) => getAnalystAPI().status(request);
