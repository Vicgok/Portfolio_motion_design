import fs from "node:fs";
import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
const result = await page.evaluate(
  async ({ old, newImage }) => {
    async function load(src) {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let x0 = c.width,
        y0 = c.height,
        x1 = 0,
        y1 = 0;
      for (let y = 0; y < c.height; y++)
        for (let x = 0; x < c.width; x++)
          if (data[(y * c.width + x) * 4 + 3] > 40) {
            x0 = Math.min(x, x0);
            y0 = Math.min(y, y0);
            x1 = Math.max(x, x1);
            y1 = Math.max(y, y1);
          }
      return {
        img,
        b: { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 },
        width: c.width,
        height: c.height,
      };
    }
    const a = await load(old),
      b = await load(newImage);
    const W = 367,
      H = 737;
    const target = {
      x: (a.b.x / a.width) * W,
      y: (a.b.y / a.height) * H,
      w: (a.b.w / a.width) * W,
      h: (a.b.h / a.height) * H,
    };
    const scale = Math.min(target.w / b.b.w, target.h / b.b.h);
    const w = b.width * scale,
      h = b.height * scale,
      x = target.x + (target.w - b.b.w * scale) / 2 - b.b.x * scale,
      y = target.y + (target.h - b.b.h * scale) / 2 - b.b.y * scale;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(b.img, x, y, w, h);
    const d = ctx.getImageData(0, 0, W, H).data;
    const gray = new Float32Array(W * H),
      alpha = new Uint8Array(W * H);
    for (let i = 0; i < gray.length; i++) {
      gray[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
      alpha[i] = d[i * 4 + 3] > 80 ? 1 : 0;
    }
    const contour = new Uint8Array(W * H),
      edge = new Uint8Array(W * H);
    for (let yy = 1; yy < H - 1; yy++)
      for (let xx = 1; xx < W - 1; xx++) {
        const i = yy * W + xx;
        if (!alpha[i]) continue;
        if (!alpha[i - 1] || !alpha[i + 1] || !alpha[i - W] || !alpha[i + W]) {
          contour[i] = 1;
          continue;
        }
        const gx = gray[i + 1] - gray[i - 1],
          gy = gray[i + W] - gray[i - W];
        if (Math.hypot(gx, gy) > 30) edge[i] = 1;
      }
    function chains(mask, min) {
      const paths = [];
      const offsets = [-1, 1, -W, W, -W - 1, -W + 1, W - 1, W + 1];
      for (let start = 0; start < mask.length; start++) {
        if (!mask[start]) continue;
        let current = start,
          points = [];
        while (current >= 0) {
          mask[current] = 0;
          points.push([current % W, Math.floor(current / W)]);
          const next = offsets
            .map((o) => current + o)
            .find((n) => n >= 0 && n < mask.length && mask[n]);
          current = next ?? -1;
        }
        if (points.length >= min) {
          const sampled = points.filter(
            (p, i) => i === 0 || i === points.length - 1 || i % 3 === 0,
          );
          paths.push({
            d: sampled.map((p, i) => (i ? "L" : "M") + p.join(" ")).join(" "),
            y: points[0][1],
          });
        }
      }
      return paths;
    }
    const hatches = [];
    for (let yy = 40; yy < 460; yy += 11)
      for (let xx = 25; xx < 340; xx += 13) {
        let i = yy * W + xx;
        if (alpha[i] && gray[i] < 75 && alpha[i - 5 * W + 6])
          hatches.push(`M${xx} ${yy}l6 -5`);
      }
    return {
      oldBounds: a.b,
      newBounds: b.b,
      target,
      image: { x, y, w, h },
      contours: chains(contour, 8),
      details: chains(edge, 10)
        .sort((a, b) => a.y - b.y)
        .slice(0, 360),
      hatches,
    };
  },
  {
    old:
      "data:image/webp;base64," +
      fs.readFileSync("public/portrait.webp").toString("base64"),
    newImage:
      "data:image/png;base64," +
      fs.readFileSync("public/portrait.png").toString("base64"),
  },
);
await browser.close();
const { x, y, w, h } = result.image;
let html = fs.readFileSync("src/hero.html", "utf8");
html = html.replace(
  /<img\s+class="subject-photo"[\s\S]*?\/>/,
  `<svg class="subject-photo" viewBox="0 0 367 737" role="img" aria-label="Arun, motion designer"><image href="/portrait.png" x="${x}" y="${y}" width="${w}" height="${h}"/></svg>`,
);
const path = (d, cls, delay, dur) =>
  `<path pathLength="1" class="${cls}" style="--delay:${delay}s;--dur:${dur}s" d="${d}"/>`;
const svg = `<svg class="portrait-lineart" viewBox="0 0 367 737" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g class="pencil-contours">${result.contours.map((p) => path(p.d, "contour-path", 0.25 + p.y / 1200, 0.85)).join("")}</g><g class="pencil-details">${result.details.map((p) => path(p.d, "detail-path", 0.5 + p.y / 950, 0.4)).join("")}</g><g class="pencil-hatching">${result.hatches.map((d, i) => path(d, "hatch-path", 1.15 + (i % 9) * 0.035, 0.25)).join("")}</g></svg>`;
html = html.replace(/<svg\s+class="portrait-lineart"[\s\S]*?<\/svg>/, svg);
fs.writeFileSync("src/hero.html", html);
console.log(
  JSON.stringify({
    ...result,
    contours: result.contours.length,
    details: result.details.length,
    hatches: result.hatches.length,
  }),
);
