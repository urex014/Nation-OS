import { answerQuestion } from "../nigeria/chat.mjs";
import { checkProjectRequest } from "../nigeria/project-check.mjs";
import { advise } from "./advise.mjs";
import { aiConfigured } from "./model.mjs";

export function chatMessage(body) {
  if (typeof body?.message === "string") return body.message;
  if (typeof body?.question === "string") return body.question;
  return "";
}

/** Drop tokens and keys before a line is written to the server log. */
export function safeAiReason(error) {
  const raw = error instanceof Error ? error.message : "AI request failed";
  return raw
    .replace(/bearer\s+\S+/gi, "bearer [redacted]")
    .replace(/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/\b(sk|xai|vck)_[A-Za-z0-9_-]{6,}/gi, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

export function aiStatusFor(reason) {
  if (/credit card/i.test(reason)) return "error";
  if (reason === "timeout") return "error";
  if (
    /x-vercel-oidc-token|oidc option|no authentication|no ai credentials|AI_GATEWAY_API_KEY/i.test(
      reason,
    )
  ) {
    return "not_configured";
  }
  return "error";
}

function projectAnswer(body, options, message) {
  if (!message.trim()) return null;
  const seat = options.role === "government" ? "government" : "citizen";
  const direct = checkProjectRequest({
    message,
    context: body?.context,
    history: body?.history,
    page: body?.page,
    role: seat,
  });
  if (!direct) return null;
  const configured = Boolean(options.forceAi || options.generate || aiConfigured());
  return {
    mode: "local-data",
    paragraphs: direct.paragraphs,
    context: {
      ...(body?.context && typeof body.context === "object" && !Array.isArray(body.context) ? body.context : {}),
      ...(direct.context || {}),
    },
    sources: [],
    work: direct.work || [],
    links: direct.links || [],
    warnings: direct.warnings || [],
    alternatives: direct.alternatives || [],
    bestReason: direct.bestReason || null,
    aiStatus: configured ? "ok" : "not_configured",
  };
}

export async function answerChat(body, options = {}) {
  const message = chatMessage(body);
  const normalized = { ...body, message };
  const direct = projectAnswer(body, options, message);
  if (direct) return direct;
  if (!Boolean(options.forceAi || options.generate || aiConfigured())) {
    console.error(
      "AI advisor fell back (not_configured): no AI_GATEWAY_API_KEY or XAI_API_KEY, and this process is not on Vercel.",
    );
    return {
      ...answerQuestion({ ...normalized, role: options.role }),
      aiStatus: "not_configured",
    };
  }
  try {
    const answer = await advise({
      message,
      role: options.role,
      history: body?.history,
      page: body?.page,
      context: body?.context,
      generate: options.generate,
      oidcToken: options.oidcToken,
      timeoutMs: options.timeoutMs,
    });
    return { ...answer, aiStatus: "ok" };
  } catch (error) {
    if (error?.status) throw error;
    const reason = safeAiReason(error);
    const aiStatus = aiStatusFor(reason);
    console.error(`AI advisor fell back (${aiStatus}): ${reason}`);
    return { ...answerQuestion({ ...normalized, role: options.role }), aiStatus };
  }
}
