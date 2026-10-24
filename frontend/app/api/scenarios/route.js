import { api, readJson } from "../../../lib/nigeria/http.mjs";
import { compareScenarios } from "../../../lib/nigeria/scenarios.mjs";
import { getPlanningContext } from "../../../lib/nigeria/repository.mjs";
export const runtime = "nodejs";
export const POST = api(async (request) => {
  const { config } = await readJson(request);
  return { scenarios: compareScenarios(config, getPlanningContext(config?.scope)) };
});
