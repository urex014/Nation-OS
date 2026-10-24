import { api } from "../../../../../../lib/nigeria/http.mjs";
import { getProjectSources } from "../../../../../../lib/intelligence/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = api(async (_: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const sources = await getProjectSources(id);
  return { sources };
});
