import { readDecimal, readWhole } from "@/lib/api/params";
import { shortfall } from "@/lib/domain/allocate";
import { projectHorizon } from "@/lib/domain/scenario";
import { scenarioInputs } from "@/lib/db/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  const url = new URL(request.url);
  const drop = readDecimal(url.searchParams.get("revenueDrop"), 15);
  const horizon = readWhole(url.searchParams.get("horizon"), 5);
  if (drop == null || drop < 0 || drop > 100) {
    return Response.json({ error: "Drop must be a number from 0 to 100." }, { status: 400 });
  }
  if (horizon == null || horizon < 1 || horizon > 30) {
    return Response.json(
      { error: "Horizon must be a whole number from 1 to 30." },
      { status: 400 },
    );
  }
  const inputs = scenarioInputs();
  const stress = shortfall(drop, inputs.overhead, inputs.mdas);
  const years = projectHorizon({
    horizon,
    drop,
    baseRevenue: inputs.baseRevenue,
    capital: inputs.capital,
    overhead: inputs.overhead,
    growth: inputs.growth,
    startYear: 2026,
  });
  return Response.json({
    horizon,
    drop,
    growth: inputs.growth,
    capital: inputs.capital,
    simulation_result: stress.sentence,
    years,
  });
}
