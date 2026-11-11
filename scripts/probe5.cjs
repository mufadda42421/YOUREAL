const { chromium } = require("playwright-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3109";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const ts = Date.now().toString(36);
  const email = `you-probe5-${ts}@example.com`;

  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.getByRole("button", { name: /Get Started/i }).first().click();
  await page.getByLabel("Full name").fill("Probe Five");
  await page.getByLabel("Email").fill(email);
  await page.locator("#auth-password").fill("SmokePass1234");
  await page.locator("#auth-confirm").fill("SmokePass1234");
  await page.getByRole("button", { name: /Create my world/i }).click();
  await page.waitForURL("**/onboarding", { timeout: 30000 });
  await page.locator("#onb-pref").fill("Probe5");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: /Continue/i }).click();
  await page.getByRole("button", { name: /Enter YOU/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 30000 });

  const html = await page.locator('aside nav a', { hasText: 'My Worlds' }).first().evaluate((el) => el.outerHTML);
  console.log("anchor at dashboard ready:", html);

  // Immediately click My Worlds at t≈0 of dashboard
  const url0 = page.url();
  await page.locator('aside nav a', { hasText: 'My Worlds' }).first().click({ timeout: 5000 }).catch((e) => console.log("click err:", e.message.split("\n")[0]));
  console.log("url right after first click:", page.url(), "(was", url0 + ")");

  await page.waitForTimeout(3000);
  console.log("url 3s later:", page.url());
  const html2 = await page.locator('aside nav a', { hasText: 'My Worlds' }).first().evaluate((el) => el.outerHTML).catch(() => "n/a");
  console.log("anchor later:", html2);

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
