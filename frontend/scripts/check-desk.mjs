import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:4174";
const chrome = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const seats = [
  ["government", "government@nationos.demo", "Government-Demo-2026!", "Help with decisions"],
  ["citizen", "citizen@nationos.demo", "Citizen-Demo-2026!", "Your public desk"],
];

async function signIn(page, email, password) {
  await page.goto(`${base}/sign-in`, { waitUntil: "networkidle" });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
}

async function openDesk(page, heading) {
  const desk = page.getByRole("heading", { name: heading, level: 1 });
  if (await desk.isVisible().catch(() => false)) return;
  const link = page
    .locator('nav[aria-label="Main navigation"] a')
    .filter({ hasText: "Your desk" })
    .first();
  await link.click();
  await desk.waitFor({ state: "visible", timeout: 10000 });
}

const browser = await chromium.launch({ executablePath: chrome, headless: true });
const failures = [];
try {
  for (const [role, email, password, heading] of seats) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    try {
      await signIn(page, email, password);
      await openDesk(page, heading);
      console.log(`ok ${role} desk after sign-in`);
      await page
        .locator('nav[aria-label="Main navigation"] a')
        .filter({ hasText: "Money in" })
        .first()
        .click();
      await page.getByRole("heading", { name: "What the states collected", level: 1 }).waitFor({
        state: "visible",
        timeout: 10000,
      });
      await page
        .locator('nav[aria-label="Main navigation"] a')
        .filter({ hasText: "Your desk" })
        .first()
        .click();
      await page.getByRole("heading", { name: heading, level: 1 }).waitFor({
        state: "visible",
        timeout: 10000,
      });
      console.log(`ok ${role} desk from another section`);
    } catch (error) {
      failures.push(`${role}: ${error instanceof Error ? error.message.split("\n")[0] : error}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Desk is visible after sign-in and from the sidebar, without a reload.");
