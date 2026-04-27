import { chromium } from "@playwright/test";

const baseUrl = process.env.APP_URL || "http://127.0.0.1:3000";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

page.on("console", (message) => {
  if (message.type() === "error") {
    console.log(`browser console error: ${message.text()}`);
  }
});

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Load demo" }).click();
await page.getByRole("button", { name: "Generate recipes" }).click();
await page.locator(".recipe-card").first().waitFor({ state: "visible", timeout: 30000 });

const count = await page.locator(".recipe-card").count();
if (count < 3) {
  throw new Error(`Expected at least 3 recipe cards, got ${count}`);
}

await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "recipejoy-mobile.png", fullPage: true });

await page.setViewportSize({ width: 1366, height: 900 });
await page.screenshot({ path: "recipejoy-desktop.png", fullPage: true });

await browser.close();
console.log(`Smoke test passed with ${count} recipe cards.`);
