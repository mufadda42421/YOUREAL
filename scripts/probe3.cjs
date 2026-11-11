const { chromium } = require("playwright-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3109";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("console", (m) => { const t = m.text(); console.log("[browser]", m.type(), t.slice(0, 300)); });
  page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));

  const ts = Date.now().toString(36);
  const email = `you-probe3-${ts}@example.com`;

  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.getByRole("button", { name: /Get Started/i }).first().click();
  await page.getByLabel("Full name").fill("Probe Three");
  await page.getByLabel("Email").fill(email);
  await page.locator("#auth-password").fill("SmokePass1234");
  await page.locator("#auth-confirm").fill("SmokePass1234");
  await page.getByRole("button", { name: /Create my world/i }).click();
  await page.waitForURL("**/onboarding", { timeout: 30000 });
  await page.locator("#onb-pref").fill("Probe3");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: /Continue/i }).click();
  await page.getByRole("button", { name: /Enter YOU/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 30000 });

  // create a world + a note
  await page.locator("aside nav a", { hasText: "My Worlds" }).click();
  await page.waitForTimeout(2000);
  console.log("url after nav:", page.url());
  console.log("worlds body:", (await page.textContent("body"))?.replace(/\s+/g, " ").slice(0, 220));
  console.log("buttons:", (await page.getByRole("button").allTextContents()).slice(0, 12));
  await page.getByRole("button", { name: /Create world/i }).first().click();
  await page.locator("#world-name").fill("Wave-World");
  await page.getByRole("dialog", { name: /Create a new world/i }).getByRole("button", { name: "Create world" }).click();
  await page.waitForURL("**/worlds/**", { timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: /Add widget/i }).click();
  await page.getByRole("button", { name: /Notes/i }).first().click();
  await page.waitForTimeout(1200);
  await page.locator('input[aria-label="New note"]').fill("delete me");
  await page.locator('input[aria-label="New note"]').press("Enter");
  await page.waitForTimeout(1500);
  console.log("note added");

  await page.locator("aside nav a", { hasText: "Settings" }).click();
  await page.waitForTimeout(1500);
  await page.getByRole("tab", { name: /Account/i }).click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill("SmokePass1234");
  await page.getByPlaceholder("DELETE").fill("DELETE");
  await page.getByRole("button", { name: /Delete my account forever/i }).click();
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(2000);
    const url = page.url();
    const toasts = await page.locator('[role="status"]').allTextContents();
    const alerts = await page.locator('[role="alert"]').allTextContents();
    console.log(`t=${(i + 1) * 2}s url=${url} toasts=${JSON.stringify(toasts)} alerts=${JSON.stringify(alerts)}`);
    if (!/settings/.test(url)) break;
  }
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
