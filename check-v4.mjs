import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:4173");
await page.waitForTimeout(3800);
for (const width of [320, 390, 768, 1024, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(200);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  const title = await page.locator("h1").boundingBox();
  assert.ok(title.x >= 0 && title.x + title.width <= width);
  console.log("layout", width, "pass");
}
for (const [name, count] of [
  ["Motion", 6],
  ["Brand", 3],
  ["Experimental", 3],
  ["All 12", 12],
]) {
  await page.getByRole("button", { name, exact: true }).click();
  assert.equal(await page.locator(".project").count(), count);
}
console.log("filters pass");
await page.locator(".project").first().click();
await page.waitForTimeout(600);
assert.ok(await page.locator("dialog").evaluate((e) => e.open));
await page.keyboard.press("ArrowRight");
await page.keyboard.press("Escape");
await page.waitForTimeout(500);
assert.equal(await page.locator("dialog").count(), 0);
assert.equal(
  await page.evaluate(() => document.activeElement.className),
  "project",
);
console.log("viewer pass");
await page.evaluate(() => {
  const el = document.getElementById("experience");
  window.scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * 0.82);
});
await page.waitForTimeout(1400);
assert.equal(await page.locator(".spatial-card.is-interactive").count(), 12);
await page.locator(".spatial-card").first().click({ force: true });
await page.waitForTimeout(500);
assert.equal(await page.locator("dialog").count(), 1);
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
console.log("spatial viewer pass");
await page.locator("#top").scrollIntoViewIfNeeded();
await page
  .getByRole("button", { name: "Pause interactive ambient motion" })
  .click();
assert.equal(
  await page.locator(".hero-motion-toggle").getAttribute("aria-pressed"),
  "false",
);
await page.emulateMedia({ reducedMotion: "reduce" });
assert.equal(
  await page
    .locator(".subject-photo")
    .evaluate((e) => getComputedStyle(e).animationName),
  "none",
);
console.log("motion pass");
assert.deepEqual(errors, []);
console.log("no runtime errors");
await page.screenshot({ path: "test-results/v4.png" });
await browser.close();
