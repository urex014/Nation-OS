import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

delete process.env.AI_GATEWAY_API_KEY;
delete process.env.VERCEL_OIDC_TOKEN;
delete process.env.XAI_API_KEY;
delete process.env.AI_MODEL;
delete process.env.VERCEL;

const directory = mkdtempSync(path.join(tmpdir(), "nationos-ai-"));
process.env.NATIONOS_DB_PATH = path.join(directory, "nigeria.sqlite");
process.env.NATIONOS_AUTH_DB_PATH = path.join(directory, "auth.sqlite");
process.env.NATION_DB_PATH = path.join(directory, "ledger.sqlite");
const { prepareSourcedDatabase } = await import("../lib/nigeria/database.mjs");
prepareSourcedDatabase();

const { groundReply } = await import("../lib/ai/ground.mjs");
const { advise } = await import("../lib/ai/advise.mjs");
const { answerChat } = await import("../lib/ai/answer.mjs");
const { createTools } = await import("../lib/ai/tools.mjs");
const {
  aiConfigured,
  activeModelId,
  gatewayModelId,
  gatewayReady,
  gatewaySettings,
  DEFAULT_GATEWAY_MODEL,
  DEFAULT_XAI_MODEL,
} = await import("../lib/ai/model.mjs");
const { POST } = await import("../app/api/chat/route.js");

test("citizen tools are read-only and a zero change keeps the published Lagos tax", async () => {
  assert.equal(aiConfigured(), false);
  assert.equal(gatewayReady(), false);
  process.env.VERCEL = "1";
  assert.equal(gatewayReady(), true);
  delete process.env.VERCEL;
  assert.equal(gatewayModelId(), DEFAULT_GATEWAY_MODEL);
  assert.equal(activeModelId(), DEFAULT_XAI_MODEL);
  const citizen = createTools("citizen");
  assert.equal(citizen.runSimulation, undefined);
  assert.equal(typeof citizen.getStateRevenue.execute, "function");
  const government = createTools("government");
  const illustrated = await government.runSimulation.execute({
    kind: "tax",
    state: "Lagos",
    year: 2025,
    taxPercent: 0,
  });
  assert.equal(illustrated.projectedTaxNaira, illustrated.publishedTaxNaira);
  assert.match(illustrated.note, /Projection/);
  assert.equal(illustrated.sourceId, "nbs-igr-2019-2025");
});

test("a mocked model cannot keep a number the tools did not return", async () => {
  const answer = await advise({
    message: "How much internally generated revenue did Lagos collect in 2025?",
    role: "citizen",
    generate: async ({ tools }) => {
      const row = await tools.getStateRevenue.execute({ state: "Lagos", year: 2025 });
      return `Lagos collected ${row.displayTotal} in ${row.year}. A made-up extra is 424242.`;
    },
  });
  assert.equal(answer.mode, "ai-checked");
  assert.equal(answer.removedFigures.includes("424242"), true);
  const text = answer.paragraphs.join("\n");
  assert.equal(text.includes("424242"), false);
  assert.match(text, /A figure was removed because it was not in the tool results/);
  assert.match(text, /1\.77/);
  assert.equal(answer.sources[0].id, "nbs-igr-2019-2025");
});

test("with no key the chat stays on the rule-based engine", async () => {
  const logged = [];
  const write = console.error;
  console.error = (line) => logged.push(String(line));
  let local;
  let fallen;
  let missingOidc;
  try {
    local = await answerChat({ question: "Compare Lagos and Rivers revenue" });
    fallen = await answerChat(
      { message: "Compare Lagos and Rivers revenue" },
      {
        forceAi: true,
        generate: async () => {
          throw Error("model unavailable");
        },
      },
    );
    missingOidc = await answerChat(
      { message: "Compare Lagos and Rivers revenue" },
      {
        forceAi: true,
        generate: async () => {
          throw Error(
            "The 'x-vercel-oidc-token' header is missing from the request. Do you have the OIDC option enabled in the Vercel project settings?",
          );
        },
      },
    );
  } finally {
    console.error = write;
  }
  assert.equal(local.mode, "local-data");
  assert.equal(local.aiStatus, "not_configured");
  assert.equal(local.table.rows.length, 2);
  assert.equal(fallen.mode, "local-data");
  assert.equal(fallen.aiStatus, "error");
  assert.equal(missingOidc.aiStatus, "not_configured");
  assert.match(logged[0], /fell back \(not_configured\)/);
  assert.match(logged[1], /fell back \(error\): model unavailable/);
  assert.match(logged[2], /x-vercel-oidc-token/);
  assert.doesNotMatch(logged.join("\n"), /eyJ|sk_|bearer /i);
  const cardLogged = [];
  console.error = (line) => cardLogged.push(String(line));
  let card;
  let hung;
  try {
    card = await answerChat(
      { message: "Compare Lagos and Rivers revenue" },
      {
        forceAi: true,
        generate: async () => {
          throw Error("AI Gateway requires a valid credit card on file");
        },
      },
    );
    const started = Date.now();
    hung = await answerChat(
      { question: "Compare Lagos and Rivers revenue" },
      {
        forceAi: true,
        timeoutMs: 40,
        generate: () => new Promise(() => {}),
      },
    );
    assert.ok(Date.now() - started < 2000);
  } finally {
    console.error = write;
  }
  assert.equal(card.aiStatus, "error");
  assert.equal(card.mode, "local-data");
  assert.match(cardLogged.join("\n"), /credit card/);
  assert.equal(hung.aiStatus, "error");
  assert.equal(hung.mode, "local-data");
  assert.match(cardLogged.join("\n"), /fell back \(error\): timeout/);
  delete process.env.AI_GATEWAY_API_KEY;
  const settings = gatewaySettings({ oidcToken: "oidc-header-token" });
  assert.equal(settings.apiKey, "oidc-header-token");
  assert.equal(settings.headers["x-vercel-oidc-token"], "oidc-header-token");
  const forwarded = await advise({
    message: "How much internally generated revenue did Lagos collect in 2025?",
    role: "citizen",
    oidcToken: "header-token",
    generate: async (input) => {
      assert.equal(input.oidcToken, "header-token");
      const row = await input.tools.getStateRevenue.execute({ state: "Lagos", year: 2025 });
      return `Lagos collected ${row.displayTotal}.`;
    },
  });
  assert.equal(forwarded.mode, "ai");
  await assert.rejects(
    () => answerChat({ message: " " }, { forceAi: true, generate: async () => "no" }),
    { status: 400 },
  );
});

test("the number check drops a sentence the tools do not support", () => {
  const grounded = groundReply("The rank is 1. A secret total is 999999.", [
    { rank: 1, note: "published" },
  ]);
  assert.equal(grounded.flagged, true);
  assert.match(grounded.text, /rank is 1/);
  assert.equal(grounded.text.includes("999999"), false);
});

test("a streamed message is labelled with the engine that answered", async () => {
  const stream = await POST(
    new Request("http://127.0.0.1:4173/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Compare Lagos and Rivers revenue", stream: true }),
    }),
  );
  assert.equal(stream.status, 200);
  assert.equal(stream.headers.get("x-nationos-mode"), "local-data");
  assert.equal(stream.headers.get("x-nationos-ai-status"), "not_configured");
  assert.match(await stream.text(), /Lagos/);
});

test.after(() => {
  for (const db of globalThis[Symbol.for("nationos.sqlite")]?.values() ?? []) db.close();
  globalThis[Symbol.for("nationos.sqlite")]?.clear();
  rmSync(directory, { recursive: true, force: true });
});
