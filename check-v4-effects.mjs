import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:4173");
await page.waitForTimeout(3700);
const before = await page
  .locator(".journey-ink")
  .evaluate((e) => e.style.strokeDashoffset);
await page.locator("#work").scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
const after = await page
  .locator(".journey-ink")
  .evaluate((e) => e.style.strokeDashoffset);
assert.ok(Number(after) < Number(before));
await page.locator(".project").first().hover();
await page.waitForTimeout(300);
assert.equal(await page.locator(".cursor-caption").textContent(), "VIEW");
await page.locator("#top").scrollIntoViewIfNeeded();
await page
  .getByRole("button", { name: "Replay pencil sketch portrait reveal" })
  .click();
await page.waitForTimeout(500);
const early = await page
  .locator(".subject-photo")
  .evaluate((e) => getComputedStyle(e).clipPath);
await page.waitForTimeout(3200);
const late = await page
  .locator(".subject-photo")
  .evaluate((e) => getComputedStyle(e).clipPath);
assert.notEqual(early, late);
console.log("Connector progress, desktop VIEW cursor, and replay mask pass");
await page.setViewportSize({ width: 390, height: 900 });
await page.screenshot({ path: "test-results/v4-mobile.png" });
const touch = await browser.newContext({
  hasTouch: true,
  isMobile: true,
  viewport: { width: 390, height: 844 },
});
const mobile = await touch.newPage();
await mobile.goto("http://localhost:4173");
await mobile.mouse.move(100, 100);
assert.equal(
  await mobile.locator("#cursor").evaluate((e) => getComputedStyle(e).display),
  "none",
);
console.log("Touch cursor exclusion pass");
await browser.close();
