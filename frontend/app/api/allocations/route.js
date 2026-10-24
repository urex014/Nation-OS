import { api, readJson } from "../../../lib/nigeria/http.mjs";
import { allocateBudget } from "../../../lib/nigeria/planning.mjs";
export const runtime = "nodejs";
export const POST = api(async (request) => {
  const input = await readJson(request);
  return allocateBudget(input.annualBudgetNaira, input.strategy);
});
