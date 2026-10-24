import { answerChat } from "../../../lib/ai/answer.mjs";
import { assertChatBudget, chatLimitKey } from "../../../lib/ai/limit.mjs";
import { readJson } from "../../../lib/nigeria/http.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error) {
  return Response.json(
    { error: error?.status ? error.message : "The request could not be completed." },
    {
      status: error?.status || 500,
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    },
  );
}

async function roleFrom(request) {
  try {
    const cookie = request.headers.get("cookie") || "";
    const match = cookie.match(/(?:^|;\s*)nationos_session=([^;]+)/);
    if (!match) return null;
    const { userFromToken } = await import("../../../lib/auth/token");
    return userFromToken(decodeURIComponent(match[1]))?.role ?? null;
  } catch {
    return null;
  }
}

function streamText(text) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      const chunks = text.match(/.{1,80}/gs) || [""];
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

// Nation AI posts { message } or { question }. main's contract posts { query }.
export async function POST(request) {
  try {
    const body = await readJson(request);
    if (Object.hasOwn(body, "query") && !Object.hasOwn(body, "message")) {
      if (
        typeof body.query !== "string" ||
        body.query.trim().length < 3 ||
        body.query.length > 500
      ) {
        throw Object.assign(Error("Query must be 3 to 500 characters."), { status: 400 });
      }
      const { ledgerAnswer } = await import("../../../lib/db/ledger");
      return Response.json(
        { answer: ledgerAnswer(body.query.trim()) },
        { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
      );
    }
    assertChatBudget(chatLimitKey(request));
    const answer = await answerChat(body, {
      role: await roleFrom(request),
      oidcToken: request.headers.get("x-vercel-oidc-token") || "",
    });
    if (body.stream === true) {
      const text = (answer.paragraphs || []).join("\n\n");
      return new Response(streamText(text), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "X-NationOS-Mode": answer.mode || "local-data",
          "X-NationOS-AI-Status": answer.aiStatus || "not_configured",
        },
      });
    }
    return Response.json(answer, {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-NationOS-AI-Status": answer.aiStatus || "not_configured",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
