import { generateText, isStepCount } from "ai";
import { getSources } from "../nigeria/repository.mjs";
import { conversationText } from "./history.mjs";
import { groundReply } from "./ground.mjs";
import { activeModelId, resolveModel } from "./model.mjs";
import { createTools, sourceIdsFrom } from "./tools.mjs";

const SHARED = `You answer questions about Nigerian public money for NationOS.
Use short, plain sentences.
Call a tool before you state a figure.
You must use calculate for any arithmetic. Do not do the math yourself.
Every number you write must come from a tool result, the recent conversation, or the person's own message.
If a tool says data is missing, say that in plain words. Do not invent a replacement.
Label a result as calculated from the source the tool names.
If the person typed the amount, say they entered it.
If a budget was assumed, call it an assumed budget and name the year, level, figure and source.
Cite the source named by the tool.
Recent conversation is there so a follow-up can reuse a budget. Do not treat an untouched planner default as their budget.`;

function systemPrompt(role) {
  if (role === "government") {
    return `${SHARED}
Use getBudget, getFaac and getFiscalSnapshot before you cite a 2026 budget, FAAC, debt, inflation, GDP or a project line.
Use checkProject when the person names one project amount. The tool chooses the base budget. Do not invent one.
Use allocateBudget to split money across sectors, and runSimulation for a tax change or a multi-year plan.
Do not invent a six-sector split. If a sector is missing, the plan tool fills the strategy default. Repeat that as an assumption.
Do not refuse a reasonable allocation or projection just because the derived figure is not already stored. Call the tool and quote it.
If a state budget is not loaded, say so, and offer to use an amount the person types.
Quote any warning and the best-fit option the tool returns, in the same plain words.
These results are not a decision. Nothing is saved unless the person saves it on the plan page.`;
  }
  return `${SHARED}
You can use calculate for read-only math on published figures or amounts the person typed.
Do not allocate a budget or run a simulation. This seat cannot do that.`;
}

function packWork(transcript) {
  const work = [];
  const links = [];
  const warnings = [];
  const alternatives = [];
  let bestReason = null;
  let memory = null;
  for (const item of transcript) {
    if (!item || typeof item !== "object") continue;
    if (item.formula) {
      work.push({
        formula: item.formula,
        inputs: Array.isArray(item.inputs) ? item.inputs : [],
        source: item.source || null,
        enteredByUser: Boolean(item.enteredByUser),
      });
    }
    if (Array.isArray(item.links)) links.push(...item.links);
    if (Array.isArray(item.warnings)) warnings.push(...item.warnings);
    if (Array.isArray(item.assumptions)) {
      for (const assumption of item.assumptions) {
        if (!warnings.includes(assumption) && !work.some((row) => row.formula === assumption)) {
          work.push({
            formula: assumption,
            inputs: [],
            source: "assumption",
            enteredByUser: false,
          });
        }
      }
    }
    if (Array.isArray(item.alternatives)) {
      for (const option of item.alternatives) {
        if (!alternatives.some((row) => row.id === option.id && row.title === option.title)) alternatives.push(option);
      }
    }
    if (item.bestReason) bestReason = item.bestReason;
    if (item.context?.budgetNaira) memory = item.context;
  }
  const seen = new Set();
  return {
    work,
    links: links.filter((link) => {
      if (!link?.href || seen.has(link.href)) return false;
      seen.add(link.href);
      return true;
    }),
    warnings: [...new Set(warnings)],
    alternatives,
    bestReason,
    context: memory,
  };
}

/** 12 seconds unless AI_TIMEOUT_MS or an explicit override says otherwise. */
export function aiTimeoutMs(override) {
  const chosen = override == null || override === "" ? process.env.AI_TIMEOUT_MS : override;
  const value = Number(chosen);
  if (Number.isFinite(value) && value >= 1 && value <= 120000) return value;
  return 12000;
}

export function withTimeout(work, ms) {
  const controller = new AbortController();
  let timer;
  const timed = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(Object.assign(new Error("timeout"), { reason: "timeout" }));
    }, ms);
  });
  const ran = Promise.resolve()
    .then(() => work(controller.signal))
    .finally(() => clearTimeout(timer));
  ran.catch(() => {});
  timed.catch(() => {});
  return Promise.race([ran, timed]).finally(() => clearTimeout(timer));
}

export async function advise({ message, role, history, page, context, generate, oidcToken, timeoutMs }) {
  if (typeof message !== "string" || message.trim().length < 1 || message.length > 2000) {
    throw Object.assign(Error("Ask a question between 1 and 2,000 characters."), { status: 400 });
  }
  const seat = role === "government" ? "government" : "citizen";
  const talk = conversationText(message, history, page);
  const transcript = [];
  const tools = createTools(seat, transcript, {
    message,
    history: talk.turns,
    page: talk.settings,
    context,
  });
  const text = await withTimeout(
    (signal) =>
      generate
        ? generate({
            tools,
            message: talk.prompt,
            history: talk.turns,
            page: talk.settings,
            role: seat,
            signal,
            oidcToken,
          })
        : liveGenerate({ tools, prompt: talk.prompt, role: seat, signal, oidcToken }),
    aiTimeoutMs(timeoutMs),
  );
  const spoken = [...transcript].reverse().find((item) => item?.checked && Array.isArray(item.paragraphs));
  const grounded = spoken
    ? { text: spoken.paragraphs.join("\n\n"), removed: [], flagged: false }
    : groundReply(text, transcript, talk.allow);
  const ids = sourceIdsFrom(transcript);
  const paragraphs = grounded.text.split(/\n\n+/).filter(Boolean);
  return {
    mode: grounded.flagged ? "ai-checked" : "ai",
    engine: "ai",
    model: activeModelId(),
    paragraphs: paragraphs.length ? paragraphs : ["No checked answer was produced."],
    sources: getSources().filter((source) => ids.includes(source.id)),
    context: null,
    removedFigures: grounded.removed,
    ...packWork(transcript),
  };
}

async function liveGenerate({ tools, prompt, role, signal, oidcToken }) {
  const model = await resolveModel({ oidcToken });
  if (!model) throw Error("No AI credentials are configured.");
  try {
    const result = await generateText({
      model,
      system: systemPrompt(role),
      prompt,
      tools,
      stopWhen: isStepCount(6),
      abortSignal: signal,
    });
    return result.text || "";
  } catch (error) {
    if (signal?.aborted) throw Object.assign(new Error("timeout"), { reason: "timeout" });
    throw error;
  }
}
