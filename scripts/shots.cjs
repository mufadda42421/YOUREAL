const { chromium } = require("playwright-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3106";
const OUT = "C:\\Users\\Husain\\AppData\\Local\\Temp\\opencode";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });

  // Desktop homepage (full hero + first sections)
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktop.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
  await desktop.waitForTimeout(2000);
  await desktop.screenshot({ path: `${OUT}\\final-desktop-hero.png` });
  await desktop.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await desktop.waitForTimeout(600);
  await desktop.screenshot({ path: `${OUT}\\final-desktop-bottom.png` });

  // Mobile homepage
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
  await mobile.waitForTimeout(1500);
  await mobile.screenshot({ path: `${OUT}\\final-mobile.png` });

  // Sign-in modal open state
  await desktop.goto(BASE + "/?auth=signup", { waitUntil: "networkidle", timeout: 60000 });
  await desktop.waitForTimeout(900);
  await desktop.screenshot({ path: `${OUT}\\final-signup.png` });

  await browser.close();
  console.log("done");
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
