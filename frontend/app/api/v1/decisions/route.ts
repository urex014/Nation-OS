import { buildRecommendation, parseRecommend } from "@/lib/db/ledger";
import { listDecisions, saveDecision } from "@/lib/db/decisions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET(): Promise<Response> {
  return Response.json({ decisions: await listDecisions() }, { headers: noStore });
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
  const result = buildRecommendation(parsed);
  const decision = await saveDecision(parsed, result);
  return Response.json({ decision, ...result }, { headers: noStore });
}
