import assert from "node:assert/strict";
const base = process.env.NATIONOS_TEST_URL || "http://localhost:4173";
const routes = [
  "/",
  "/states",
  "/citizens",
  "/businesses",
  "/comparisons",
  "/evidence",
  "/data",
  "/households",
  "/sectors",
  "/sectors/food",
  "/recommendations",
  "/decisions",
  "/analyst",
];
for (const path of routes) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert(html.includes("main-content"), path);
  assert(!html.includes("undefined%"), path);
  if (path === "/") {
    assert.equal((html.match(/<polygon/g) || []).length, 37);
    const css = [...html.matchAll(/href="([^\"]+\.css[^\"]*)"/g)];
    assert(css.length);
    const stylesheet = await fetch(new URL(css[0][1].replaceAll("&amp;", "&"), base));
    assert.equal(stylesheet.status, 200);
    assert((await stylesheet.text()).includes("tailwindcss"));
  }
}
const status = await fetch(base + "/api/ai/status");
assert.equal((await status.json()).automatedAnalysis, true);
const analyze = (body, origin) =>
  fetch(base + "/api/ai/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) },
    body: JSON.stringify(body),
  });
const local = await analyze({
  question: "Draft a 10-year education plan with 120 million per year",
  mode: "local",
});
assert.equal(local.status, 200);
const report = await local.json();
assert.equal(report.modelResult.totalCost, 1200);
const review = await analyze({ question: "Review", mode: "review", proposal: report.proposal });
assert.equal((await review.json()).review.cases.length, 4);
assert.equal((await analyze({}, "https://unrelated.example")).status, 403);
assert.equal((await fetch(base + "/missing")).status, 404);
assert.equal((await fetch(base + "/.env")).status, 404);
console.log(
  "Passed: 13 React pages, 37 SVG regions, compiled Tailwind, local analyst, review API and protected paths.",
);
