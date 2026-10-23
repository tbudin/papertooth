/*! papertooth v0.4.1 | (c) 2026 Thomas Budin | MIT License | github.com/tbudin/papertooth */

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

// src/js/filters.js
var DEFAULTS = {
  text: { density: 0.7 },
  // 0..1  how uneven the ribbon ink is on body text
  head: { rough: 1, density: 0.8 },
  // rough: 0..3 edge roughness on headings
  graphite: { tooth: 2.4, rough: 0.9 },
  // tooth: how much of the paper grain catches the lead
  brush: { dry: 0.5, rough: 1.2 },
  // dry: gaps where the brush runs out of ink; rough: how ragged the hairs leave the edge
  stamp: { wear: 0.55, rough: 1.3, edge: 0.5, mottle: 0.5 },
  // wear: paper gaps; edge: ink pooling at the rim; mottle: uneven pad
  smudge: { drag: 4.2, blur: 3.4, strength: 0.78 },
  // fresh ink under a highlight
  smear: { drag: 7, blur: 4.5, strength: 0.7 },
  // extra ink dragged on hover
  typewriter: { spread: 0.6, rough: 1.2, uneven: 0.7, speckle: 0.5 },
  colors: { ribbon: "#24262c", pen: "#213c6b", highlighter: "#fff04a" }
};
var n2 = (v) => (+v).toFixed(2);
function smearColour(ink, hl = "#fff04a") {
  const y = toRgb(hl), c = toRgb(ink);
  return rgbHex(c.map((v, i) => (v * 0.45 + 255 * 0.55) * y[i] / 255));
}
var density = (k, b) => `<feColorMatrix in="blot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${n2(k)} 0 0 0 ${n2(b)}" result="density"/>`;
function smudgeFilter(id, p, colour, onlySmear) {
  return `<filter id="${id}" x="-5%" y="-40%" width="${onlySmear ? 150 : 130}%" height="180%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.012 0.85" numOctaves="2" seed="${onlySmear ? 13 : 6}" result="streak"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="${n2(p.blur)} 0.5" result="drag"/>
<feOffset in="drag" dx="${n2(p.drag)}" dy="0" result="dragged"/>
<feDisplacementMap in="dragged" in2="streak" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="streaky"/>
<feColorMatrix in="streak" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.75 0 0 0 -0.32" result="streakA"/>
<feComposite in="streaky" in2="streakA" operator="in" result="shape"/>
<feFlood flood-color="${colour}" flood-opacity="${n2(p.strength)}"/>
<feComposite in2="shape" operator="in" result="smear"/>` + (onlySmear ? "" : `<feComponentTransfer in="SourceGraphic" result="lifted"><feFuncA type="linear" slope="0.86"/></feComponentTransfer>
<feMerge><feMergeNode in="smear"/><feMergeNode in="lifted"/></feMerge>`) + `</filter>`;
}
function brushFilter(id, p) {
  p = { ...DEFAULTS.brush, ...p };
  const thr = 0.74 - 0.18 * p.dry;
  return `<filter id="${id}" x="-10%" y="-30%" width="120%" height="160%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.32" numOctaves="2" seed="5" result="grain"/>
<feDisplacementMap in="SourceGraphic" in2="grain" scale="${n2(p.rough)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
<feTurbulence type="fractalNoise" baseFrequency="0.04 0.85" numOctaves="2" seed="8" result="hair"/>
<feColorMatrix in="hair" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -10 0 0 0 ${n2(1 + 10 * thr)}" result="dry"/>
<feComposite in="rough" in2="dry" operator="in" result="kasure"/>
<feTurbulence type="fractalNoise" baseFrequency="0.025 0.04" numOctaves="2" seed="2" result="blot"/>
${density(0.9, 0.45)}
<feComposite in="kasure" in2="density" operator="in"/>
</filter>`;
}
function typewriterFilter(id, p) {
  p = { ...DEFAULTS.typewriter, ...p };
  const thr = 0.8 - 0.16 * p.speckle;
  return `<filter id="${id}" x="-4%" y="-20%" width="108%" height="140%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceGraphic" stdDeviation="${n2(0.12 + p.spread * 0.6)}" result="soft"/>
<feComponentTransfer in="soft" result="spread"><feFuncA type="linear" slope="3.2" intercept="${n2(-0.35 + p.spread * 0.1)}"/></feComponentTransfer>
<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="2" result="grain"/>
<feDisplacementMap in="spread" in2="grain" scale="${n2(p.rough)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
<feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="2" seed="9" result="blot"/>
${density(1.4 * p.uneven, 1 - 0.72 * p.uneven)}
<feTurbulence type="fractalNoise" baseFrequency="1.9" numOctaves="1" seed="5" result="wear"/>
<feColorMatrix in="wear" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -14 0 0 0 ${n2(1 + 14 * thr)}" result="holes"/>
<feComposite in="rough" in2="density" operator="in" result="inked"/>
<feComposite in="inked" in2="holes" operator="in"/>
</filter>`;
}
function lithoFilter(id, p) {
  const c = p.contrast, g = p.grain;
  const noise = (name, seed) => `<feTurbulence type="fractalNoise" baseFrequency="${n2(p.size)}" numOctaves="3" seed="${seed}" result="${name}0"/>
<feColorMatrix in="${name}0" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="${name}"/>`;
  const ink = (src, thr, colour, name, dx = 0, dy = 0) => `<feComponentTransfer in="${src}" result="${name}a"><feFuncA type="linear" slope="22" intercept="${n2(-22 * thr)}"/></feComponentTransfer>
<feFlood flood-color="${colour}"/><feComposite in2="${name}a" operator="in" result="${name}i"/>
<feOffset in="${name}i" dx="${n2(dx)}" dy="${n2(dy)}" result="${name}"/>`;
  const grained = (dark, nz, name) => `<feComposite in="${dark}" in2="${nz}" operator="arithmetic" k2="1" k3="${n2(g)}" k4="${n2(-g / 2)}" result="${name}"/>`;
  const head = `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">`;
  if (p.mode === "tri") {
    const plate = (name, row, seed, colour, dx, dy) => `<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${row} 0 ${n2(0.5 * c + 0.5 + p.darken)}" result="${name}d"/>
${noise(name + "n", seed)}
${grained(name + "d", name + "n", name + "v")}
${ink(name + "v", 0.56, colour, name, dx, dy)}`;
    const o = p.offset;
    return head + `
${plate("pb", `${n2(-c)} 0 0`, p.seed, p.blue, o, 0)}
${plate("pr", `0 ${n2(-c)} 0`, p.seed + 7, p.red, 0, o * 0.7)}
${plate("py", `0 0 ${n2(-c)}`, p.seed + 13, p.yellow, -o * 0.6, -o * 0.4)}
<feBlend in="pr" in2="py" mode="multiply" result="pry"/>
<feBlend in="pb" in2="pry" mode="multiply"/>
</filter>`;
  }
  return head + `
<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${n2(-0.2126 * c)} ${n2(-0.7152 * c)} ${n2(-0.0722 * c)} 0 ${n2(0.5 * c + 0.5 + p.darken)}" result="dark"/>
${noise("n", p.seed)}
${grained("dark", "n", "v")}
${p.mode === "duo" && p.ink2 ? ink("v", 0.66, p.ink, "t1") + "\n" + ink("v", 0.4, p.ink2, "t2", p.offset, p.offset * 0.6) + '<feMerge><feMergeNode in="t2"/><feMergeNode in="t1"/></feMerge>' : ink("v", 0.5, p.ink, "t1")}
</filter>`;
}
function filtersMarkup(params = {}) {
  const P = {};
  for (const k in DEFAULTS) P[k] = { ...DEFAULTS[k], ...params[k] || {} };
  const c = P.colors;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true" focusable="false" id="pt-filters">
<filter id="pt-ink-text" x="-4%" y="-12%" width="108%" height="124%">
<feTurbulence type="fractalNoise" baseFrequency="0.035 0.08" numOctaves="2" seed="11" result="blot"/>
${density(P.text.density, 1 - 0.64 * P.text.density)}
<feComposite in="SourceGraphic" in2="density" operator="in"/>
</filter>
<filter id="pt-ink-head" x="-6%" y="-20%" width="112%" height="140%">
<feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="4" result="grain"/>
<feDisplacementMap in="SourceGraphic" in2="grain" scale="${n2(P.head.rough)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
<feTurbulence type="fractalNoise" baseFrequency="0.03 0.07" numOctaves="2" seed="7" result="blot"/>
${density(P.head.density, 1 - 0.62 * P.head.density)}
<feComposite in="rough" in2="density" operator="in"/>
</filter>
<filter id="pt-graphite" x="-5%" y="-20%" width="110%" height="140%">
<feTurbulence type="fractalNoise" baseFrequency="1.6 1.1" numOctaves="2" seed="3" result="tooth"/>
<feColorMatrix in="tooth" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${n2(P.graphite.tooth)} 0 0 0 -0.5" result="toothA"/>
<feComposite in="SourceGraphic" in2="toothA" operator="in" result="lead"/>
<feDisplacementMap in="lead" in2="tooth" scale="${n2(P.graphite.rough)}" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="pt-stamp" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="21" result="fine"/>
<feDisplacementMap in="SourceGraphic" in2="fine" scale="${n2(P.stamp.rough)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
<feGaussianBlur in="rough" stdDeviation="1.6" result="soft"/>
<feComposite in="rough" in2="soft" operator="arithmetic" k2="${n2(1 + P.stamp.edge)}" k3="${n2(-P.stamp.edge * 1.1)}" result="rim"/>
<feTurbulence type="fractalNoise" baseFrequency="0.03 0.05" numOctaves="3" seed="4" result="mot"/>
<feColorMatrix in="mot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${n2(P.stamp.mottle * 2)} 0 0 0 ${n2(1 - P.stamp.mottle * 1.1)}" result="mottle"/>
<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="9" result="paper"/>
<feColorMatrix in="paper" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -12 0 0 0 ${n2(1 + 12 * (0.76 - 0.22 * P.stamp.wear))}" result="tooth"/>
<feComposite in="rim" in2="mottle" operator="in" result="inked"/>
<feComposite in="inked" in2="tooth" operator="in" result="pressed"/>
<feGaussianBlur in="pressed" stdDeviation="0.35" result="bleed"/>
<feMerge><feMergeNode in="bleed"/><feMergeNode in="pressed"/></feMerge>
</filter>
${smudgeFilter("pt-smudge-ribbon", P.smudge, smearColour(c.ribbon, c.highlighter))}
${smudgeFilter("pt-smudge-pen", P.smudge, smearColour(c.pen, c.highlighter))}
${smudgeFilter("pt-smear-ribbon", P.smear, smearColour(c.ribbon, c.highlighter), true)}
${smudgeFilter("pt-smear-pen", P.smear, smearColour(c.pen, c.highlighter), true)}
${typewriterFilter("pt-typewriter", P.typewriter)}
${brushFilter("pt-brush", P.brush)}
</svg>`;
}
var current = {};
function injectFilters(params = {}, doc = document) {
  for (const k in params) current[k] = { ...current[k] || {}, ...params[k] };
  const markup = filtersMarkup(current);
  const old = doc.getElementById("pt-filters");
  const tpl = doc.createElement("div");
  tpl.innerHTML = markup;
  const svg = tpl.firstElementChild;
  if (old) old.replaceWith(svg);
  else doc.body.prepend(svg);
  doc.documentElement.dataset.ptFilters = "";
  return svg;
}

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
  toHex,
  hoverOf,
  cssVar,
  DEFAULTS,
  smearColour,
  brushFilter,
  typewriterFilter,
  lithoFilter,
  filtersMarkup,
  injectFilters
};
