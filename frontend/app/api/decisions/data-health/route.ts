import { api } from "../../../../lib/nigeria/http.mjs";
import { getDataHealthSummary } from "../../../../lib/intelligence/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = api(async () => {
  const health = await getDataHealthSummary();
  return health;
});
