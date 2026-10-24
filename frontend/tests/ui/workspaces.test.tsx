import "./dom";
import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { Planner } from "../../components/nigeria/planner";
import { Stat } from "../../components/nigeria/ui";
import { NavList } from "../../components/workspace/shell";

async function render(node: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(node);
  });
  return {
    container,
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

test("navigation lists the six workspaces", async () => {
  const view = await render(createElement(NavList, { pathname: "/revenue" }));
  const links = [...view.container.querySelectorAll("nav a")].map((link) =>
    (link.textContent ?? "").replace(/\s+/g, " ").trim(),
  );
  assert.equal(links.length, 6);
  assert.match(links[0] ?? "", /National Overview/);
  assert.match(links[1] ?? "", /Budget & Revenue/);
  assert.match(links[2] ?? "", /Project Intelligence/);
  assert.match(links[3] ?? "", /Scenario Lab/);
  assert.match(links[4] ?? "", /Decision & Audit Records/);
  assert.match(links[5] ?? "", /Data Sources/);
  assert.equal(
    view.container.querySelector("[aria-current='page']")?.getAttribute("href"),
    "/revenue",
  );
  view.unmount();
});

test("a fiscal card shows a cited figure", async () => {
  const view = await render(
    createElement(Stat, {
      label: "Approved spend",
      value: "₦68.3tn",
      note: "Third reading, 31 Mar 2026",
    }),
  );
  assert.match(view.container.textContent ?? "", /₦68\.3tn/);
  assert.match(view.container.textContent ?? "", /Approved spend/);
  view.unmount();
});

test("the planner exposes the question, envelope, and strategy", async () => {
  const view = await render(createElement(Planner));
  assert.ok(view.container.querySelector("textarea"));
  assert.ok(view.container.querySelector("input"));
  assert.match(view.container.textContent ?? "", /Needs/);
  assert.match(view.container.textContent ?? "", /Run investigation/);
  view.unmount();
});
