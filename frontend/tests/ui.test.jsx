import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import React, { act } from "react";
import { JSDOM } from "jsdom";
// tsx uses the classic JSX transform for .jsx; Next supplies its own production transform.
globalThis.React = React;
delete process.env.AI_GATEWAY_API_KEY;
delete process.env.VERCEL_OIDC_TOKEN;
delete process.env.XAI_API_KEY;
const temporary = mkdtempSync(path.join(tmpdir(), "nationos-ui-"));
process.env.NATIONOS_DB_PATH = path.join(temporary, "test.sqlite");
const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
  url: "http://localhost/",
});
globalThis.window = dom.window;
globalThis.self = dom.window;
globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
const { Overview } = await import("../components/nigeria/overview.jsx");
const { Planner } = await import("../components/nigeria/planner.jsx");
const { IntelligenceChat } = await import("../components/nigeria/intelligence-chat.jsx");
const { POST: chatRoute } = await import("../app/api/chat/route.js");
const { DraftProvider } = await import("../components/nigeria/draft-provider.jsx");
const { getOverview, getJurisdictions } = await import("../lib/nigeria/repository.mjs");
const { getDatabase, prepareSourcedDatabase } = await import("../lib/nigeria/database.mjs");
prepareSourcedDatabase();
const { allocateBudget } = await import("../lib/nigeria/planning.mjs");
const { POST: planRoute } = await import("../app/api/plans/route.js");
const root = createRoot(document.getElementById("root"));
test("map has 37 keyboard-selectable real jurisdictions", async () => {
  await act(async () => root.render(<Overview data={getOverview()} />));
  const paths = document.querySelectorAll('path[role="button"]');
  assert.equal(paths.length, 37);
  const abia = [...paths].find((p) => p.getAttribute("aria-label") === "Abia");
  await act(async () =>
    abia.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
  );
  assert.equal(abia.getAttribute("aria-pressed"), "true");
  assert.match(document.body.textContent, /Abia/);
});
test("planner allocation and calculation buttons call the backend and expose formulas", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    if (url === "/api/allocations")
      return Response.json(allocateBudget(body.annualBudgetNaira, body.strategy));
    if (url === "/api/plans") return planRoute(new Request("http://localhost/api/plans", options));
    throw Error("Unexpected request " + url);
  };
  try {
    await act(async () =>
      root.render(
        <DraftProvider>
          <Planner jurisdictions={getJurisdictions()} />
        </DraftProvider>,
      ),
    );
    function button(text) {
      return [...document.querySelectorAll("button")].find((b) => b.textContent.includes(text));
    }
    await act(async () => button("Apply these weights").click());
    assert.match(document.body.textContent, /Largest remainders/);
    assert.match(document.body.textContent, /Our guesses about the future/);
    await act(async () => button("Work out this plan").click());
    assert.match(document.body.textContent, /DATABASE_URL/);
    assert.equal(getDatabase().prepare("select count(*) n from plan_runs").get().n, 0);
    assert.equal(button("Save this draft"), undefined);
  } finally {
    globalThis.fetch = original;
  }
});
test("chat questions render sourced answers and can start a new conversation", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/chat");
    return chatRoute(new Request("http://localhost/api/chat", options));
  };
  try {
    await act(async () =>
      root.render(
        <DraftProvider>
          <IntelligenceChat jurisdictions={getJurisdictions()} />
        </DraftProvider>,
      ),
    );
    const button = (text) =>
      [...document.querySelectorAll("button")].find((element) =>
        element.textContent.includes(text),
      );
    await act(async () => button("Compare Lagos and Rivers revenue").click());
    const log = document.querySelector('[role="log"]');
    assert.match(log.textContent, /Lagos/);
    assert.match(log.textContent, /Rivers/);
    assert.equal(log.querySelectorAll("tbody tr").length, 2);
    assert.ok(log.querySelector('a[href="/sources#nbs-igr-2019-2025"]'));
    await act(async () => button("New conversation").click());
    assert.equal(log.querySelectorAll("article").length, 1);
    assert.equal(log.querySelectorAll("table").length, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test.after(async () => {
  await act(async () => root.unmount());
  dom.window.close();
  for (const db of globalThis[Symbol.for("nationos.sqlite")].values()) db.close();
  globalThis[Symbol.for("nationos.sqlite")].clear();
  rmSync(temporary, { recursive: true, force: true });
});
