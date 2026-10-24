import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const directory = mkdtempSync(path.join(tmpdir(), "nationos-auth-"));
process.env.NATIONOS_AUTH_DB_PATH = path.join(directory, "auth.sqlite");
process.env.NATIONOS_BCRYPT_COST = "4";
process.env.NATIONOS_SESSION_SECRET = "test-only-nationos-session-secret-32chars";
process.env.NODE_ENV = "development";

const { POST: signIn } = await import("../app/api/auth/sign-in/route");
const { POST: signUp } = await import("../app/api/auth/sign-up/route");
const { GET: session } = await import("../app/api/auth/session/route");
const { proxy } = await import("../proxy");
const { userFromToken } = await import("../lib/auth/service");
const { NextRequest } = await import("next/server");

const post = (url, body, cookie) =>
  new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });

function cookiePair(response) {
  const raw = response.headers.get("set-cookie") ?? "";
  return raw.split(";")[0];
}

test("each demonstration role receives only its own desk", async () => {
  const cases = [
    ["government@nationos.demo", "Government-Demo-2026!", "/dashboard/government"],
    ["citizen@nationos.demo", "Citizen-Demo-2026!", "/dashboard/citizen"],
  ];
  for (const [email, password, dashboardPath] of cases) {
    const response = await signIn(
      post("http://127.0.0.1:4173/api/auth/sign-in", { email, password }),
    );
    assert.equal(response.status, 200, email);
    const body = await response.json();
    assert.equal(body.dashboardPath, dashboardPath);
    assert.equal(body.user.email, email);
    assert.match(response.headers.get("set-cookie") ?? "", /HttpOnly/i);
    assert.doesNotMatch(JSON.stringify(body), /password/i);
    const token = decodeURIComponent(cookiePair(response).split("=").slice(1).join("="));
    const claims = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
    assert.equal(claims.userId, body.user.id);
    assert.equal(claims.role, body.user.role);
    assert.equal(claims.name, body.user.name);
    assert.equal(claims.agency, body.user.agency);
    assert.equal(claims.exp - claims.iat, 60 * 60 * 12);
    assert.equal(claims.sid, undefined);
    const current = await session(
      new Request("http://127.0.0.1:4173/api/auth/session", {
        headers: { cookie: cookiePair(response) },
      }),
    );
    assert.equal((await current.json()).user.role, body.user.role);
    assert.equal(existsSync(process.env.NATIONOS_AUTH_DB_PATH), false);
  }
});

test("a fresh process accepts the cookie without an account file", async () => {
  const response = await signIn(
    post("http://127.0.0.1:4173/api/auth/sign-in", {
      email: "government@nationos.demo",
      password: "Government-Demo-2026!",
    }),
  );
  const token = decodeURIComponent(cookiePair(response).split("=").slice(1).join("="));
  const run = spawnSync(
    process.execPath,
    [
      "node_modules/tsx/dist/cli.mjs",
      "-e",
      `import { userFromToken } from "./lib/auth/token.ts";
       const user = userFromToken(process.env.TOKEN);
       if (!user || user.role !== "government") process.exit(1);
       if (user.name !== "Government official") process.exit(2);
       if (user.agency !== "Lagos State budget and finance (demonstration)") process.exit(3);`,
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        TOKEN: token,
        NATIONOS_AUTH_STORE: "memory",
        NATIONOS_AUTH_DB_PATH: "/tmp/nationos-missing-auth/nope.sqlite",
      },
    },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});

test("unknown people and wrong passwords share one error", async () => {
  const missing = await signIn(
    post("http://127.0.0.1:4173/api/auth/sign-in", {
      email: "nobody@nationos.demo",
      password: "Auditor-Demo-2026!",
    }),
  );
  const wrong = await signIn(
    post("http://127.0.0.1:4173/api/auth/sign-in", {
      email: "citizen@nationos.demo",
      password: "not-the-password",
    }),
  );
  assert.equal(missing.status, 401);
  assert.equal(wrong.status, 401);
  assert.equal((await missing.json()).error, (await wrong.json()).error);
});

test("on Vercel a new citizen is carried by the cookie, not by a database file", async () => {
  const previous = process.env.VERCEL;
  process.env.VERCEL = "1";
  try {
    const created = await signUp(
      post("http://127.0.0.1:4173/api/auth/sign-up", {
        name: "New Citizen",
        agency: "Lagos",
        email: "vercel.citizen@nationos.demo",
        password: "Citizen-Demo-2026!",
      }),
    );
    const { accountStore } = await import("../lib/auth/accounts.ts");
    const { memoryAccounts } = await import("../lib/auth/memory-accounts.ts");
    assert.equal(accountStore(), memoryAccounts);
    assert.equal(created.status, 201);
    const current = await session(
      new Request("http://127.0.0.1:4173/api/auth/session", {
        headers: { cookie: cookiePair(created) },
      }),
    );
    assert.equal((await current.json()).user.role, "citizen");
  } finally {
    if (previous === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previous;
  }
});

test("sign-up cannot choose a privileged role", async () => {
  const rejected = await signUp(
    post("http://127.0.0.1:4173/api/auth/sign-up", {
      name: "New Officer",
      agency: "A demonstration agency",
      email: "new.officer@nationos.demo",
      password: "Auditor-Demo-2026!",
      role: "government",
    }),
  );
  assert.equal(rejected.status, 403);
  const created = await signUp(
    post("http://127.0.0.1:4173/api/auth/sign-up", {
      name: "New Officer",
      agency: "A demonstration agency",
      email: "new.officer@nationos.demo",
      password: "Auditor-Demo-2026!",
    }),
  );
  assert.equal(created.status, 201);
  const createdBody = await created.json();
  assert.equal(createdBody.user.role, "citizen");
  assert.equal(createdBody.dashboardPath, "/dashboard/citizen");
  const duplicate = await signUp(
    post("http://127.0.0.1:4173/api/auth/sign-up", {
      name: "New Officer",
      agency: "A demonstration agency",
      email: "new.officer@nationos.demo",
      password: "Auditor-Demo-2026!",
    }),
  );
  assert.equal(duplicate.status, 409);
});

test("proxy rejects anonymous officers and the wrong role", async () => {
  const anon = await proxy(new NextRequest("http://127.0.0.1:4173/dashboard/government"));
  assert.equal(anon.status, 307);
  assert.match(anon.headers.get("location") ?? "", /\/sign-in\?next=/);
  const api = await proxy(new NextRequest("http://127.0.0.1:4173/api/v1/fiscal/overview"));
  assert.equal(api.status, 401);
  const signedIn = await signIn(
    post("http://127.0.0.1:4173/api/auth/sign-in", {
      email: "citizen@nationos.demo",
      password: "Citizen-Demo-2026!",
    }),
  );
  const cookie = cookiePair(signedIn);
  const denied = await proxy(
    new NextRequest("http://127.0.0.1:4173/dashboard/government", { headers: { cookie } }),
  );
  assert.equal(denied.status, 307);
  assert.match(denied.headers.get("location") ?? "", /\/forbidden$/);
  const deniedTool = await proxy(
    new NextRequest("http://127.0.0.1:4173/budget", { headers: { cookie } }),
  );
  assert.equal(deniedTool.status, 307);
  const deniedWrite = await proxy(
    new NextRequest("http://127.0.0.1:4173/api/plans", { method: "POST", headers: { cookie } }),
  );
  assert.equal(deniedWrite.status, 403);
  const allowed = await proxy(
    new NextRequest("http://127.0.0.1:4173/dashboard/citizen", { headers: { cookie } }),
  );
  assert.equal(allowed.headers.get("x-middleware-next"), "1");
  const government = await signIn(
    post("http://127.0.0.1:4173/api/auth/sign-in", {
      email: "government@nationos.demo",
      password: "Government-Demo-2026!",
      next: "/budget",
    }),
  );
  assert.equal((await government.json()).dashboardPath, "/budget");
  const governmentCookie = cookiePair(government);
  const ownTool = await proxy(
    new NextRequest("http://127.0.0.1:4173/budget", { headers: { cookie: governmentCookie } }),
  );
  assert.equal(ownTool.headers.get("x-middleware-next"), "1");
  const tampered = cookie.replace(/=([^.]+)/, "=tampered");
  assert.equal(userFromToken(tampered.split("=")[1]), null);
});

test("validation rejects a short sign-up password", async () => {
  const response = await signUp(
    post("http://127.0.0.1:4173/api/auth/sign-up", {
      name: "A",
      agency: "X",
      email: "not-an-email",
      password: "short",
    }),
  );
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.fieldErrors.password, "Use at least 12 characters.");
  assert.equal(body.fieldErrors.email, "Enter a valid email address.");
});

test.after(() => {
  rmSync(directory, { recursive: true, force: true });
});
