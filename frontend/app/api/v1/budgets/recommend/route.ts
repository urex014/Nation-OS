import { buildRecommendation, parseRecommend } from "@/lib/db/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const parsed = parseRecommend(await readBody(request));
  if (typeof parsed === "string") return Response.json({ error: parsed }, { status: 400 });
  return Response.json(buildRecommendation(parsed));
}

async function readBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
