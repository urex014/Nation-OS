/** Exercise actual React components, not a parallel HTML implementation. No browser or provider key is needed. */
import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import { WorkspaceProvider, useWorkspace } from "../components/workspace/provider";
import { CountryOverview } from "../components/country/overview";
import { CitizenRegister } from "../components/citizens/citizen-register";
import { Planner } from "../components/planning/planner";
import { DecisionMemory } from "../components/decisions/decision-memory";
import { AnalystWorkspace } from "../components/analyst/analyst-workspace";
import { createAIService } from "../lib/ai-service.mjs";

function SeedDraft() {
  const { draft, setDraft } = useWorkspace();
  return (
    <button
      onClick={() =>
        setDraft({
          ...draft,
          title: "React integration plan",
          reason: "Investigate school access barriers using a reviewable model.",
        })
      }
    >
      Seed test draft
    </button>
  );
}

test("React country, citizen, planning, storage and analyst workflows", async () => {
  const dom = new JSDOM("<!doctype html><div id='root'></div>", { url: "http://localhost:4173" });
  const previous = new Map();
  for (const [key, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    localStorage: dom.window.localStorage,
    Event: dom.window.Event,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const originalFetch = globalThis.fetch;
  const service = createAIService({ apiKey: "" });
  globalThis.fetch = async (url, options) =>
    new Response(
      JSON.stringify(
        url === "/api/ai/status"
          ? service.status()
          : await service.analyze(JSON.parse(options.body)),
      ),
    );
  const { createRoot } = await import("react-dom/client");
  const element = document.getElementById("root"),
    root = createRoot(element);
  const visited = [];
  const router = { push: (path) => visited.push(path), prefetch: () => Promise.resolve() };
  async function show(component) {
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={router}>
          <WorkspaceProvider>{component}</WorkspaceProvider>
        </AppRouterContext.Provider>,
      );
    });
  }
  const button = (text) =>
    [...element.querySelectorAll("button")].find((item) => item.textContent === text);
  try {
    await show(<CountryOverview />);
    assert.equal(element.querySelectorAll("polygon").length, 37);
    await act(async () =>
      element
        .querySelector("polygon")
        .dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })),
    );
    assert(element.textContent.includes("State economic accounts"));
    assert(!element.textContent.includes("undefined%"));
    await show(<CitizenRegister />);
    assert(element.textContent.includes("AD-C-00000001"));
    await act(async () => button("Next").click());
    assert(element.textContent.includes("AD-C-00000021"));
    await show(
      <>
        <SeedDraft />
        <Planner />
      </>,
    );
    await act(async () => button("Seed test draft").click());
    await act(async () => button("Save proposed decision").click());
    const saved = JSON.parse(localStorage.getItem("nationos-plans"));
    assert.equal(saved[0].title, "React integration plan");
    assert.equal(saved[0].result.years.length, 6);
    await show(<DecisionMemory />);
    assert(element.textContent.includes("React integration plan"));
    await act(async () => button("Mark reviewed").click());
    assert.equal(JSON.parse(localStorage.getItem("nationos-plans"))[0].reviewed, true);
    const before = localStorage.getItem("nationos-plans");
    await show(<AnalystWorkspace />);
    await act(async () => button("Review risks & stress-test plan").click());
    assert(element.textContent.includes("Conditional stress scenarios"));
    assert(element.textContent.includes("Suggested monitoring plan"));
    assert.equal(localStorage.getItem("nationos-plans"), before);
    await act(async () => button("Draft an investment").click());
    await act(async () =>
      element
        .querySelector("form")
        .dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })),
    );
    assert(element.textContent.includes("Review & edit in recommendations"));
    await act(async () => button("Review & edit in recommendations").click());
    assert.equal(visited.at(-1), "/recommendations");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    globalThis.fetch = originalFetch;
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
