import { shortfall } from "@/lib/domain/allocate";
import { getDb } from "@/lib/db/connection";
import { overheadStats } from "@/lib/db/revenue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const drop =
    body && typeof body === "object"
      ? (body as { revenue_drop_percentage?: unknown }).revenue_drop_percentage
      : undefined;
  if (typeof drop !== "number" || !Number.isFinite(drop)) {
    return Response.json({ error: "Drop must be a number from 0 to 100." }, { status: 400 });
  }
  try {
    const stats = overheadStats(getDb(), 2026);
    const result = shortfall(drop, stats.overhead, stats.mdas);
    return Response.json({
      simulation_result: result.sentence,
      cut: result.cut,
      capitalUntouched: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Allocation failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
