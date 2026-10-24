import { generateText, isStepCount } from "ai";
import { getSources } from "../nigeria/repository.mjs";
import { groundReply } from "./ground.mjs";
import { activeModelId, resolveModel } from "./model.mjs";
import { createTools, sourceIdsFrom } from "./tools.mjs";

const SHARED = `You answer questions about Nigerian public money for NationOS.
Answer in plain English. Use short sentences.
Cite the source named by the tool.
Label every projection as conditional. Say it is not a decision and not a forecast of jobs or services.
If a tool says data is missing, say that. Do not estimate a replacement.
Every number you write must appear in a tool result. Do not invent a figure, a rank, or a percent.
Call a tool before you state a figure.`;

function systemPrompt(role) {
  if (role === "government") {
    return `${SHARED}
You may call runSimulation for a tax-collection change or a budget plan.
Describe those results as projections. They do not approve a budget.`;
  }
  return `${SHARED}
You only have read-only tools. Do not offer to change a budget or run a simulation.
Explain where the published money goes.`;
}

export async function advise({ message, role, generate }) {
  if (typeof message !== "string" || message.trim().length < 1 || message.length > 2000) {
    throw Object.assign(Error("Ask a question between 1 and 2,000 characters."), { status: 400 });
  }
  const seat = role === "government" ? "government" : "citizen";
  const transcript = [];
  const tools = createTools(seat, transcript);
  const text = generate
    ? await generate({ tools, message, role: seat })
    : await liveGenerate({ tools, message, role: seat });
  const grounded = groundReply(text, transcript);
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
  };
}

async function liveGenerate({ tools, message, role }) {
  const model = await resolveModel();
  if (!model) throw Error("No AI credentials are configured.");
  const result = await generateText({
    model,
    system: systemPrompt(role),
    prompt: message,
    tools,
    stopWhen: isStepCount(4),
  });
  return result.text || "";
}
