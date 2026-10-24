import { buildRecommendation, parseRecommend } from "@/lib/db/ledger";
import { listDecisions, saveDecision } from "@/lib/db/decisions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

function fail(error: unknown): Response {
  const status = Number((error as { status?: number })?.status) || 500;
  const message =
    error instanceof Error && (status === 503 || (status >= 400 && status < 500))
      ? error.message
      : "The request could not be completed.";
  return Response.json({ error: message }, { status, headers: noStore });
}

export async function GET(): Promise<Response> {
  try {
    return Response.json({ decisions: await listDecisions() }, { headers: noStore });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const parsed = parseRecommend(body);
  if (typeof parsed === "string") return Response.json({ error: parsed }, { status: 400 });
  try {
    const result = buildRecommendation(parsed);
    const decision = await saveDecision(parsed, result);
    return Response.json({ decision, ...result }, { headers: noStore });
  } catch (error) {
    return fail(error);
  }
}
