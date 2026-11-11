const { chromium } = require("playwright-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3109";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("console", (m) => { if (m.text().includes("YOU guard") || m.text().includes("YOU add-account")) console.log("[browser]", m.text().slice(0, 160)); });

  // Sign up a quick throwaway account with PIN (A'), then add B, then switch back.
  const ts = Date.now().toString(36);
  const A = { pref: "ProbeA", name: "Probe One", email: `you-probe-a-${ts}@example.com`, pass: "SmokePass1234" };
  const B = { pref: "ProbeB", name: "Probe Two", email: `you-probe-b-${ts}@example.com`, pass: "SmokePass1234" };

  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.getByRole("button", { name: /Get Started/i }).first().click();
  await page.getByLabel("Full name").fill(A.name);
  await page.getByLabel("Email").fill(A.email);
  await page.locator("#auth-password").fill(A.pass);
  await page.locator("#auth-confirm").fill(A.pass);
  await page.getByRole("button", { name: /Create my world/i }).click();
  await page.waitForURL("**/onboarding", { timeout: 30000 });
  await page.locator("#onb-pref").fill(A.pref);
  await page.getByRole("button", { name: /Continue/i }).click();
  await page.getByRole("button", { name: /Continue/i }).click();
  await page.getByRole("button", { name: /Continue/i }).click();
  await page.getByRole("button", { name: /Enable 4-digit PIN/i }).click();
  await page.locator("#onb-pin").fill("1234");
  await page.locator("#onb-pin2").fill("1234");
  await page.getByRole("button", { name: /Enter YOU/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  console.log("A ready:", await page.url());

  // Add B
  await page.locator("aside button[aria-haspopup='true']").first().click();
  await page.getByRole("button", { name: /Add another account/i }).click();
  await page.waitForTimeout(2500);
  console.log("after Add-account click → url:", page.url());
  console.log("body:", (await page.textContent("body"))?.replace(/\s+/g, " ").slice(0, 220));
  await page.screenshot({ path: "C:\\Users\\Husain\\AppData\\Local\\Temp\\opencode\\e2e-addaccount.png" });
  await page.getByLabel("Full name").fill(B.name);
  await page.getByLabel("Email").fill(B.email);
  await page.locator("#auth-password").fill(B.pass);
  await page.locator("#auth-confirm").fill(B.pass);
  await page.getByRole("button", { name: /Create my world/i }).click();
  await page.waitForURL("**/onboarding", { timeout: 30000 });
  await page.locator("#onb-pref").fill(B.pref);
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: /Continue|Enter YOU/i }).first().click();
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  console.log("B ready:", await page.url());

  // Switch back to A
  await page.locator("aside button[aria-haspopup='true']").first().click();
  await page.getByRole("button", { name: new RegExp(A.name, "i") }).first().click();
  await page.waitForTimeout(3000);

  const probe = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return {
      idx: bodyText.indexOf("4-digit PIN"),
      snippet: bodyText.slice(Math.max(0, bodyText.indexOf("4-digit PIN") - 60), bodyText.indexOf("4-digit PIN") + 60),
      pinElements: document.querySelectorAll("*").length,
    };
  });
  console.log("probe:", JSON.stringify(probe, null, 2));
  await page.screenshot({ path: "C:\\Users\\Husain\\AppData\\Local\\Temp\\opencode\\e2e-probe.png" });
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
