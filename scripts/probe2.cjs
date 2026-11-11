const { chromium } = require("playwright-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3109";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("console", (m) => console.log("[browser]", m.type(), m.text().slice(0, 220)));
  page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));
  page.on("requestfailed", (r) => console.log("[reqfail]", r.failure()?.errorText, r.url().slice(0, 110)));
  const ts = Date.now().toString(36);
  const email = `you-probe-${ts}@example.com`;

  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.getByRole("button", { name: /Get Started/i }).first().click();
  await page.getByLabel("Full name").fill("Probe User");
  await page.getByLabel("Email").fill(email);
  await page.locator("#auth-password").fill("SmokePass1234");
  await page.locator("#auth-confirm").fill("SmokePass1234");
  await page.getByRole("button", { name: /Create my world/i }).click();
  await page.waitForURL("**/onboarding", { timeout: 30000 });
  await page.locator("#onb-pref").fill("Probe");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: /Continue/i }).click();
  await page.getByRole("button", { name: /Enable 4-digit PIN/i }).click();
  await page.locator("#onb-pin").fill("1234");
  await page.locator("#onb-pin2").fill("1234");
  await page.getByRole("button", { name: /Enter YOU/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  await page.waitForTimeout(1500);

  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(4000);

  const probe = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      idx: t.indexOf("4-digit PIN"),
      idx2: t.indexOf("Enter your"),
      snippet: t.slice(Math.max(0, t.indexOf("Welcome back") - 0), t.indexOf("Welcome back") + 140),
    };
  });
  console.log("probe:", JSON.stringify(probe, null, 2));
  console.log("getByText count:", await page.getByText(/Enter your 4-digit PIN/i).count());
  console.log("text= count:", await page.locator("text=Enter your 4-digit PIN").count());
  console.log("getByRole Unlock count:", await page.getByRole("button", { name: "Unlock" }).count());
  console.log("locked aria count:", await page.locator("text=Temporarily locked").count());
  await page.screenshot({ path: "C:\\Users\\Husain\\AppData\\Local\\Temp\\opencode\\e2e-pinlock.png" });

  // Cleanup: unlock + delete account
  for (const d of ["1", "2", "3", "4"]) await page.getByRole("button", { name: d, exact: true }).click();
  await page.waitForTimeout(1800);
  console.log("unlocked? body has My Home:", (await page.textContent("body"))?.includes("My Home"));
  await page.locator("aside nav a", { hasText: "Settings" }).click();
  await page.waitForTimeout(1500);
  await page.getByRole("tab", { name: /Account/i }).click();
  await page.locator('input[type="password"]').first().fill("SmokePass1234");
  await page.getByPlaceholder("DELETE").fill("DELETE");
  await page.getByRole("button", { name: /Delete my account forever/i }).click();
  await page.waitForTimeout(16000);
  console.log("after delete → url:", page.url(), "toasts([role=status]):", await page.locator('[role="status"]').allTextContents());
  console.log("alerts:", await page.locator('[role="alert"]').allTextContents());
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
