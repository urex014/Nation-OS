import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:4174";
const chrome = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const seats = [
  ["government", "government@nationos.demo", "Government-Demo-2026!"],
  ["citizen", "citizen@nationos.demo", "Citizen-Demo-2026!"],
];
const overview = "A clearer picture of Nigeria";

async function signIn(page, email, password) {
  await page.goto(`${base}/sign-in`, { waitUntil: "networkidle" });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(/\/overview(?:\?|$)/, { timeout: 15000 });
  await page.getByRole("heading", { name: overview, level: 1 }).waitFor({ timeout: 10000 });
}

function overlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

async function assertNoDesk(page) {
  const labels = await page.locator("a, button").allInnerTexts();
  const hit = labels.find((text) => /your desk|my desk|ask the advisor/i.test(text));
  if (hit) throw new Error(`Still links to the removed desk: ${hit}`);
}

async function assertNation(page, role, { mobile }) {
  const button = page.getByRole("button", { name: "Ask Nation AI" });
  await button.waitFor({ state: "visible" });
  if ((await button.getAttribute("aria-expanded")) !== "false") {
    throw new Error("Nation AI button should start closed");
  }
  const box = await button.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error("Missing button box");
  const rightGap = viewport.width - (box.x + box.width);
  const bottomGap = viewport.height - (box.y + box.height);
  if (rightGap < 12 || rightGap > 48) throw new Error(`Button right gap ${rightGap}px`);
  if (bottomGap < 12 || bottomGap > 80) throw new Error(`Button bottom gap ${bottomGap}px`);
  if (mobile) {
    const menu = await page.getByRole("button", { name: "Open menu" }).boundingBox();
    if (!menu) throw new Error("Mobile menu button missing");
    if (overlap(box, menu)) throw new Error("Nation AI covers the mobile menu");
  }
  const stored = await page.evaluate(() =>
    Object.keys(localStorage).some((key) => /nation|advisor/i.test(key)),
  );
  if (stored) throw new Error("Nation AI wrote to localStorage");
  await button.click();
  const panel = page.locator("#nation-ai-panel");
  await panel.getByRole("heading", { name: "Nation AI" }).waitFor();
  if ((await button.getAttribute("aria-expanded")) !== "true") {
    throw new Error("aria-expanded stayed false");
  }
  await panel.getByRole("button", { name: "Lagos 2025" }).waitFor();
  const tax = await panel.getByRole("button", { name: "Tax −10%" }).count();
  if (role === "government" && tax !== 1) throw new Error("Government is missing the tax chip");
  if (role === "citizen" && tax !== 0) throw new Error("Citizen can see the tax chip");
  const live = await panel.locator("[aria-live='polite']").count();
  if (!live) throw new Error("Missing aria-live log");
  if (mobile) {
    const dialog = await panel.getAttribute("role");
    if (dialog !== "dialog") throw new Error(`Mobile panel role is ${dialog}`);
    const width = await panel.evaluate((node) => node.getBoundingClientRect().width);
    if (width < viewport.width - 2) throw new Error(`Mobile sheet is ${width}px`);
  } else {
    const width = await panel.evaluate((node) => Math.round(node.getBoundingClientRect().width));
    if (width < 380 || width > 420) throw new Error(`Desktop panel is ${width}px`);
    const main = await page.locator("main").boundingBox();
    const panelBox = await panel.boundingBox();
    if (!main || !panelBox || main.x + main.width > panelBox.x + 1) {
      throw new Error("Desktop panel covers the page instead of sitting beside it");
    }
  }
  await page.keyboard.press("Escape");
  await panel.waitFor({ state: "hidden" });
  await button.click();
  await panel.waitFor({ state: "visible" });
  await button.click();
  await panel.waitFor({ state: "hidden" });
}

const browser = await chromium.launch({ executablePath: chrome, headless: true });
const failures = [];
try {
  for (const [role, email, password] of seats) {
    for (const mobile of [false, true]) {
      const context = await browser.newContext(
        mobile
          ? {
              viewport: { width: 390, height: 844 },
              isMobile: true,
              hasTouch: true,
              deviceScaleFactor: 1,
            }
          : { viewport: { width: 1280, height: 800 } },
      );
      const page = await context.newPage();
      const label = `${role} ${mobile ? "mobile" : "desktop"}`;
      try {
        await signIn(page, email, password);
        await assertNoDesk(page);
        console.log(`ok ${label} overview after sign-in`);
        await assertNation(page, role, { mobile });
        console.log(`ok ${label} Nation AI`);
        if (!mobile) {
          await page.goto(`${base}/dashboard/${role}`, { waitUntil: "networkidle" });
          await page.waitForURL(/\/overview(?:\?|$)/);
          await page.getByRole("heading", { name: overview, level: 1 }).waitFor();
          await page
            .locator('nav[aria-label="Main navigation"] a')
            .filter({ hasText: "Money in" })
            .first()
            .click();
          await page.getByRole("heading", { name: "What the states collected", level: 1 }).waitFor({
            timeout: 10000,
          });
          await page
            .locator('nav[aria-label="Main navigation"] a')
            .filter({ hasText: "The country" })
            .first()
            .click();
          await page.getByRole("heading", { name: overview, level: 1 }).waitFor({ timeout: 10000 });
          console.log(`ok ${label} old desk redirects and the menu returns`);
          if (role === "government") {
            await page
              .locator('nav[aria-label="Main navigation"] a')
              .filter({ hasText: "Plan a budget" })
              .first()
              .click();
            await page.locator("#tax-change").waitFor({ timeout: 10000 });
            console.log("ok government tax slider on Plan a budget");
          }
        }
      } catch (error) {
        failures.push(`${label}: ${error instanceof Error ? error.message.split("\n")[0] : error}`);
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Overview is the landing, the desk is gone, and Nation AI opens without a reload.");
