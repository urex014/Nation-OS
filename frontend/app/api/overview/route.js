import { api } from "../../../lib/nigeria/http.mjs";
import { getOverview } from "../../../lib/nigeria/repository.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = api(() => getOverview());
