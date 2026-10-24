import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:4174";
const chrome = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const routes = [
  "/",
  "/sign-in",
  "/forbidden",
  "/dashboard/government",
  "/dashboard/citizen",
  "/overview",
  "/revenue",
  "/budget",
  "/scenarios",
  "/decisions",
  "/sources",
  "/missing-page",
];
const seats = [
  ["government", "government@nationos.demo", "Government-Demo-2026!"],
  ["citizen", "citizen@nationos.demo", "Citizen-Demo-2026!"],
];

async function sessionCookie(email, password) {
  const response = await fetch(`${base}/api/auth/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: base },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`Sign-in failed for ${email}: ${response.status}`);
  const raw = response.headers.get("set-cookie") || "";
  const pair = raw.split(";")[0];
  const name = pair.slice(0, pair.indexOf("="));
  const value = decodeURIComponent(pair.slice(name.length + 1));
  return { name, value, url: base, httpOnly: true };
}

async function overflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

const browser = await chromium.launch({ executablePath: chrome, headless: true });
const failures = [];
try {
  for (const [role, email, password] of seats) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await context.addCookies([await sessionCookie(email, password)]);
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(base + route, { waitUntil: "networkidle" });
      if (route === "/budget")
        await page
          .locator("summary")
          .first()
          .click()
          .catch(() => {});
      if (route === "/decisions") {
        const row = page.locator("main button").first();
        if (await row.count()) await row.click().catch(() => {});
      }
      if (route === "/sign-in") {
        const create = page.getByRole("button", { name: "Create account" });
        if (await create.count()) await create.click().catch(() => {});
      }
      const extra = await overflow(page);
      const landed = new URL(page.url()).pathname;
      if (extra > 0) failures.push(`${role} ${route} (${landed}) is ${extra}px too wide`);
      else console.log(`ok ${role} ${route} -> ${landed}`);
    }
    await context.close();
  }
  const guest = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const guestPage = await guest.newPage();
  for (const route of ["/", "/sign-in"]) {
    await guestPage.goto(base + route, { waitUntil: "networkidle" });
    if (route === "/sign-in") {
      await guestPage.getByRole("button", { name: "Create account" }).click();
    }
    const extra = await overflow(guestPage);
    if (extra > 0) failures.push(`guest ${route} is ${extra}px too wide`);
    else console.log(`ok guest ${route}${route === "/sign-in" ? " sign-up" : ""}`);
  }
  await guest.close();
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Every route fits a 390px screen for both seats.");
