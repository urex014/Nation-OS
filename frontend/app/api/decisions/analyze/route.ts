import { api, readJson } from "../../../../lib/nigeria/http.mjs";
import { parseNairaToKobo } from "../../../../lib/intelligence/money";
import { analyzeDecisionQuery } from "../../../../lib/intelligence/ai-grounding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = api(async (request: Request) => {
  const body = await readJson(request);
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    throw Object.assign(new Error("Please enter a question for the project decision engine."), { status: 400 });
  }

  const proposedBudgetKobo = body.proposedBudget ? parseNairaToKobo(body.proposedBudget) : undefined;
  const selectedLga = body.lga?.trim() || undefined;
  const selectedSector = body.sector?.trim() || undefined;

  const result = await analyzeDecisionQuery({
    question,
    proposedBudgetKobo,
    selectedLga,
    selectedSector,
  });

  return result;
});
