import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:4173");
await page.waitForTimeout(4000);
console.log("cards", await page.locator(".project").count());
for (const width of [320, 375, 768, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(200);
  console.log(
    "layout",
    width,
    await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      title: document.querySelector("h1").getBoundingClientRect().toJSON(),
    })),
  );
}
await page.getByRole("button", { name: "Brand", exact: true }).click();
console.log("brand", await page.locator(".project").count());
await page.locator(".project").first().click();
await page.waitForTimeout(500);
console.log("viewer", await page.locator("dialog").evaluate((e) => e.open));
await page.keyboard.press("ArrowRight");
console.log("next", await page.locator("#viewer-title").textContent());
await page.keyboard.press("Escape");
await page.waitForTimeout(500);
console.log(
  "closed",
  await page.locator("dialog").count(),
  "focus",
  await page.evaluate(() => document.activeElement.className),
);
await page.emulateMedia({ reducedMotion: "reduce" });
await page.locator("#top").scrollIntoViewIfNeeded();
console.log(
  "reduced",
  await page.locator(".subject-photo").evaluate((e) => ({
    animation: getComputedStyle(e).animationName,
    opacity: getComputedStyle(e).opacity,
  })),
);
console.log("errors", errors);
await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
await browser.close();
