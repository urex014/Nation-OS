import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:4173";

async function signIn(email, password) {
  const response = await fetch(base + "/api/auth/sign-in", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200, email);
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  return cookie;
}

const home = await fetch(base + "/", { redirect: "manual" });
assert.equal(home.status, 200);
assert.match(await home.text(), /See where public money goes/);
const signInPage = await fetch(base + "/sign-in", { redirect: "manual" });
assert.equal(signInPage.status, 200);
assert.match(await signInPage.text(), /Sign in/);

const locked = await fetch(base + "/overview", { redirect: "manual" });
assert.equal(locked.status, 307);
assert.match(locked.headers.get("location") ?? "", /\/sign-in/);
assert.equal((await fetch(base + "/api/overview", { redirect: "manual" })).status, 401);

const government = await signIn("government@nationos.demo", "Government-Demo-2026!");
for (const route of ["/overview", "/revenue", "/budget", "/scenarios", "/decisions", "/sources"]) {
  const response = await fetch(base + route, {
    headers: { cookie: government },
    redirect: "manual",
  });
  assert.equal(response.status, 200, route);
  const html = await response.text();
  assert.match(html, /Nation/);
  assert.equal(html.includes("Aderin"), false);
}
const overview = await (
  await fetch(base + "/api/overview", { headers: { cookie: government } })
).json();
assert.equal(overview.map.length, 37);
assert.equal(
  (await fetch(base + "/api/revenue?year=2050", { headers: { cookie: government } })).status,
  400,
);
assert.equal(
  (await fetch(base + "/api/decisions/missing", { headers: { cookie: government } })).status,
  404,
);
assert.equal((await fetch(base + "/account", { headers: { cookie: government } })).status, 404);
const fiscal = await fetch(base + "/api/v1/fiscal/overview", { headers: { cookie: government } });
assert.equal(fiscal.status, 200);
assert.equal((await fiscal.json()).currency, "NGN");

const citizen = await signIn("citizen@nationos.demo", "Citizen-Demo-2026!");
const ownDesk = await fetch(base + "/dashboard/citizen", {
  headers: { cookie: citizen },
  redirect: "manual",
});
assert.equal(ownDesk.status, 200);
assert.match(await ownDesk.text(), /Transparency desk/);
const otherDesk = await fetch(base + "/dashboard/government", {
  headers: { cookie: citizen },
  redirect: "manual",
});
assert.equal(otherDesk.status, 307);
assert.match(otherDesk.headers.get("location") ?? "", /\/forbidden$/);
const governmentDesk = await fetch(base + "/dashboard/government", {
  headers: { cookie: government },
  redirect: "manual",
});
assert.equal(governmentDesk.status, 200);
assert.match(await governmentDesk.text(), /Decision support/);
const citizenTool = await fetch(base + "/budget", {
  headers: { cookie: citizen },
  redirect: "manual",
});
assert.equal(citizenTool.status, 307);

const chat = await fetch(base + "/api/chat", {
  method: "POST",
  headers: { "content-type": "application/json", cookie: government },
  body: JSON.stringify({ message: "Compare Lagos and Rivers revenue" }),
});
assert.equal(chat.status, 200);
assert.equal((await chat.json()).table.rows.length, 2);
console.log("Public pages, role desks, workspace APIs, and the main fiscal contract verified.");
