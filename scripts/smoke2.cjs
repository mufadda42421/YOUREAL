const { chromium } = require("playwright-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3105";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  for (const path of ["/dashboard", "/settings", "/worlds"]) {
    await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(1200);
    const url = page.url();
    const dialog = await page.getByRole("dialog").isVisible().catch(() => false);
    const lockScreen = await page.getByText(/Enter your 4-digit PIN/i).isVisible().catch(() => false);
    console.log(`${path} → url: ${url} | signin dialog: ${dialog} | pin lock: ${lockScreen}`);
  }

  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "C:\\Users\\Husain\\AppData\\Local\\Temp\\opencode\\shot-home.png" });
  console.log("screenshot saved: shot-home.png");
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error("FAILED:", e); process.exit(1); });
