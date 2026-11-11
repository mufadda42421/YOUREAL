// YOU — full live end-to-end smoke test against project you-8e6c0.
// Creates TWO throwaway accounts, exercises core flows, deletes both at the end.
const { chromium } = require("playwright-core");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = `http://localhost:${process.env.PORT ?? 3109}`;
const TS = Date.now().toString(36);
const A = { name: "Smoke Test One", email: `you-smoke-a-${TS}@example.com`, pass: "SmokePass1234", pref: "SmokeA" };
const B = { name: "Smoke Test Two", email: `you-smoke-b-${TS}@example.com`, pass: "SmokePass1234", pref: "SmokeB" };
const errors = [];

const log = (ok, label, extra = "") => console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? " — " + extra : ""}`);

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("CONSOLE: " + m.text().slice(0, 220));
  });

  // Client-side nav helper — full reloads would (correctly) re-lock PIN-gated sessions.
  const nav = async (label) => {
    await page.locator("aside nav a", { hasText: label }).click();
    await page.waitForTimeout(2500);
  };
  const enterPin = async () => {
    await page.waitForSelector('text=Enter your 4-digit PIN', { timeout: 15000 });
    for (const d of ["1", "2", "3", "4"]) await page.getByRole("button", { name: d, exact: true }).click();
    await page.waitForTimeout(1800);
  };
  const quickPick = async (acct) => {
    const btn = page.locator("aside").getByRole("button", { name: new RegExp(`${acct.pref}.*${acct.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${acct.pref}`, "i") }).first();
    return btn;
  };

  // ── 1. Sign up account A ──────────────────────────────────────────────
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.getByRole("button", { name: /Get Started/i }).first().click();
  await page.getByLabel("Full name").fill(A.name);
  await page.getByLabel("Email").fill(A.email);
  await page.locator("#auth-password").fill(A.pass);
  await page.locator("#auth-confirm").fill(A.pass);
  await page.getByRole("button", { name: /Create my world/i }).click();
  await page.waitForURL("**/onboarding", { timeout: 30000 });
  log(true, "signup → onboarding redirect");

  await page.locator("#onb-pref").fill(A.pref);
  await page.locator("#onb-occ").fill("Professional button-presser");
  await page.getByRole("button", { name: /Continue/i }).click();
  await page.getByRole("button", { name: "Technology", exact: true }).click();
  await page.getByRole("button", { name: "Music", exact: true }).click();
  await page.getByRole("button", { name: /Continue/i }).click();
  await page.getByRole("button", { name: /Continue/i }).click();
  await page.getByRole("button", { name: /Enable 4-digit PIN/i }).click();
  await page.locator("#onb-pin").fill("1234");
  await page.locator("#onb-pin2").fill("1234");
  await page.getByRole("button", { name: /Enter YOU/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  await page.waitForTimeout(1500);
  log(/SmokeA/.test(await page.textContent("body") ?? ""), "onboarding saved → dashboard greets preferred name");

  // ── 2. Reload → session restore + PIN gate ───────────────────────────────
  await page.reload({ waitUntil: "load" });
  let pinLocked = false;
  try {
    await page.getByText(/Enter your 4-digit PIN/i).waitFor({ timeout: 18000 });
    pinLocked = true;
  } catch {
    // Fall through — collect debug info below.
  }
  log(pinLocked, "reload with PIN enabled shows unlock screen");
  if (!pinLocked) {
    console.log("DEBUG after reload:", (await page.textContent("body"))?.replace(/\s+/g, " ").slice(0, 400));
    // Could be dashboard already (session restored but unlock state lost edge) or sign-out — handle both.
    const body = await page.textContent("body") ?? "";
    if (/Sign in to YOU|Welcome back/.test(body)) {
      console.log("NOTE: session did not restore on reload — trying manual sign-in");
    }
    process.exit(1);
  }
  await enterPin();
  await nav("My Worlds");
  console.log("DEBUG url:", page.url());
  console.log("DEBUG body:", (await page.textContent("body"))?.replace(/\s+/g, " ").slice(0, 300));
  await page.getByRole("button", { name: /Create world/i }).first().click();
  await page.locator("#world-name").fill("Smoke World");
  await page.getByRole("dialog", { name: /Create a new world/i }).getByRole("button", { name: "Create world" }).click();
  await page.waitForURL("**/worlds/**", { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(3500);
  console.log("DEBUG after create → url:", page.url());
  console.log("DEBUG toasts:", await page.locator('[role="status"]').allTextContents());
  console.log("DEBUG detail body:", (await page.textContent("body"))?.replace(/\s+/g, " ").slice(0, 2200));
  await page.screenshot({ path: "C:\\Users\\Husain\\AppData\\Local\\Temp\\opencode\\e2e-world-detail.png" });
  log(await page.getByText("Smoke World").first().isVisible(), "world created and opened");

  await page.getByRole("button", { name: /Add widget/i }).click();
  await page.getByRole("button", { name: /Notes/i }).first().click();
  await page.waitForTimeout(1200);
  await page.locator('input[aria-label="New note"]').fill("hello from smoke test");
  await page.locator('input[aria-label="New note"]').press("Enter");
  await page.waitForTimeout(1500);
  log(await page.getByText("hello from smoke test").first().isVisible(), "notes widget persists a note");

  // ── 4. Add account B without destroying A's session (the intended flow) ──
  await page.locator("aside button[aria-haspopup='true']").first().click();
  await page.getByRole("button", { name: /Add another account/i }).click();
  await page.waitForURL("**/?auth=signup**", { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await page.getByLabel("Full name").fill(B.name);
  await page.getByLabel("Email").fill(B.email);
  await page.locator("#auth-password").fill(B.pass);
  await page.locator("#auth-confirm").fill(B.pass);
  await page.getByRole("button", { name: /Create my world/i }).click();
  await page.waitForTimeout(3000);
  console.log("DEBUG B signup → url:", page.url());
  console.log("DEBUG dialog:", await page.getByRole("dialog").isVisible().catch(() => false));
  console.log("DEBUG toasts:", await page.locator('[role="status"]').allTextContents());
  console.log("DEBUG alert:", await page.locator('[role="alert"]').allTextContents());
  await page.waitForURL("**/onboarding", { timeout: 25000 });
  await page.locator("#onb-pref").fill(B.pref);
  await page.getByRole("button", { name: /Continue/i }).click();
  await page.getByRole("button", { name: /Continue/i }).click();
  await page.getByRole("button", { name: /Continue/i }).click();
  await page.getByRole("button", { name: /Enter YOU/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  await page.waitForTimeout(1200);
  log(/SmokeB/.test(await page.textContent("body") ?? ""), "account B signed up and reached dashboard");
  await nav("My Worlds");
  log(!/Smoke World/.test(await page.textContent("body") ?? ""), "account B cannot see account A's world (isolation)");

  // ── 5. Switch back to account A — PIN required ───────────────────────────
  await page.locator("aside button[aria-haspopup='true']").first().click();
  await page.waitForTimeout(800);
  console.log("DEBUG menu visible:", await page.getByRole("menu").isVisible().catch(() => false));
  console.log("DEBUG menu html:", (await page.getByRole("menu").innerText().catch(() => "none")).replace(/\s+/g, " ").slice(0, 300));
  await page.screenshot({ path: "C:\\Users\\Husain\\AppData\\Local\\Temp\\opencode\\e2e-switcher.png" });
  await page.getByRole("button", { name: new RegExp(A.name, "i") }).first().click();
  await page.waitForTimeout(2500);
  console.log("DEBUG after A-row click → url:", page.url());
  console.log("DEBUG PIN visible:", await page.getByText(/Enter your 4-digit PIN/i).isVisible().catch(() => false));
  console.log("DEBUG body:", (await page.textContent("body"))?.replace(/\s+/g, " ").slice(0, 260));
  await page.screenshot({ path: "C:\\Users\\Husain\\AppData\\Local\\Temp\\opencode\\e2e-after-switch.png" });
  const pinPrompt = await page.getByRole("button", { name: "Unlock" })
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  log(pinPrompt, "switching into PIN-protected account demands PIN");
  if (pinPrompt) await enterPin();
  await nav("My Worlds");
  log(/Smoke World/.test(await page.textContent("body") ?? ""), "account A's world visible after PIN unlock");

  // ── 6. Delete account A via Settings ─────────────────────────────────────
  await nav("Settings");
  await page.getByRole("tab", { name: /Account/i }).click();
  await page.locator('input[type="password"]').first().fill(A.pass);
  await page.getByPlaceholder("DELETE").fill("DELETE");
  await page.getByRole("button", { name: /Delete my account forever/i }).click();
  await page.waitForTimeout(30000);
  console.log("DEBUG delete A → url:", page.url());
  console.log("DEBUG toasts:", await page.locator('[role="status"]').allTextContents());
  console.log("DEBUG alerts:", await page.locator('[role="alert"]').allTextContents());
  log(new URL(page.url()).pathname === "/", "account A deleted via settings", page.url());

  // ── 7. Sign in as B and delete B ──────────────────────────────────────────
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.getByRole("button", { name: /Sign in/i }).first().click();
  await page.getByRole("button", { name: new RegExp(B.name, "i") }).first().click().catch(() => {});
  await page.locator("#auth-email").fill(B.email);
  await page.locator("#auth-password").fill(B.pass);
  await page.getByRole("button", { name: /Sign in to YOU/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  await nav("Settings");
  await page.getByRole("tab", { name: /Account/i }).click();
  await page.locator('input[type="password"]').first().fill(B.pass);
  await page.getByPlaceholder("DELETE").fill("DELETE");
  await page.getByRole("button", { name: /Delete my account forever/i }).click();
  await page.waitForTimeout(30000);
  console.log("DEBUG delete B → toasts:", await page.locator('[role="status"]').allTextContents());
  console.log("DEBUG alerts:", await page.locator('[role="alert"]').allTextContents());
  log(new URL(page.url()).pathname === "/", "account B deleted via settings", page.url());

  console.log("\nConsole/page errors seen:", errors.length ? errors : "none");
  await browser.close();
  process.exit(0);
})().catch((e) => {
  console.error("E2E FAILED:", e.message);
  console.error("errors seen:", errors);
  process.exit(1);
});
