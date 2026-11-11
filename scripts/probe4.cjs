const { chromium } = require("playwright-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3109";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const ts = Date.now().toString(36);
  const email = `you-probe4-${ts}@example.com`;

  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.getByRole("button", { name: /Get Started/i }).first().click();
  await page.getByLabel("Full name").fill("Probe Four");
  await page.getByLabel("Email").fill(email);
  await page.locator("#auth-password").fill("SmokePass1234");
  await page.locator("#auth-confirm").fill("SmokePass1234");
  await page.getByRole("button", { name: /Create my world/i }).click();
  await page.waitForURL("**/onboarding", { timeout: 30000 });
  await page.locator("#onb-pref").fill("Probe4");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: /Continue/i }).click();
  await page.getByRole("button", { name: /Enter YOU/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  console.log("ready:", page.url());

  const targets = ["My Worlds", "My Media", "My Profile", "Settings", "My Home", "My Worlds", "My Media", "My Profile", "Settings", "My Home"];
  for (const label of targets) {
    await page.locator("aside nav a", { hasText: label }).click();
    await page.waitForTimeout(1200);
    const url = page.url();
    const expected = label === "My Home" ? "/dashboard" : label === "My Worlds" ? "/worlds" : label === "My Media" ? "/media" : label === "My Profile" ? "/profile" : "/settings";
    console.log(`${label.padEnd(10)} → ${url} ${url.includes(expected) ? "OK" : "MISS"}`);
  }
  await page.screenshot({ path: "C:\\Users\\Husain\\AppData\\Local\\Temp\\opencode\\e2e-navprobe.png" });
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
