import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://127.0.0.1:4173");
await page.waitForTimeout(3600);

for (const width of [320, 390, 768, 1024, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(300);
  const layout = await page.evaluate(() => {
    const title = document.querySelector("h1");
    const titleRect = title.getBoundingClientRect();
    const spans = [...title.querySelectorAll("span")].map((span) =>
      span.getBoundingClientRect().toJSON(),
    );
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      title: titleRect.toJSON(),
      spans,
    };
  });
  assert.equal(layout.overflow, false, `overflow at ${width}`);
  assert.ok(
    layout.title.x >= 0 && layout.title.right <= width,
    `title at ${width}`,
  );
  assert.ok(
    layout.spans.every((span) => span.left >= 0 && span.right <= width),
    `title glyphs at ${width}`,
  );
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
const project = page.locator(".project").first();
await project.hover();
await page.waitForTimeout(400);
assert.equal(await page.locator(".cursor-caption").textContent(), "VIEW");
assert.equal(
  await project
    .locator(".project-art")
    .evaluate((el) => getComputedStyle(el, "::before").opacity),
  "1",
);
await page.keyboard.press("Tab");
await project.focus();
await page.waitForTimeout(500);
assert.equal(
  await project.evaluate((el) => el.matches(":focus-visible")),
  true,
);
assert.equal(
  await project
    .locator(".project-art")
    .evaluate((el) => getComputedStyle(el, "::before").opacity),
  "1",
);
assert.equal(
  await project.locator("video").evaluate((video) => video.paused),
  false,
);
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.waitForTimeout(500);
assert.equal(
  await project.locator("video").evaluate((video) => video.paused),
  true,
);
await project.click();
await page.waitForTimeout(700);
assert.equal(
  await page.locator("dialog").evaluate((dialog) => dialog.open),
  true,
);
const firstTitle = await page.locator("#viewer-title").textContent();
await page.keyboard.press("ArrowRight");
assert.notEqual(await page.locator("#viewer-title").textContent(), firstTitle);
await page.keyboard.press("Escape");
await page.waitForTimeout(500);
assert.equal(await page.locator("dialog").count(), 0);
assert.equal(
  await page.evaluate(() => document.activeElement.className),
  "project",
);

async function scrollScene(progress) {
  await page.evaluate((p) => {
    const scene = document.getElementById("experience");
    window.scrollTo({
      top: scene.offsetTop + (scene.offsetHeight - innerHeight) * p,
      behavior: "instant",
    });
  }, progress);
  await page.waitForTimeout(1600);
}
await scrollScene(0.85);
assert.equal(await page.locator(".spatial-card.is-interactive").count(), 12);
const boxes = await page
  .locator(".spatial-card")
  .evaluateAll((cards) =>
    cards.map((card) => card.getBoundingClientRect().toJSON()),
  );
for (let i = 0; i < boxes.length; i++) {
  for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i],
      b = boxes[j];
    assert.ok(
      a.right < b.left ||
        b.right < a.left ||
        a.bottom < b.top ||
        b.bottom < a.top,
      `spatial cards ${i} and ${j} overlap`,
    );
  }
}
const assembled = await page
  .locator(".spatial-card")
  .first()
  .evaluate((el) => getComputedStyle(el).transform);
await page.locator(".spatial-card").first().click();
assert.equal(await page.locator("dialog").count(), 1);
await page.keyboard.press("Escape");
await page.waitForTimeout(500);
await scrollScene(0.25);
const scattered = await page
  .locator(".spatial-card")
  .first()
  .evaluate((el) => getComputedStyle(el).transform);
assert.notEqual(assembled, scattered);
for (const width of [320, 390, 768, 1024]) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(300);
  await scrollScene(0.85);
  const cards = await page
    .locator(".spatial-card")
    .evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().toJSON()),
    );
  assert.ok(
    cards.every((card) => card.left >= 0 && card.right <= width),
    `scene bounds at ${width}`,
  );
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i],
        b = cards[j];
      assert.ok(
        a.right < b.left ||
          b.right < a.left ||
          a.bottom < b.top ||
          b.bottom < a.top,
        `scene overlap at ${width}`,
      );
    }
  }
}
const before = await page
  .locator(".journey-ink")
  .evaluate((el) => Number(el.style.strokeDashoffset));
await page.locator("#work").scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
const after = await page
  .locator(".journey-ink")
  .evaluate((el) => Number(el.style.strokeDashoffset));
assert.ok(after < before);

await page.locator("#top").scrollIntoViewIfNeeded();
await page
  .getByRole("button", { name: "Pause interactive ambient motion" })
  .click();
await page
  .getByRole("button", { name: "Replay pencil sketch portrait reveal" })
  .click();
await page.waitForTimeout(500);
const early = await page
  .locator(".subject-photo")
  .evaluate((el) => getComputedStyle(el).clipPath);
await page.waitForTimeout(3200);
const late = await page
  .locator(".subject-photo")
  .evaluate((el) => getComputedStyle(el).clipPath);
assert.notEqual(early, late);
await page.emulateMedia({ reducedMotion: "reduce" });
await page.waitForTimeout(300);
assert.equal(
  await page
    .locator(".subject-photo")
    .evaluate((el) => getComputedStyle(el).animationName),
  "none",
);
assert.equal(await page.locator(".spatial-card.is-interactive").count(), 12);
assert.deepEqual(errors, []);

const touch = await browser.newContext({
  hasTouch: true,
  isMobile: true,
  viewport: { width: 390, height: 844 },
});
const mobile = await touch.newPage();
await mobile.goto("http://127.0.0.1:4173");
await mobile.locator("#work").scrollIntoViewIfNeeded();
await mobile.locator(".project").first().tap();
assert.equal(
  await mobile.locator("dialog").evaluate((dialog) => dialog.open),
  true,
);
assert.equal(
  await mobile
    .locator("#cursor")
    .evaluate((el) => getComputedStyle(el).display),
  "none",
);
await browser.close();
console.log(
  "V5 responsive layout, filters, viewer, scene, connector, replay, reduced motion and touch checks passed.",
);
