const { chromium } = require("playwright-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3106";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));

  await page.goto(BASE + "/dashboard", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  const body = (await page.textContent("body"))?.replace(/\s+/g, " ").slice(0, 300) ?? "";
  console.log("body:", body);
  console.log("console errors:", consoleErrors.length ? consoleErrors : "none");
  await page.screenshot({ path: "C:\\Users\\Husain\\AppData\\Local\\Temp\\opencode\\shot-dashboard.png" });
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error("FAILED:", e); process.exit(1); });

