/*! papertooth v0.4.0 | (c) 2026 Thomas Budin | MIT License | github.com/tbudin/papertooth */

// src/js/core.js
var f = (n) => String(Math.round(n * 10) / 10);
var enc = (s) => 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")';
var svgDoc = (w, h, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}" preserveAspectRatio="none">${inner}</svg>`;
function rng(seed) {
  let s = seed | 0;
  return function() {
    s = s + 1831565813 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var base = null;
var counter = 0;
function setSeed(seed) {
  base = seed == null ? null : seed | 0;
  counter = 0;
}
function seedOf(el) {
  if (!el.dataset.seed) el.dataset.seed = String(base == null ? Math.random() * 1e9 | 0 : base * 7919 + ++counter);
  return el.dataset.seed | 0;
}
function curve(pts, move) {
  let d = move ? `M${f(pts[0][0])} ${f(pts[0][1])}` : "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}
var jit = (p, r, a) => [p[0] + (r() - 0.5) * a, p[1] + (r() - 0.5) * a];
function stroke(a, b, r, over, bend) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const s = [a[0] - ux * over * r(), a[1] - uy * over * r()];
  const e = [b[0] + ux * over * (0.4 + r()), b[1] + uy * over * (0.4 + r())];
  const m = [(s[0] + e[0]) / 2 - uy * (r() - 0.5) * bend, (s[1] + e[1]) / 2 + ux * (r() - 0.5) * bend];
  return `M${f(s[0])} ${f(s[1])} Q${f(m[0])} ${f(m[1])} ${f(e[0])} ${f(e[1])}`;
}
var probe = null;
function toRgb(c) {
  c = String(c).trim();
  if (/^#[\da-f]{3,8}$/i.test(c)) {
    const h = c.length < 7 ? [...c.slice(1, 4)].map((x) => x + x).join("") : c.slice(1, 7);
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  if (/^rgba?\([^%]*\)$/i.test(c)) return c.match(/[\d.]+/g).slice(0, 3).map(Number);
  probe = probe || document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "#000";
  probe.fillStyle = c;
  probe.fillRect(0, 0, 1, 1);
  return Array.from(probe.getImageData(0, 0, 1, 1).data.subarray(0, 3));
}
var rgbHex = (c) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
var toHex = (c) => rgbHex(toRgb(c));
var hoverOf = (el) => el.dataset.hover || (el.classList.contains("pt-btn") && !el.classList.contains("pt-btn--outline") ? "underline" : "");
var cssVar = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();

export {
  f,
  enc,
  svgDoc,
  rng,
  setSeed,
  seedOf,
  curve,
  jit,
  stroke,
  toRgb,
  rgbHex,
  toHex,
  hoverOf,
  cssVar
};
