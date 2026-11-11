// Headless smoke test against the dev server — renders pages with real Chrome.
const { chromium } = require("playwright-core");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3105";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push("PAGEERROR: " + err.message));

  for (const path of ["/", "/dashboard", "/worlds", "/media", "/profile", "/settings", "/onboarding"]) {
    consoleErrors.length = 0;
    await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(800);
    const text = (await page.textContent("body"))?.replace(/\s+/g, " ").slice(0, 180) ?? "";
    console.log(`\n=== ${path} ===`);
    console.log("body:", text);
    console.log("console errors:", consoleErrors.length ? consoleErrors.slice(0, 6) : "none");
  }

  // Interaction test: open auth modal from homepage
  consoleErrors.length = 0;
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 45000 });
  const getStarted = page.getByRole("button", { name: /Get Started/i }).first();
  await getStarted.click();
  await page.waitForTimeout(600);
  const dialogVisible = await page.getByRole("dialog").isVisible().catch(() => false);
  console.log("\n=== auth modal opens ===", dialogVisible ? "PASS" : "FAIL");
  console.log("console errors:", consoleErrors.length ? consoleErrors : "none");

  await browser.close();
  process.exit(0);
})().catch((e) => {
  console.error("SMOKE FAILED:", e);
  process.exit(1);
});
