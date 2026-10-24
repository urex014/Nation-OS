import { ledgerAnswer } from "@/lib/db/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const query =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as { query?: unknown }).query
      : undefined;
  if (typeof query !== "string" || query.trim().length < 3 || query.length > 500) {
    return Response.json({ error: "Query must be 3 to 500 characters." }, { status: 400 });
  }
  return Response.json({ answer: ledgerAnswer(query.trim()) });
}
