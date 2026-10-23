/*! papertooth v0.4.1 | (c) 2026 Thomas Budin | MIT License | github.com/tbudin/papertooth */
import {
  cssVar,
  lithoFilter,
  toRgb
} from "./chunk-TVJQOPJV.js";

// src/js/images.js
var lithoCache = /* @__PURE__ */ new Map();
var lithoDefs = null;
function defs() {
  if (lithoDefs && lithoDefs.isConnected) return lithoDefs;
  lithoDefs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  lithoDefs.setAttribute("aria-hidden", "true");
  lithoDefs.setAttribute("focusable", "false");
  lithoDefs.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  lithoDefs.id = "pt-filters-images";
  document.body.prepend(lithoDefs);
  lithoCache.clear();
  return lithoDefs;
}
var num = (el, name, fallback) => {
  const v = parseFloat(cssVar(el, name));
  return Number.isFinite(v) ? v : fallback;
};
function lithoParams(el) {
  const ink2 = cssVar(el, "--pt-litho-ink2");
  const hasInk2 = ink2 && ink2 !== "none";
  const mode = ["mono", "duo", "tri"].includes(el.dataset.litho) ? el.dataset.litho : hasInk2 ? "duo" : "mono";
  return {
    mode,
    ink: cssVar(el, "--pt-litho-ink") || "#232429",
    ink2: hasInk2 ? ink2 : "",
    blue: cssVar(el, "--pt-litho-blue") || "#3a82c4",
    red: cssVar(el, "--pt-litho-red") || "#d8466c",
    yellow: cssVar(el, "--pt-litho-yellow") || "#f2c640",
    grain: num(el, "--pt-litho-grain", 0.6),
    size: num(el, "--pt-litho-size", 0.7),
    contrast: num(el, "--pt-litho-contrast", 1.2),
    darken: num(el, "--pt-litho-darken", 0),
    offset: num(el, "--pt-litho-offset", 1.5),
    seed: Math.round(num(el, "--pt-litho-seed", 3))
  };
}
function lithoFilterId(p) {
  const key = JSON.stringify(p);
  if (lithoCache.has(key)) return lithoCache.get(key);
  const id = "pt-litho-" + lithoCache.size;
  const holder = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  holder.innerHTML = lithoFilter(id, p);
  defs().appendChild(holder.firstElementChild);
  lithoCache.set(key, id);
  return id;
}
var BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
var GB_SCREEN = [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]];
var PRINTERS = {
  // Game Boy Printer: 160 dots wide, four shades, ordered dithering
  gameboy: { dots: 160, dither: "bayer", levels: 4 },
  // thermal receipt printer: one colour, error diffusion, the slightly uneven heat of a cheap print head
  thermal: { dots: 200, dither: "atkinson", levels: 2 }
};
function printParams(el) {
  const mode = PRINTERS[el.dataset.printer] ? el.dataset.printer : "thermal";
  const base = PRINTERS[mode];
  return {
    mode,
    dots: parseInt(el.dataset.dots, 10) || base.dots,
    dither: el.dataset.dither || base.dither,
    levels: base.levels,
    contrast: num(el, "--pt-print-contrast", 1.15),
    brightness: num(el, "--pt-print-brightness", 0),
    wear: num(el, "--pt-print-wear", 0.5),
    palette: el.dataset.palette || "print",
    ink: cssVar(el, "--pt-print-ink") || "#26262a"
  };
}
function luminance(data, w, h, p) {
  const L = new Float32Array(w * h);
  for (let i = 0, j = 0; i < L.length; i++, j += 4) {
    const a = data[j + 3] / 255;
    const y = (0.2126 * data[j] + 0.7152 * data[j + 1] + 0.0722 * data[j + 2]) / 255 * a + (1 - a);
    L[i] = Math.min(1, Math.max(0, (y - 0.5) * p.contrast + 0.5 + p.brightness));
  }
  return L;
}
function dither(L, w, h, p) {
  const out = new Uint8Array(w * h), max = p.levels - 1;
  if (p.dither === "bayer") {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
      out[y * w + x] = Math.min(max, Math.floor(L[y * w + x] * max + t));
    }
    return out;
  }
  if (p.dither === "threshold") {
    for (let i = 0; i < L.length; i++) out[i] = Math.round(L[i] * max);
    return out;
  }
  const e = Float32Array.from(L);
  const atk = p.dither === "atkinson";
  const spread = atk ? [[1, 0, 1 / 8], [2, 0, 1 / 8], [-1, 1, 1 / 8], [0, 1, 1 / 8], [1, 1, 1 / 8], [0, 2, 1 / 8]] : [[1, 0, 7 / 16], [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16]];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, q = Math.min(max, Math.max(0, Math.round(e[i] * max)));
    out[i] = q;
    const err = e[i] - q / max;
    for (const [dx, dy, k] of spread) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && xx < w && yy < h) e[yy * w + xx] += err * k;
    }
  }
  return out;
}
var sources = /* @__PURE__ */ new Map();
function sourceImage(src, onReady) {
  let rec = sources.get(src);
  if (!rec) {
    const img = new Image();
    rec = { img, ready: false, failed: false, waiting: /* @__PURE__ */ new Set() };
    const settle = (ok) => {
      rec.ready = ok;
      rec.failed = !ok;
      rec.waiting.forEach((fn) => fn());
      rec.waiting.clear();
    };
    img.decoding = "async";
    img.onload = () => settle(true);
    img.onerror = () => settle(false);
    const url = new URL(src, location.href);
    if (url.origin !== location.origin && /^https?:$/.test(url.protocol)) img.crossOrigin = "anonymous";
    img.src = src;
    sources.set(src, rec);
  }
  if (!rec.ready && !rec.failed && onReady) rec.waiting.add(onReady);
  return rec;
}
var work = null;
function renderPrint(el, img, p) {
  const nw = img.naturalWidth, nh = img.naturalHeight;
  if (!nw || !nh) return false;
  const w = p.dots, h = Math.max(1, Math.round(w * nh / nw));
  work = work || document.createElement("canvas");
  work.width = w;
  work.height = h;
  const ctx = work.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  let src;
  try {
    src = ctx.getImageData(0, 0, w, h);
  } catch (err) {
    el.dataset.ptBlocked = "";
    return false;
  }
  const q = dither(luminance(src.data, w, h, p), w, h, p);
  const out = ctx.createImageData(w, h), d = out.data, max = p.levels - 1;
  const ink = toRgb(p.ink);
  const screen = p.palette === "screen" && p.mode === "gameboy";
  let seed = 7;
  const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const rows = new Float32Array(h);
  let drift = 0;
  for (let y = 0; y < h; y++) {
    drift += (rnd() - 0.5) * 0.18;
    drift *= 0.9;
    rows[y] = 1 - p.wear * (0.12 + Math.abs(drift));
  }
  const streak = Math.floor(w * (0.25 + rnd() * 0.5));
  for (let i = 0, j = 0; i < q.length; i++, j += 4) {
    const x = i % w, y = i / w | 0;
    if (screen) {
      const c = GB_SCREEN[q[i]];
      d[j] = c[0];
      d[j + 1] = c[1];
      d[j + 2] = c[2];
      d[j + 3] = 255;
      continue;
    }
    let a = (1 - q[i] / max) * rows[y];
    if (Math.abs(x - streak) < 1) a *= 1 - 0.45 * p.wear;
    d[j] = ink[0];
    d[j + 1] = ink[1];
    d[j + 2] = ink[2];
    d[j + 3] = Math.round(255 * Math.min(1, a));
  }
  ctx.putImageData(out, 0, 0);
  el.src = work.toDataURL("image/png");
  el.dataset.ptPrinted = "";
  return true;
}
export {
  PRINTERS,
  lithoFilterId,
  lithoParams,
  printParams,
  renderPrint,
  sourceImage
};
