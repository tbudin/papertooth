// Image effects. Lithograph is an SVG filter; the printers redraw the picture at low resolution
// with real dithering, the way a Game Boy Printer or a thermal receipt printer would.
import { lithoFilter } from './filters.js';
import { cssVar, toRgb } from './core.js';

/* ---------- lithograph ---------- */
const lithoCache = new Map();
let lithoDefs = null;
function defs() {
  if (lithoDefs && lithoDefs.isConnected) return lithoDefs;
  lithoDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  lithoDefs.setAttribute('aria-hidden', 'true');
  lithoDefs.setAttribute('focusable', 'false');
  lithoDefs.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  lithoDefs.id = 'pt-filters-images';
  document.body.prepend(lithoDefs);
  lithoCache.clear();
  return lithoDefs;
}
const num = (el, name, fallback) => { const v = parseFloat(cssVar(el, name)); return Number.isFinite(v) ? v : fallback; };

export function lithoParams(el) {
  const ink2 = cssVar(el, '--pt-litho-ink2');
  const hasInk2 = ink2 && ink2 !== 'none';
  const mode = ['mono', 'duo', 'tri'].includes(el.dataset.litho) ? el.dataset.litho : hasInk2 ? 'duo' : 'mono';
  return {
    mode,
    ink: cssVar(el, '--pt-litho-ink') || '#232429',
    ink2: hasInk2 ? ink2 : '',
    blue: cssVar(el, '--pt-litho-blue') || '#3a82c4',
    red: cssVar(el, '--pt-litho-red') || '#d8466c',
    yellow: cssVar(el, '--pt-litho-yellow') || '#f2c640',
    grain: num(el, '--pt-litho-grain', .6),
    size: num(el, '--pt-litho-size', .7),
    contrast: num(el, '--pt-litho-contrast', 1.2),
    darken: num(el, '--pt-litho-darken', 0),
    offset: num(el, '--pt-litho-offset', 1.5),
    seed: Math.round(num(el, '--pt-litho-seed', 3))
  };
}
/** Returns the id of a filter for these settings, creating it once. */
export function lithoFilterId(p) {
  const key = JSON.stringify(p);
  if (lithoCache.has(key)) return lithoCache.get(key);
  const id = 'pt-litho-' + lithoCache.size;
  const holder = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  holder.innerHTML = lithoFilter(id, p);
  defs().appendChild(holder.firstElementChild);
  lithoCache.set(key, id);
  return id;
}

/* ---------- printers ---------- */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const GB_SCREEN = [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]];

export const PRINTERS = {
  // Game Boy Printer: 160 dots wide, four shades, ordered dithering
  gameboy: { dots: 160, dither: 'bayer', levels: 4 },
  // thermal receipt printer: one colour, error diffusion, the slightly uneven heat of a cheap print head
  thermal: { dots: 200, dither: 'atkinson', levels: 2 }
};

export function printParams(el) {
  const mode = PRINTERS[el.dataset.printer] ? el.dataset.printer : 'thermal';
  const base = PRINTERS[mode];
  return {
    mode,
    dots: parseInt(el.dataset.dots, 10) || base.dots,
    dither: el.dataset.dither || base.dither,
    levels: base.levels,
    contrast: num(el, '--pt-print-contrast', 1.15),
    brightness: num(el, '--pt-print-brightness', 0),
    wear: num(el, '--pt-print-wear', .5),
    palette: el.dataset.palette || 'print',
    ink: cssVar(el, '--pt-print-ink') || '#26262a'
  };
}

function luminance(data, w, h, p) {
  const L = new Float32Array(w * h);
  for (let i = 0, j = 0; i < L.length; i++, j += 4) {
    const a = data[j + 3] / 255;
    const y = (.2126 * data[j] + .7152 * data[j + 1] + .0722 * data[j + 2]) / 255 * a + (1 - a);
    L[i] = Math.min(1, Math.max(0, (y - .5) * p.contrast + .5 + p.brightness));
  }
  return L;
}

function dither(L, w, h, p) {
  const out = new Uint8Array(w * h), max = p.levels - 1;
  if (p.dither === 'bayer') {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = (BAYER4[(y & 3) * 4 + (x & 3)] + .5) / 16;
      out[y * w + x] = Math.min(max, Math.floor(L[y * w + x] * max + t));
    }
    return out;
  }
  if (p.dither === 'threshold') {
    for (let i = 0; i < L.length; i++) out[i] = Math.round(L[i] * max);
    return out;
  }
  // error diffusion: Atkinson keeps highlights clean (the early Mac look), Floyd-Steinberg keeps more tone
  const e = Float32Array.from(L);
  const atk = p.dither === 'atkinson';
  const spread = atk
    ? [[1, 0, 1 / 8], [2, 0, 1 / 8], [-1, 1, 1 / 8], [0, 1, 1 / 8], [1, 1, 1 / 8], [0, 2, 1 / 8]]
    : [[1, 0, 7 / 16], [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16]];
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

/* the original picture, kept so a print can be redone with new settings */
const sources = new Map();
export function sourceImage(src, onReady) {
  let rec = sources.get(src);
  if (!rec) {
    const img = new Image();
    rec = { img, ready: false, failed: false, waiting: new Set() };
    const settle = ok => { rec.ready = ok; rec.failed = !ok; rec.waiting.forEach(fn => fn()); rec.waiting.clear(); };
    img.decoding = 'async';
    img.onload = () => settle(true);
    img.onerror = () => settle(false);
    // a picture from another site can only be read back from the canvas if it was requested with CORS
    const url = new URL(src, location.href);
    if (url.origin !== location.origin && /^https?:$/.test(url.protocol)) img.crossOrigin = 'anonymous';
    img.src = src;
    sources.set(src, rec);
  }
  if (!rec.ready && !rec.failed && onReady) rec.waiting.add(onReady);
  return rec;
}

let work = null;
/** Print a picture into its own <img>. Returns false when the picture cannot be read (another site without CORS). */
export function renderPrint(el, img, p) {
  const nw = img.naturalWidth, nh = img.naturalHeight;
  if (!nw || !nh) return false;
  const w = p.dots, h = Math.max(1, Math.round(w * nh / nw));
  work = work || document.createElement('canvas');
  work.width = w; work.height = h;
  const ctx = work.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  let src;
  try { src = ctx.getImageData(0, 0, w, h); } catch (err) { el.classList.add('pt-print--blocked'); return false; }
  const q = dither(luminance(src.data, w, h, p), w, h, p);
  const out = ctx.createImageData(w, h), d = out.data, max = p.levels - 1;
  const ink = toRgb(p.ink);
  const screen = p.palette === 'screen' && p.mode === 'gameboy';
  // uneven heat: some rows print lighter, and one worn spot on the head leaves a faint streak
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rows = new Float32Array(h);
  let drift = 0;
  for (let y = 0; y < h; y++) { drift += (rnd() - .5) * .18; drift *= .9; rows[y] = 1 - p.wear * (.12 + Math.abs(drift)); }
  const streak = Math.floor(w * (.25 + rnd() * .5));
  for (let i = 0, j = 0; i < q.length; i++, j += 4) {
    const x = i % w, y = (i / w) | 0;
    if (screen) { const c = GB_SCREEN[q[i]]; d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = 255; continue; }
    let a = (1 - q[i] / max) * rows[y];
    if (Math.abs(x - streak) < 1) a *= 1 - .45 * p.wear;
    d[j] = ink[0]; d[j + 1] = ink[1]; d[j + 2] = ink[2]; d[j + 3] = Math.round(255 * Math.min(1, a));
  }
  ctx.putImageData(out, 0, 0);
  el.src = work.toDataURL('image/png');
  el.classList.add('is-printed');
  return true;
}
