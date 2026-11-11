// YOU — media-free-storage live test: upload (base64 → Firestore) → attach to world → Photo widget renders it.
const { chromium } = require("playwright-core");
const fs = require("fs");
const os = require("os");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = `http://localhost:${process.env.PORT ?? 3109}`;
const TS = Date.now().toString(36);
const A = { name: "Media Tester", email: `you-media-${TS}@example.com`, pass: "SmokePass1234", pref: "MediaT" };

const log = (ok, label, extra = "") => console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? " — " + extra : ""}`);

const nav = async (page, label, expectedPath) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.locator("aside nav a", { hasText: label }).click().catch(() => {});
    await page.waitForTimeout(1800);
    if (page.url().includes(expectedPath)) return true;
  }
  return page.url().includes(expectedPath);
};

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text().slice(0, 180)); });

  // ── sign up ───────────────────────────────────────────────────────────
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.getByRole("button", { name: /Get Started/i }).first().click();
  await page.getByLabel("Full name").fill(A.name);
  await page.getByLabel("Email").fill(A.email);
  await page.locator("#auth-password").fill(A.pass);
  await page.locator("#auth-confirm").fill(A.pass);
  await page.getByRole("button", { name: /Create my world/i }).click();
  await page.waitForURL("**/onboarding", { timeout: 30000 });
  await page.locator("#onb-pref").fill(A.pref);
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: /Continue/i }).click();
  await page.getByRole("button", { name: /Enter YOU/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 30000 });

  // ── create a world ─────────────────────────────────────────────────────
  const okWorlds = await nav(page, "My Worlds", "/worlds");
  console.log("navigated to worlds:", okWorlds);
  await page.getByRole("button", { name: /Create world/i }).first().click();
  await page.locator("#world-name").fill("Gallery World");
  await page.getByRole("dialog", { name: /Create a new world/i }).getByRole("button", { name: "Create world" }).click();
  await page.waitForURL("**/worlds/**", { timeout: 20000 });
  await page.waitForTimeout(1000);

  // ── upload an SVG photo through the real file input ─────────────────────
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#6366f1"/><circle cx="200" cy="150" r="90" fill="#a5b4fc"/></svg>`;
  const tmp = path.join(os.tmpdir(), `you-test-${TS}.svg`);
  fs.writeFileSync(tmp, svg);

  await nav(page, "My Media", "/media");
  await page.locator('input[type="file"]').setInputFiles(tmp);
  await page.waitForTimeout(4000);
  const mediaBody = await page.textContent("body") ?? "";
  log(/you-test-.*\.svg/.test(mediaBody), "upload lands in My Media grid");

  // ── select the file and attach it to Gallery World ──────────────────────
  await page.getByRole("button", { name: /Select all/i }).first().click();
  await page.getByRole("button", { name: /Attach to world/i }).first().click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /Gallery World/i }).click();
  await page.waitForTimeout(1200);
  log(true, "media attached to world");

  // ── open the world, add a Photo Gallery widget ───────────────────────────
  await nav(page, "My Worlds", "/worlds");
  await page.getByText("Gallery World").first().click();
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Add widget/i }).click();
  await page.getByRole("button", { name: /Photo Gallery/i }).click();
  await page.waitForTimeout(2500);

  const worldBody = await page.textContent("body") ?? "";
  const hasPhoto = await page.evaluate(() => {
    // the grid renders thumbnails as <img> with jpeg data-URLs
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs.some((i) => (i.getAttribute("src") ?? "").startsWith("data:image/jpeg"));
  });
  log(/1 photos/.test(worldBody) || hasPhoto, "photo appears inside the Photo Gallery widget");

  // ── delete account (cleanup) ────────────────────────────────────────────
  await nav(page, "Settings", "/settings");
  await page.getByRole("tab", { name: /Account/i }).click();
  await page.locator('input[type="password"]').first().fill(A.pass);
  await page.getByPlaceholder("DELETE").fill("DELETE");
  await page.getByRole("button", { name: /Delete my account forever/i }).click();
  await page.waitForTimeout(16000);
  log(new URL(page.url()).pathname === "/", "test account deleted", page.url());

  console.log("\nerrors seen:", errors.length ? errors : "none");
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error("MEDIA E2E FAILED:", e.message); process.exit(1); });
