/**
 * React Component Integration Tests
 * Exercises the five primary fiscal intelligence workflows in JSDOM.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import { WorkspaceProvider } from "../components/workspace/provider";
import { FiscalOverview } from "../components/overview/fiscal-overview";
import { RevenueWorkspace } from "../components/revenue/revenue-workspace";
import { BudgetPlanner } from "../components/budget/budget-planner";
import { ScenarioLab } from "../components/scenarios/scenario-lab";
import { DecisionMemory } from "../components/decisions/decision-memory";
import { createAIService } from "../lib/ai-service.mjs";

test("React fiscal overview, revenue allocation, budget planning, scenarios, and decisions", async () => {
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
          : await service.analyze(JSON.parse(options?.body || "{}")),
      ),
    );

  const { createRoot } = await import("react-dom/client");
  const element = document.getElementById("root");
  const root = createRoot(element);
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
    [...element.querySelectorAll("button")].find((item) => item.textContent?.trim() === text);

  try {
    // 1. Overview Page with 37 Map Polygons
    await show(<FiscalOverview />);
    assert.equal(element.querySelectorAll("polygon").length, 37);
    assert(element.textContent.includes("National Fiscal Intelligence Dashboard"));
    assert(!element.textContent.includes("undefined%"));

    // 2. Revenue Allocation Workspace
    await show(<RevenueWorkspace />);
    assert(element.textContent.includes("Revenue Allocation & Distribution Matrix"));
    assert(element.textContent.includes("Distributable Federation Pool"));

    // 3. Flagship Budget Planner
    await show(<BudgetPlanner />);
    assert(element.textContent.includes("AI-Assisted Budget Planning Workspace"));
    await act(async () => {
      const runBtn = button("Run AI Investigation");
      if (runBtn) runBtn.click();
    });
    assert(element.textContent.includes("Structured Investigation Sequence"));

    // 4. Scenario Simulation Lab
    await show(<ScenarioLab />);
    assert(element.textContent.includes("Scenario Simulation & Stress Lab"));

    // 5. Decision Records & Context Preservation
    // Seed test plan in localStorage
    localStorage.setItem(
      "nationos-plans",
      JSON.stringify([
        {
          id: "REC-TEST-1",
          title: "React integration plan",
          reason: "Investigate school access barriers using a reviewable model.",
          reviewed: false,
          result: {
            dataset: "aderin-economy-v1",
            annualCost: 980,
            config: {
              years: 5,
              delivery: 80,
              maintenance: 20,
              budgets: {
                education: 180,
                health: 180,
                transport: 180,
                food: 160,
                energy: 140,
                water: 140,
              },
            },
          },
        },
      ]),
    );

    await show(<DecisionMemory />);
    assert(element.textContent.includes("React integration plan"));
    await act(async () => button("Mark reviewed").click());
    const saved = JSON.parse(localStorage.getItem("nationos-plans"));
    assert.equal(saved[0].reviewed, true);
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
