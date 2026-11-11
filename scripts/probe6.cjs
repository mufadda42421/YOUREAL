const { chromium } = require("playwright-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3109";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const ts = Date.now().toString(36);
  const email = `you-probe6-${ts}@example.com`;

  page.on("console", (m) => console.log("[console]", m.type(), m.text().slice(0, 200)));
  page.on("requestfailed", (r) => console.log("[reqfail]", r.failure()?.errorText, r.url().slice(0, 140)));
  page.on("response", (r) => { if (r.status() >= 400) console.log("[http]", r.status(), r.url().slice(0, 140)); });

  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.getByRole("button", { name: /Get Started/i }).first().click();
  await page.getByLabel("Full name").fill("Probe Six");
  await page.getByLabel("Email").fill(email);
  await page.locator("#auth-password").fill("SmokePass1234");
  await page.locator("#auth-confirm").fill("SmokePass1234");
  await page.getByRole("button", { name: /Create my world/i }).click();
  await page.waitForURL("**/onboarding", { timeout: 30000 });
  await page.locator("#onb-pref").fill("Probe6");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: /Continue/i }).click();
  await page.getByRole("button", { name: /Enter YOU/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  console.log("ready", page.url());

  console.log("— first click My Worlds");
  await page.locator("aside nav a", { hasText: "My Worlds" }).click();
  console.log("url immediately:", page.url());
  await page.waitForTimeout(2000);
  console.log("url after 2s:", page.url());

  console.log("— second click My Worlds");
  await page.locator("aside nav a", { hasText: "My Worlds" }).click();
  console.log("url immediately:", page.url());
  await page.waitForTimeout(2000);
  console.log("url after 2s:", page.url());

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
