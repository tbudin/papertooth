/*! papertooth v0.3.0 | (c) 2026 Thomas Budin | MIT License | github.com/tbudin/papertooth */

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
var cssVar = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();

// src/js/filters.js
var DEFAULTS = {
  text: { density: 0.7 },
  // 0..1  how uneven the ribbon ink is on body text
  head: { rough: 1, density: 0.8 },
  // rough: 0..3 edge roughness on headings
  graphite: { tooth: 2.4, rough: 0.9 },
  // tooth: how much of the paper grain catches the lead
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
  doc.documentElement.classList.add("pt-filters");
  return svg;
}

// src/js/tools.js
var TOOLS = ["pen", "ballpoint", "brush", "marker", "graphite", "pencil"];
function toolOf(el, def = {}) {
  const cs = getComputedStyle(el);
  const v = (n) => cs.getPropertyValue(n).trim();
  const kind = el.dataset.tool && TOOLS.includes(el.dataset.tool) ? el.dataset.tool : v("--pt-t-kind") || def.kind || "pen";
  return {
    kind,
    color: v("--pt-t-color") || def.color || "#24262c",
    w: parseFloat(v("--pt-t-w")) || def.w || 1.6,
    op: parseFloat(v("--pt-t-op")) || def.op || 1
  };
}
var toolKey = (t) => `${t.kind}|${t.color}|${t.w}|${t.op}`;
var grainy = (t) => t.kind === "graphite" || t.kind === "pencil";
function toolDefs(t, id = "pg") {
  if (!grainy(t)) return "";
  return `<filter id="${id}" x="-10%" y="-30%" width="120%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="1.3 .9" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -.55" result="a"/><feComposite in="SourceGraphic" in2="a" operator="in"/></filter>`;
}
function passes(t, nonScaling) {
  const w = t.w;
  switch (t.kind) {
    case "ballpoint":
      return [[0, 0, 1, 0.95]];
    case "brush":
      return [[0, 0, 1, 0.78], [0.35, -0.25, 0.5, 1]];
    case "marker":
      return [[0, 0, 1, 0.86]];
    case "graphite":
    case "pencil":
      return [[0, 0, 1, 0.75], [0.4, 0.3, 0.7, 0.55]];
    default: {
      const n = w * 0.34, cx = nonScaling ? 0 : Math.cos(0.7) * n, cy = Math.sin(0.7) * n;
      return [[0, 0, 0.82, 0.9], [-cx, cy, 0.42, 0.62], [cx, -cy, 0.42, 0.62]];
    }
  }
}
function ends(d) {
  const out = [];
  for (const sub of d.split(/(?=M)/)) {
    const n = sub.match(/-?\d*\.?\d+/g);
    if (n && n.length >= 4) out.push([+n[0], +n[1]], [+n[n.length - 2], +n[n.length - 1]]);
  }
  return out;
}
function inkPath(d, t, opts = {}) {
  const w = t.w * (opts.scale || 1), c = t.color, op = t.op * (opts.op || 1);
  const base2 = `fill="none" stroke="${c}" stroke-linecap="round" stroke-linejoin="round"${opts.nonScaling ? ' vector-effect="non-scaling-stroke"' : ""}`;
  const dash = t.kind === "ballpoint" ? ` stroke-dasharray="${opts.dash || "38 1.1 61 .7 23 1.4"}"` : "";
  let out = passes({ ...t, w }, opts.nonScaling).map(([dx, dy, k, o]) => `<path d="${d}" ${base2} stroke-width="${f(w * k)}" stroke-opacity="${f(op * o * 100) / 100}"${dash}${dx || dy ? ` transform="translate(${f(dx)} ${f(dy)})"` : ""}/>`).join("");
  if (t.kind === "marker") out = `<g style="mix-blend-mode:multiply">${out}</g>`;
  if (t.kind === "pen" && !opts.nonScaling && op > 0.5) {
    out += ends(d).slice(0, 24).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(w * 0.55)}" fill="${c}" fill-opacity="${f(op * 55) / 100}"/>`).join("");
  }
  return grainy(t) && !opts.noFilter ? `<g filter="url(#${opts.filterId || "pg"})">${out}</g>` : out;
}
function inkFill(d, t, opts = {}) {
  const fill2 = `<path d="${d}" fill="${t.color}" fill-opacity="${f(t.op * (t.kind === "marker" ? 0.86 : 1) * 100) / 100}"/>`;
  return grainy(t) && !opts.noFilter ? `<g filter="url(#${opts.filterId || "pg"})">${fill2}</g>` : fill2;
}

// src/js/shapes.js
function band(w, h, r, o) {
  const n = Math.max(4, Math.round(w / 34)), top = [], bot = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = o.x0 + (o.x1 - o.x0) * u, bow = Math.sin(Math.PI * u) * o.bow;
    let ty = h * (o.t0 + (o.t1 - o.t0) * u) - bow + (r() - 0.5) * 1.3;
    let by = h * (o.b0 + (o.b1 - o.b0) * u) - bow * 0.6 + (r() - 0.5) * 1.3;
    if (o.taper && u > 0.62) {
      const k = (u - 0.62) / 0.38, mid = (ty + by) / 2 - k * h * 0.1;
      ty += (mid - ty) * k * 0.8;
      by += (mid - by) * k * 0.8;
    }
    top.push([x, ty]);
    bot.push([x, by]);
  }
  const te = top[n], be = bot[n], ts = top[0], bs = bot[0], hg = be[1] - te[1], my = (ts[1] + bs[1]) / 2;
  return curve(top, true) + ` C${f(te[0] + 3)} ${f(te[1] + hg * 0.25)} ${f(be[0] + 2.5)} ${f(be[1] - hg * 0.3)} ${f(be[0])} ${f(be[1])}` + curve(bot.slice().reverse(), false) + ` L${f(bs[0] + 1.5)} ${f(bs[1] - 2.5)} L${f(ts[0] - 1 - r() * 2)} ${f(my + 2 + r() * 3)} L${f(ts[0] + 2)} ${f(my - 1)} L${f(ts[0] + 0.5)} ${f(ts[1] + 2)} Z`;
}
var fill = (d, op) => `<path d="${d}" fill="url(#g)" fill-opacity="${op}"/>`;
var HIGHLIGHT = {
  swipe: (w, h, r) => [fill(band(w, h, r, { t0: 0.2, t1: 0.1, b0: 0.9, b1: 0.8, x0: 3 + r() * 3, x1: w - 3, bow: 2.4 }), 1)],
  // pressed hard at the start, lifted off at the end
  flick: (w, h, r) => [fill(band(w, h, r, { t0: 0.22, t1: 0.1, b0: 0.9, b1: 0.76, x0: 2, x1: w - 1, bow: 1.4, taper: true }), 1)],
  double: (w, h, r) => [
    fill(band(w, h, r, { t0: 0.1, t1: 0.04, b0: 0.66, b1: 0.58, x0: 2, x1: w - 8 - r() * 6, bow: 2 }), 0.72),
    fill(band(w, h, r, { t0: 0.4, t1: 0.32, b0: 0.97, b1: 0.9, x0: 10 + r() * 10, x1: w - 2, bow: 1.4 }), 0.72)
  ],
  low: (w, h, r) => [fill(band(w, h, r, { t0: 0.54, t1: 0.47, b0: 0.99, b1: 0.93, x0: 2, x1: w - 2, bow: 1 }), 1)],
  // a felt tip running dry: full where it lands, then the felt splits into long streaks
  // with paper showing between them; the outer streaks give out first
  dry: (w, h, r) => {
    const shape = band(w, h, r, { t0: 0.18, t1: 0.12, b0: 0.88, b1: 0.8, x0: 2, x1: w - 3, bow: 1.6 });
    const top = h * 0.15, bot = h * 0.86, n = Math.max(6, Math.round((bot - top) / 2.6)), pitch = (bot - top) / n;
    let streaks = "";
    for (let i = 0; i < n; i++) {
      const edge = Math.abs((i + 0.5) / n - 0.5) * 2;
      const end = w * Math.min(1, 0.55 + r() * 0.45 + (1 - edge) * 0.3);
      const y0 = top + pitch * (i + 0.5) + (r() - 0.5) * pitch * 0.3;
      const th = pitch * (0.55 + r() * 0.4);
      const pts = [], k = Math.max(3, Math.round(end / 26));
      for (let j = 0; j <= k; j++) {
        const u = j / k, x = 2 + (end - 2) * u;
        pts.push([x, y0 - u * h * 0.06 + (r() - 0.5) * 0.5, th * (1 - u * u * 0.5)]);
      }
      const brk = r() < 0.5 ? 0.55 + r() * 0.35 : 2;
      const seg = (from, to) => {
        const p = pts.filter((_, j) => j / k >= from && j / k <= to);
        if (p.length < 2) return "";
        const up = p.map((q) => [q[0], q[1] - q[2] / 2]), dn = p.map((q) => [q[0], q[1] + q[2] / 2]).reverse();
        return "M" + up.concat(dn).map((q) => f(q[0]) + " " + f(q[1])).join(" L") + "Z ";
      };
      streaks += `<path d="${brk < 1 ? seg(0, brk) + seg(brk + 0.06, 1) : seg(0, 1)}" fill="url(#g)" fill-opacity="${f((0.72 + r() * 0.28) * 100) / 100}"/>`;
    }
    let head = "";
    for (let i = 0; i <= n; i++) {
      const y = top + pitch * i + (r() - 0.5) * 0.4, len = w * (0.06 + r() * 0.22), th = pitch * 0.75;
      head += `<path d="M2 ${f(y - th / 2)} L${f(len)} ${f(y - len / w * h * 0.06)} L2 ${f(y + th / 2)}Z" fill="url(#g)" fill-opacity=".8"/>`;
    }
    return [
      `<clipPath id="dc"><path d="${shape}"/></clipPath>`,
      `<g clip-path="url(#dc)"><path d="${shape}" fill="url(#g)" fill-opacity=".14"/>${head}${streaks}</g>`
    ];
  },
  scribble: (w, h, r) => {
    const out = [], sw = h * 0.26;
    let x = 4 + r() * 3, up = true, prev = [x, h * (0.78 + r() * 0.12)];
    while (x < w - 6) {
      x = Math.min(w - 4, x + 5 + r() * 8);
      const next = [x, up ? h * (0.12 + r() * 0.14) : h * (0.76 + r() * 0.16)];
      const cx = (prev[0] + next[0]) / 2 + (r() - 0.5) * 6, cy = (prev[1] + next[1]) / 2 + (r() - 0.5) * 5;
      out.push(`<path d="M${f(prev[0])} ${f(prev[1])} Q${f(cx)} ${f(cy)} ${f(next[0])} ${f(next[1])}" fill="none" stroke="url(#g)" stroke-width="${f(sw)}" stroke-linecap="round" stroke-opacity=".72"/>`);
      prev = next;
      up = !up;
    }
    return out;
  }
};
var POOL_Y = { low: "76%", double: "62%" };
var HEAVY_START = /* @__PURE__ */ new Set(["flick", "dry"]);
var secondPass = (style, w, h, r) => style === "scribble" ? HIGHLIGHT.scribble(w, h, r) : [fill(band(w, h, r, { t0: style === "low" ? 0.6 : 0.32, t1: style === "low" ? 0.55 : 0.26, b0: 0.8, b1: 0.74, x0: w * 0.16, x1: w - 4, bow: 1.4 }), 1)];
var gradient = (w, color, heavyStart) => {
  const stops = heavyStart ? [[0, 1], [0.12, 1], [0.5, 0.86], [0.86, 0.66], [1, 0.48]] : [[0, 0.5], [0.14, 0.72], [0.5, 0.87], [0.86, 1], [1, 1]];
  return `<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${f(w)}" y2="0">` + stops.map(([o, a]) => `<stop offset="${o}" stop-color="${color}" stop-opacity="${a}"/>`).join("") + "</linearGradient></defs>";
};
function hatchD(x, y, w, h, r, gap = 5, angle = 1) {
  let d = "";
  const lo = Math.min(0, -h * angle) - 4, hi = w + Math.max(0, -h * angle) + 4;
  for (let k = lo; k < hi; ) {
    const a = angle * (1 + (r() - 0.5) * 0.3), x0 = x + k + (r() - 0.5) * 1.5;
    const s = r() < 0.3 ? r() * 0.25 : 0, e = r() < 0.3 ? 1 - r() * 0.25 : 1;
    const p0 = [x0 + h * a * s, y + h - h * s], p1 = [x0 + h * a * e, y + h - h * e];
    d += stroke(p0, p1, r, 0.8, 1.6) + " ";
    if (r() < 0.1) d += stroke([p0[0] + 1.2, p0[1]], [p1[0] + 1.4, p1[1]], r, 0.4, 1) + " ";
    k += gap * (0.55 + r() * 0.95);
  }
  return d;
}
function scribbleD(x, y, w, h, r, step = 6) {
  const pts = [];
  let t = x - 2, up = r() < 0.5;
  while (t < x + w + 2) {
    pts.push([t, up ? y + h * (r() * 0.15) : y + h * (1 - r() * 0.15)]);
    t += step * (0.6 + r() * 0.8);
    up = !up;
  }
  return curve(pts, true);
}
function stippleD(x, y, w, h, r, density2 = 0.1) {
  let d = "";
  const n = Math.round(w * h * density2 / 10);
  for (let i = 0; i < n; i++) {
    const px = x + r() * w, py = y + r() * h;
    d += `M${f(px)} ${f(py)} h.01 `;
  }
  return d;
}
function pencilD(x, y, w, h, r) {
  const rh = Math.max(6, Math.min(h + 2, 13)), rows = Math.max(1, Math.ceil((h + 2) / (rh * 0.7)));
  let d = "";
  for (let i = 0; i < rows; i++) {
    const y0 = y - 1 + i * rh * 0.7 + (r() - 0.5) * 1.5, y1 = y0 + rh;
    let t = x - 4 - r() * 3, up = r() < 0.5, pts = "";
    while (t < x + w + 4) {
      pts += `${pts ? " L" : "M"}${f(t + (up ? 2.5 : 0))} ${f((up ? y0 : y1) + (r() - 0.5) * 2)}`;
      t += 0.9 + r() * 1.1;
      up = !up;
    }
    d += pts + " ";
  }
  return d;
}
function swipesD(x, y, w, h, r) {
  if (h > w * 1.15) return swipesAt(x + w / 2, y + h / 2, h, w, Math.PI / 2, r);
  return rowsOfSwipes(x, y, w, h, r);
}
function rowsOfSwipes(x, y, w, h, r) {
  const bh = Math.max(8, Math.min(15, h + 4)), n = Math.max(1, Math.ceil((h + 4 - bh) / (bh * 0.72)) + 1);
  const step = n > 1 ? (h + 4 - bh) / (n - 1) : 0, out = [];
  for (let i = 0; i < n; i++) {
    const oy = y - 2 + (n > 1 ? i * step : (h - bh) / 2), ox = x - 3 - r() * 3, sw = w + 6 + r() * 4;
    out.push(band(sw, bh, r, { t0: 0.1, t1: 0.05, b0: 0.94, b1: 0.9, x0: 1, x1: sw - 1, bow: 0.8 }).replace(/(-?[\d.]+) (-?[\d.]+)/g, (m, a, b) => `${f(+a + ox)} ${f(+b + oy)}`));
  }
  return out;
}
function swipesAt(cx, cy, len, wid, angle, r) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return rowsOfSwipes(-len / 2, -wid / 2, len, wid, r).map((d) => d.replace(/(-?[\d.]+) (-?[\d.]+)/g, (m, a, b) => `${f(cx + a * c - b * s)} ${f(cy + a * s + b * c)}`));
}
var FILLS = {
  hatch: (x, y, w, h, r) => hatchD(x, y, w, h, r, 5, 1),
  cross: (x, y, w, h, r) => hatchD(x, y, w, h, r, 6, 1) + hatchD(x, y, w, h, r, 7, -1.1),
  scribble: (x, y, w, h, r) => scribbleD(x, y, w, h, r, 5),
  stipple: (x, y, w, h, r) => stippleD(x, y, w, h, r, 0.9),
  pencil: pencilD
};
function sketchBox(w, h, r, gaps) {
  const x0 = 4, y0 = 7, x1 = w - 4, y1 = h - 7;
  const c = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map((p) => jit(p, r, 2.4));
  let d = "";
  for (let i = 0; i < 4; i++) {
    const a = c[i], b = c[(i + 1) % 4];
    if (!gaps) {
      d += stroke(a, b, r, 3.5, 3) + " ";
      continue;
    }
    const n = 1 + (r() < 0.6 ? 1 : 0), cuts = [0];
    for (let k = 1; k <= n; k++) cuts.push(k / (n + 1) + (r() - 0.5) * 0.15);
    cuts.push(1);
    const p = (u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    for (let k = 0; k < cuts.length - 1; k++) {
      d += stroke(p(cuts[k] + (k ? 0.02 : 0)), p(cuts[k + 1] - (k < cuts.length - 2 ? 0.02 : 0)), r, k ? 0.5 : 2.5, 1.6) + " ";
    }
  }
  return d;
}
function loop(w, h, r, pad) {
  const cx = w / 2 + (r() - 0.5) * 3, cy = h / 2, rx = w / 2 - pad, ry = h / 2 - pad - 0.5;
  const t0 = Math.PI * (0.85 + r() * 0.25), sweep = Math.PI * 2 * (1.08 + r() * 0.08), ph = r() * 6, tilt = (r() - 0.5) * 0.06, pts = [];
  for (let t = 0; t <= sweep; t += 0.08) {
    const u = t / sweep, k = 1 + 0.04 * Math.sin(3 * t + ph) - 0.08 * u;
    const ex = Math.cos(t0 + t) * rx * k, ey = Math.sin(t0 + t) * ry * (k + 0.05 * u);
    pts.push(`${f(cx + ex - ey * tilt)} ${f(cy + ey + ex * tilt - u * 1.5)}`);
  }
  return "M" + pts.join(" L");
}
var BRACKET = {
  square: (x, y0, y1, dir, arm) => [[x + dir * arm, y0 + 0.5], [x + 0.3 * dir, y0], [x, (y0 + y1) / 2], [x + 0.3 * dir, y1], [x + dir * arm, y1 - 0.5]],
  round: (x, y0, y1, dir, arm) => [[x + dir * arm, y0], [x + dir * arm * 0.2, y0 + (y1 - y0) * 0.2], [x, (y0 + y1) / 2], [x + dir * arm * 0.2, y1 - (y1 - y0) * 0.2], [x + dir * arm, y1]],
  curly: (x, y0, y1, dir, arm) => {
    const m = (y0 + y1) / 2;
    return [[x + dir * arm, y0], [x + dir * arm * 0.35, y0 + 3], [x + dir * arm * 0.35, m - 5], [x - dir * arm * 0.15, m], [x + dir * arm * 0.35, m + 5], [x + dir * arm * 0.35, y1 - 3], [x + dir * arm, y1]];
  },
  angle: (x, y0, y1, dir, arm) => [[x + dir * arm, y0], [x, (y0 + y1) / 2], [x + dir * arm, y1]]
};
function bracketPair(kind, w, h, r, t) {
  const y0 = 5 + r() * 2, y1 = h - 5 - r() * 2, arm = Math.min(10, h * 0.28) + r() * 3;
  const side = (x, dir) => {
    const pts = BRACKET[kind](x, y0, y1, dir, kind === "curly" ? arm * 1.1 : arm).map((p) => jit(p, r, 1.4));
    pts.unshift([pts[0][0] + dir * (1 + r() * 2), pts[0][1] - (r() - 0.3) * 1.5]);
    return kind === "square" || kind === "angle" ? "M" + pts.map((p) => p.map(f).join(" ")).join(" L") : curve(pts, true);
  };
  const d = side(5, 1) + " " + side(w - 5, -1);
  const again = side(5.6, 1) + " " + side(w - 5.4, -1);
  return inkPath(d, t) + inkPath(again, t, { op: 0.35, scale: 0.7 });
}
function kagi(w, h, r, t) {
  const a = Math.min(14, w * 0.16), b = Math.min(12, h * 0.4);
  const tl = [[5 + a, 6], [5, 6.3], [5.3, 6 + b]].map((p) => jit(p, r, 1.2));
  const br = [[w - 5 - a, h - 6], [w - 5, h - 6.3], [w - 5.3, h - 6 - b]].map((p) => jit(p, r, 1.2));
  const pl = (q) => "M" + q.map((p) => p.map(f).join(" ")).join(" L");
  return inkPath(pl(tl) + " " + pl(br), t) + inkPath(pl(tl.map((p) => [p[0] + 0.6, p[1] + 0.5])) + " " + pl(br.map((p) => [p[0] - 0.5, p[1] - 0.6])), t, { op: 0.35, scale: 0.7 });
}
function lenticular(w, h, r, t) {
  const side = (x, dir) => {
    const y0 = 5, y1 = h - 5, m = (y0 + y1) / 2, k = 5 + r();
    return `M${f(x + dir * 7)} ${f(y0)} L${f(x)} ${f(y0 + 0.5)} L${f(x - dir * 0.3)} ${f(y1 - 0.5)} L${f(x + dir * 7)} ${f(y1)} Q${f(x + dir * (k - 1))} ${f(m)} ${f(x + dir * 7)} ${f(y0)} Z`;
  };
  return inkFill(side(5, 1) + " " + side(w - 5, -1), t);
}
var broken = (w, h, r, t) => inkPath(sketchBox(w, h, r, true), t);
var OUTLINE = {
  sketch: (w, h, r, t) => inkPath(sketchBox(w, h, r), t),
  double: (w, h, r, t) => inkPath(sketchBox(w, h, r), t) + inkPath(sketchBox(w, h, r), t, { op: 0.55, scale: 0.8 }),
  broken,
  pencil: broken,
  circled: (w, h, r, t) => inkPath(loop(w, h, r, 4), t),
  corners: (w, h, r, t) => {
    const x0 = 4, y0 = 7, x1 = w - 4, y1 = h - 7, lx = Math.min(16, w * 0.15), ly = 10;
    const L = (p, ax, ay) => {
      const q = jit(p, r, 1.6);
      return stroke([q[0] + ax * lx, q[1] + (r() - 0.5)], q, r, 1.5, 1.5) + " " + stroke(q, [q[0] + (r() - 0.5), q[1] + ay * ly], r, 1.5, 1.2);
    };
    return inkPath([L([x0, y0], 1, 1), L([x1, y0], -1, 1), L([x1, y1], -1, -1), L([x0, y1], 1, -1)].join(" "), t);
  },
  brackets: (w, h, r, t) => bracketPair("square", w, h, r, t),
  parens: (w, h, r, t) => bracketPair("round", w, h, r, t),
  braces: (w, h, r, t) => bracketPair("curly", w, h, r, t),
  angles: (w, h, r, t) => bracketPair("angle", w, h, r, t),
  kagi: (w, h, r, t) => kagi(w, h, r, t),
  lenticular: (w, h, r, t) => lenticular(w, h, r, t)
};
function wobble(x0, x1, y, r, amp = 1.6) {
  const n = Math.max(3, Math.round((x1 - x0) / 60)), pts = [];
  for (let i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, y + (r() - 0.5) * amp * 2 - i / n * (r() - 0.4) * 1.5]);
  return curve(pts, true);
}
var RULE = {
  wobble: (w, h, r, t) => inkPath(wobble(2, w - 2, h / 2, r), t),
  short: (w, h, r, t) => inkPath(wobble(2, w - 2, h / 2, r, 1.2), t),
  double: (w, h, r, t) => inkPath(wobble(2, w - 2, h / 2 - 2.6, r, 1) + " " + wobble(5, w - 4, h / 2 + 2.6, r, 1), t),
  dashes: (w, h, r, t) => {
    let d = "", x = 3;
    while (x < w - 6) {
      const len = 9 + r() * 8;
      d += wobble(x, Math.min(w - 3, x + len), h / 2 + (r() - 0.5) * 1.2, r, 0.5) + " ";
      x += len + 7 + r() * 6;
    }
    return inkPath(d, t);
  },
  brush: (w, h, r, t) => {
    const n = Math.max(8, Math.round(w / 22)), top = [], bot = [], ph = r() * 6, c0 = h / 2 + (r() - 0.5) * 2, k = t.w / 1.3;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = 3 + (w - 6) * u;
      const y = c0 + Math.sin(u * 5.3 + ph) * 1.1 + Math.sin(u * 13 + ph * 2) * 0.4 - u * 1.2;
      const th = (0.5 + 2.1 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 0.55)) * (0.85 + r() * 0.3) * k;
      top.push([x, y - th / 2]);
      bot.push([x, y + th / 2]);
    }
    return inkFill(`${curve(top, true)} L${f(bot[n][0])} ${f(bot[n][1])}${curve(bot.slice().reverse(), false)} Z`, t);
  },
  coil: (w, h, r, t) => {
    const a = 15 / (2 * Math.PI), p1 = r() * 6, p2 = r() * 6, pts = [], T = (w - 10) / a;
    for (let s = 0; s <= T; s += 0.22) {
      const env = Math.min(1, s / 4, (T - s) / 4);
      const b = (4 + 1.6 * Math.sin(s * 0.31 + p1) + 0.9 * Math.sin(s * 0.83 + p2)) * env;
      pts.push(`${f(5 + a * s - b * Math.sin(s))} ${f(h / 2 + 1 - b * 0.9 * Math.cos(s) + Math.sin(s * 0.12 + p1) * 1.4)}`);
    }
    return inkPath("M" + pts.join(" L"), t);
  },
  scrawl: (w, h, r, t) => {
    const pts = [];
    let x = 3, s = 1;
    while (x < w - 3) {
      const amp = (0.6 + r() * 3.4) * Math.min(1, x / 30, (w - x) / 30 + 0.2);
      pts.push([x, h / 2 + s * amp + (r() - 0.5)]);
      x += 4 + r() * 9;
      if (r() < 0.88) s = -s;
    }
    pts.push([w - 3, h / 2]);
    return inkPath(curve(pts, true), t);
  }
};
var LINK = {
  wobble: (r) => `M1 ${f(6 + r())} C ${f(30 + r() * 10)} ${f(3.5 + r())}, ${f(62 + r() * 10)} ${f(8 + r())}, 100 ${f(5.5 + r())} S ${f(165 + r() * 10)} ${f(3 + r())}, 199 ${f(6.5 + r())}`,
  slant: (r) => `M1 ${f(8.5 + r())} C 40 ${f(7.5 + r())}, 120 ${f(5.5 + r())}, 199 ${f(2.5 + r())}`,
  double: (r) => `M1 ${f(3.5 + r())} C 50 2, 120 ${f(4.5 + r())}, 199 3 M6 ${f(9 + r() * 0.8)} C 60 10, 130 ${f(7 + r())}, 194 ${f(9.5 + r() * 0.5)}`,
  swash: (r) => `M1 6 C 50 ${f(8.5 + r())}, 120 ${f(7.5 + r())}, 178 7 C 192 6, 198 3, 199 1`,
  marker: (r) => `M3 8 C 50 ${f(5.5 + r())}, 140 ${f(6.5 + r())}, 197 5`,
  second: (r) => `M5 10 C 60 ${f(10.5 + r() * 0.5)}, 112 ${f(7 + r())}, 196 9`
};
var STRIKE = {
  line: (r) => `M1 ${f(6.5 + r())} C 50 ${f(5 + r())}, 130 ${f(7 + r())}, 199 ${f(5 + r())}`,
  double: (r) => LINK.double(r),
  scribble: (r) => {
    let d = `M1 ${f(5 + r() * 2)}`, x = 1, up = true;
    while (x < 196) {
      x = Math.min(199, x + 2.5 + r() * 3);
      d += ` L${f(x)} ${f(up ? 0.5 + r() * 2 : 9.5 + r() * 2)}`;
      up = !up;
    }
    return d;
  }
};
var WAVE_W = 150;
function waveD(r) {
  const n = 16, lens = Array.from({ length: n }, () => 0.75 + r() * 0.5), sum = lens.reduce((a, b) => a + b, 0);
  let x = 0, y = 4.5, d = "M0 4.5", up = true;
  lens.forEach((l, i) => {
    const L = l / sum * WAVE_W, A = 1.6 + r() * 1.7, ny = i === n - 1 ? 4.5 : 4.5 + (r() - 0.5) * 0.8, dir = up ? -1 : 1;
    d += ` C${f(x + L * (0.3 + r() * 0.1))} ${f(y + dir * A * 1.3)} ${f(x + L * (0.6 + r() * 0.1))} ${f(ny + dir * A * 1.3)} ${f(x + L)} ${f(ny)}`;
    x += L;
    y = ny;
    up = !up;
  });
  return d;
}
var ANNO = {
  circle: (w, h, r) => loop(w, h, r, 2),
  box: (w, h, r) => {
    const c = [[2, 2], [w - 2, 2], [w - 2, h - 2], [2, h - 2]].map((p) => jit(p, r, 2));
    return c.map((a, i) => stroke(a, c[(i + 1) % 4], r, 3, 2.5)).join(" ");
  },
  strike: (w, h, r) => stroke([2, h * 0.6], [w - 2, h * 0.44], r, 2, 3),
  under: (w, h, r) => stroke([1, h * 0.35], [w - 1, h * 0.22], r, 2, 2) + " " + stroke([5, h * 0.82], [w - 4, h * 0.7], r, 2, 2),
  cross: (w, h, r) => {
    const pts = [];
    let x = 2, up = true;
    while (x < w - 2) {
      pts.push([x, up ? h * (0.18 + r() * 0.1) : h * (0.78 + r() * 0.12)]);
      x += 2.5 + r() * 3;
      up = !up;
    }
    pts.push([w - 2, h * 0.5]);
    return curve(pts, true);
  },
  hatch: (w, h, r) => hatchD(0, 0, w, h, r, 3.6, 0.6),
  hanamaru: (w, h, r) => {
    const cx = w / 2, cy = h / 2, rx = w / 2 - 3, ry = h / 2 - 3, pts = [];
    const t0 = Math.PI * (0.9 + r() * 0.2), spin = Math.PI * 3.1;
    for (let t = 0; t <= spin; t += 0.09) {
      const k = 0.2 + 0.6 * (t / spin);
      pts.push([cx + Math.cos(t0 + t) * rx * k, cy + Math.sin(t0 + t) * ry * k]);
    }
    const n = 7 + Math.floor(r() * 2), b = t0 + spin;
    for (let t = 0; t <= Math.PI * 2.08; t += 0.035) {
      const k = 0.8 + 0.22 * Math.pow(Math.abs(Math.sin(n * t / 2)), 0.7);
      pts.push([cx + Math.cos(b + t) * rx * k, cy + Math.sin(b + t) * ry * k]);
    }
    return "M" + pts.map((q) => f(q[0]) + " " + f(q[1])).join(" L");
  }
};
var SEI = [[[0, 0], [1, 0]], [[0.5, 0], [0.5, 1]], [[0.5, 0.5], [0.88, 0.5]], [[0.14, 0.46], [0.14, 1]], [[-0.04, 1], [1.04, 1]]];
function progressFill(style, x, y, w, h, r, t, o) {
  if (style === "highlight") return `<g style="mix-blend-mode:multiply">${swipesD(x, y, w, h, r).map((d2) => `<path d="${d2}" fill="${o.hl || "#fff04a"}" fill-opacity=".62"/>`).join("")}</g>`;
  if (style === "pencil") return `<defs>${toolDefs({ kind: "graphite" }, "pg2")}</defs>${inkPath(pencilD(x, y, w, h, r), { ...t, kind: "graphite" }, { scale: 0.5, op: 0.5, filterId: "pg2" })}`;
  const d = FILLS[style] ? FILLS[style](x, y, w, h, r) : hatchD(x, y, w, h, r, 4, 1);
  return inkPath(d, t, { scale: style === "scribble" ? 1.2 : style === "stipple" ? 1.4 : 0.7, op: 0.8 });
}
function progressSVG(shape, style, w, h, r, t, v, o = {}) {
  const val = Math.max(0, Math.min(1, v));
  let out = "";
  const box = (x, y, bw2, bh) => {
    const c = [[x, y], [x + bw2, y], [x + bw2, y + bh], [x, y + bh]].map((p) => jit(p, r, 1.2));
    return c.map((a, i) => stroke(a, c[(i + 1) % 4], r, 2, 1.6)).join(" ");
  };
  if (shape === "ring") {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 6;
    out += inkPath(loop(2 * R + 8, 2 * R + 8, r, 4).replace(/(-?[\d.]+) (-?[\d.]+)/g, (m, x, y) => `${f(+x + cx - R - 4)} ${f(+y + cy - R - 4)}`), t, { op: 0.35, scale: 0.8 });
    if (val > 0) {
      const pts = [], end = val * Math.PI * 2;
      for (let a = 0; a <= end + 1e-6; a += 0.12) pts.push([cx + Math.cos(a - Math.PI / 2) * (R - (r() - 0.5) * 0.8), cy + Math.sin(a - Math.PI / 2) * (R - (r() - 0.5) * 0.8)]);
      pts.push([cx + Math.cos(end - Math.PI / 2) * R, cy + Math.sin(end - Math.PI / 2) * R]);
      out += inkPath(curve(pts, true), t, { scale: 2.6 });
    }
    return out;
  }
  if (shape === "tally" || shape === "sei") {
    const total = o.max || 20, count = Math.round(val * total), groups = Math.ceil(total / 5), gw = w / groups;
    let d = "";
    for (let g = 0; g < groups; g++) {
      const n = Math.max(0, Math.min(5, count - g * 5)), x0 = g * gw + gw * 0.14, cw = gw * 0.64, y0 = 4, ch = h - 8;
      if (shape === "tally") {
        for (let i = 0; i < Math.min(4, n); i++) {
          const x = x0 + cw * (i + 0.5) / 4;
          d += stroke([x + (r() - 0.5), y0 + r()], [x + (r() - 0.5) * 1.5, y0 + ch - r()], r, 1, 1.2) + " ";
        }
        if (n === 5) d += stroke([x0 - 2, y0 + ch * 0.7], [x0 + cw + 2, y0 + ch * 0.25], r, 1.5, 1.5) + " ";
      } else {
        for (let i = 0; i < n; i++) {
          const [p, q] = SEI[i];
          d += stroke([x0 + p[0] * cw, y0 + p[1] * ch], [x0 + q[0] * cw, y0 + q[1] * ch], r, 0.6, 1) + " ";
        }
      }
    }
    return inkPath(d, t);
  }
  if (shape === "boxes" || shape === "circles") {
    const n = o.segments || 10, gap = 4, sw = (w - 8 - gap * (n - 1)) / n, sh = Math.min(h - 8, shape === "circles" ? sw : h - 8), y = (h - sh) / 2;
    const filled = Math.round(val * n);
    let outline = "", clip = "";
    for (let i = 0; i < n; i++) {
      const x = 4 + i * (sw + gap);
      if (shape === "circles") {
        outline += loop(sw + 2, sh + 2, r, 1).replace(/(-?[\d.]+) (-?[\d.]+)/g, (m, a, b) => `${f(+a + x - 1)} ${f(+b + y - 1)}`) + " ";
        if (i < filled) clip += `<ellipse cx="${f(x + sw / 2)}" cy="${f(y + sh / 2)}" rx="${f(sw / 2)}" ry="${f(sh / 2)}"/>`;
      } else {
        outline += box(x, y, sw, sh) + " ";
        if (i < filled) clip += `<rect x="${f(x)}" y="${f(y)}" width="${f(sw)}" height="${f(sh)}"/>`;
      }
    }
    if (filled) out += `<clipPath id="pcells">${clip}</clipPath><g clip-path="url(#pcells)">${progressFill(style, 4, y, filled * (sw + gap), sh, r, t, o)}</g>`;
    return out + inkPath(outline, t, { op: 0.6, scale: 0.8 });
  }
  const bw = w - 6, fillW = bw * val;
  out += `<clipPath id="pc"><rect x="3" y="0" width="${f(Math.max(0, fillW))}" height="${f(h)}"/></clipPath>`;
  if (style === "highlight") out += `<g clip-path="url(#pc)">${gradient(w, o.hl || "#fff04a")}<path d="${band(w - 4, h - 6, r, { t0: 0.12, t1: 0.08, b0: 0.92, b1: 0.86, x0: 2, x1: w - 6, bow: 1 })}" transform="translate(2 3)" fill="url(#g)" fill-opacity=".9" style="mix-blend-mode:multiply"/></g>`;
  else out += `<g clip-path="url(#pc)">${progressFill(style, 3, 3, bw, h - 6, r, t, o)}</g>`;
  out += inkPath(box(2, 2, w - 4, h - 4), t);
  return out;
}
var SWATCH = {
  fountain: (w, h, r, c) => {
    const n = 16, top = [], bot = [], ph = r() * 6;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = 4 + (w - 12) * u, cy = h / 2 + Math.sin(u * 4.4 + ph) * 3 - u * 3;
      const th = (2.5 + 11 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08)), 0.6)) * (0.9 + r() * 0.2);
      top.push([x, cy - th / 2]);
      bot.push([x, cy + th / 2]);
    }
    const d = `${curve(top, true)} L${f(bot[n][0])} ${f(bot[n][1])}${curve(bot.slice().reverse(), false)} Z`;
    const e = top[n - 1], eb = bot[n - 1];
    return `<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${c}" stop-opacity=".5"/><stop offset=".45" stop-color="${c}" stop-opacity=".72"/><stop offset=".9" stop-color="${c}" stop-opacity=".92"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><path d="${d}" fill="url(#g)"/><path d="${d}" fill="none" stroke="${c}" stroke-opacity=".45" stroke-width=".9"/><ellipse cx="${f(e[0] + 2)}" cy="${f((e[1] + eb[1]) / 2)}" rx="3" ry="${f(Math.max(2, (eb[1] - e[1]) / 2))}" fill="${c}" fill-opacity=".55"/>`;
  },
  ballpoint: (w, h, r, c) => {
    const a = 10 / (2 * Math.PI), T = (w - 12) / a, pts = [], blobs = [];
    for (let t = 0; t <= T; t += 0.2) {
      const b = 5.5 + 1.5 * Math.sin(t * 0.5), x = 6 + a * t - b * 0.9 * Math.sin(t), y = h / 2 - b * 1.4 * Math.cos(t);
      pts.push(`${f(x)} ${f(y)}`);
      if (r() < 0.025) blobs.push(`<circle cx="${f(x)}" cy="${f(y)}" r="1.1" fill="${c}"/>`);
    }
    return `<path d="M${pts.join(" L")}" fill="none" stroke="${c}" stroke-width="1.15" stroke-opacity=".9" stroke-linecap="round"/>` + blobs.join("");
  },
  pencil: (w, h, r, c) => {
    let d = "";
    for (let x = 2; x < w - 16; x += 2.4 + r() * 1.4) d += `M${f(x + r() * 2)} ${f(h - 4 - r() * 3)} L${f(x + 14 + r() * 3)} ${f(4 + r() * 3)} `;
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.4" stroke-opacity=".8" stroke-linecap="round"/>`;
  }
};
function spiral(r) {
  const pts = [], turns = 2.2 + r() * 0.6, ph = r() * 6, T = turns * Math.PI * 2;
  for (let a = 0; a <= T; a += 0.35) {
    const k = 1 - a / T;
    pts.push([12 + Math.cos(a + ph) * (1 + 7 * k) + (r() - 0.5), 12 + Math.sin(a + ph) * (1 + 6.6 * k) + (r() - 0.5)]);
  }
  return curve(pts, true);
}
function wobblyBox(r) {
  const c = [[4.5, 5], [19.6, 4.4], [20, 19.6], [4.4, 20]].map((p) => jit(p, r, 1));
  return `M${f(c[0][0])} ${f(c[0][1])} C${f(c[0][0] + 5)} ${f(c[0][1] - 0.5)} ${f(c[1][0] - 5)} ${f(c[1][1] + 0.3)} ${f(c[1][0])} ${f(c[1][1])} C${f(c[1][0] + 0.4)} ${f(c[1][1] + 5)} ${f(c[2][0] - 0.3)} ${f(c[2][1] - 5)} ${f(c[2][0])} ${f(c[2][1])} C${f(c[2][0] - 5)} ${f(c[2][1] + 0.4)} ${f(c[3][0] + 5)} ${f(c[3][1] - 0.3)} ${f(c[3][0])} ${f(c[3][1])} C${f(c[3][0] + 0.3)} ${f(c[3][1] - 5)} ${f(c[0][0] - 0.2)} ${f(c[0][1] + 5)} ${f(c[0][0])} ${f(c[0][1] + 0.6)}`;
}
function wobblyRing(r) {
  const pts = [], ph = r() * 6;
  for (let t = 0; t <= Math.PI * 2.08; t += 0.4) {
    const k = 8.4 + Math.sin(t * 2 + ph) * 0.5;
    pts.push([12 + Math.cos(t - 1.6) * k, 12 + Math.sin(t - 1.6) * k]);
  }
  return curve(pts, true);
}
var TICK = "M7 12.5 L10.6 16.8 L19.5 4.5";
var DOT = "M9.5 12 C 9.4 9.6, 14.6 9.4, 14.6 12 C 14.6 14.6, 9.6 14.8, 9.8 11.6 C 10 10.4, 13.4 10.6, 13.2 12.4";

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
  const base2 = PRINTERS[mode];
  return {
    mode,
    dots: parseInt(el.dataset.dots, 10) || base2.dots,
    dither: el.dataset.dither || base2.dither,
    levels: base2.levels,
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
  const ctx2 = work.getContext("2d", { willReadFrequently: true });
  ctx2.clearRect(0, 0, w, h);
  ctx2.imageSmoothingQuality = "high";
  ctx2.drawImage(img, 0, 0, w, h);
  let src;
  try {
    src = ctx2.getImageData(0, 0, w, h);
  } catch (err) {
    el.classList.add("pt-print--blocked");
    return false;
  }
  const q = dither(luminance(src.data, w, h, p), w, h, p);
  const out = ctx2.createImageData(w, h), d = out.data, max = p.levels - 1;
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
  ctx2.putImageData(out, 0, 0);
  el.src = work.toDataURL("image/png");
  el.classList.add("is-printed");
  return true;
}

// src/js/diagram.js
var esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
var unquote = (s) => s.trim().replace(/^"(.*)"$/, "$1");
var SERIES = ["var(--pt-pen)", "var(--pt-ink-beni)", "var(--pt-ink-wakatake)", "var(--pt-ink-asagi)", "var(--pt-ink-fuji)", "var(--pt-ink-tobi)", "var(--pt-ink-konpeki)"];
var ctx = null;
function measurer(font) {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  return (text) => {
    ctx.font = font;
    return ctx.measureText(text).width;
  };
}
function kindOf(src) {
  const first = src.trim().split(/\n/)[0].trim().toLowerCase();
  if (/^(flowchart|graph)\b/.test(first)) return "flow";
  if (/^pie\b/.test(first)) return "pie";
  if (/^xychart(-beta)?\b/.test(first)) return "xy";
  return null;
}
var SHAPES = [
  ["stadium", /^\(\[(.*?)\]\)/],
  ["cylinder", /^\[\((.*?)\)\]/],
  ["circle", /^\(\((.*?)\)\)/],
  ["subroutine", /^\[\[(.*?)\]\]/],
  ["rect", /^\[(.*?)\]/],
  ["round", /^\((.*?)\)/],
  ["diamond", /^\{(.*?)\}/],
  ["flag", /^>(.*?)\]/]
];
var EDGES = [
  [/^-\.+->/, "dotted", true],
  [/^-\.+-/, "dotted", false],
  [/^==+>/, "thick", true],
  [/^===+/, "thick", false],
  [/^--+>/, "solid", true],
  [/^---+/, "solid", false]
];
var ID_RE = new RegExp("^([\\w\\u00C0-\\uFFFF-]+?)(?=[\\[\\(\\{>]|\\s|$|-|=|&)");
function parseFlow(src) {
  const lines = src.split(/\n|;/).map((l) => l.trim()).filter((l) => l && !l.startsWith("%%"));
  const head = lines.shift() || "";
  const dir = (head.split(/\s+/)[1] || "TD").toUpperCase().replace("TB", "TD");
  const nodes = /* @__PURE__ */ new Map(), edges = [];
  const node = (id, label, shape) => {
    if (!nodes.has(id)) nodes.set(id, { id, label: id, shape: "rect" });
    const n = nodes.get(id);
    if (label != null) {
      n.label = unquote(label).replace(/<br\s*\/?>/gi, "\n");
      n.shape = shape;
    }
    return n;
  };
  for (const line of lines) {
    if (/^(subgraph|end|style|classDef|class|linkStyle|click|direction)\b/.test(line)) continue;
    let rest = line, prev = null, pending = null;
    while (rest.length) {
      const idm = rest.match(ID_RE);
      if (!idm) break;
      const id = idm[1];
      rest = rest.slice(id.length);
      let label = null, shape = "rect";
      for (const [s, re] of SHAPES) {
        const m2 = rest.match(re);
        if (m2) {
          label = m2[1];
          shape = s;
          rest = rest.slice(m2[0].length);
          break;
        }
      }
      const n = node(id, label, shape);
      if (prev && pending) edges.push({ from: prev.id, to: n.id, ...pending });
      prev = n;
      pending = null;
      rest = rest.trimStart();
      if (!rest) break;
      let m = rest.match(/^(--|-\.|==)\s*([^-.=>|][^>]*?)\s*(-->|\.->|==>|---)/);
      if (m) {
        const style = m[1] === "-." ? "dotted" : m[1] === "==" ? "thick" : "solid";
        pending = { style, arrow: m[3] !== "---", label: m[2].trim() };
        rest = rest.slice(m[0].length).trimStart();
        continue;
      }
      let found = false;
      for (const [re, style, arrow] of EDGES) {
        const e = rest.match(re);
        if (e) {
          rest = rest.slice(e[0].length).trimStart();
          let lab = "";
          const lm = rest.match(/^\|([^|]*)\|/);
          if (lm) {
            lab = unquote(lm[1]);
            rest = rest.slice(lm[0].length).trimStart();
          }
          pending = { style, arrow, label: lab };
          found = true;
          break;
        }
      }
      if (!found) break;
    }
  }
  return { dir, nodes, edges };
}
function parsePie(src) {
  const out = { title: "", items: [], showData: false };
  src.split("\n").map((l) => l.trim()).filter(Boolean).forEach((l, i) => {
    if (i === 0) {
      out.showData = /showData/i.test(l);
      const t2 = l.match(/title\s+(.*)$/i);
      if (t2) out.title = t2[1];
      return;
    }
    const t = l.match(/^title\s+(.*)$/i);
    if (t) {
      out.title = t[1];
      return;
    }
    const m = l.match(/^"?(.+?)"?\s*:\s*([\d.]+)/);
    if (m) out.items.push({ label: m[1], value: +m[2] });
  });
  return out;
}
function parseXY(src) {
  const out = { title: "", x: [], xLabel: "", yLabel: "", min: null, max: null, series: [], horizontal: false };
  const list = (s) => s.replace(/^\[|\]$/g, "").split(",").map((v) => unquote(v)).filter((v) => v !== "");
  src.split("\n").map((l) => l.trim()).filter(Boolean).forEach((l, i) => {
    if (i === 0) {
      out.horizontal = /horizontal/i.test(l);
      return;
    }
    let m;
    if (m = l.match(/^title\s+(.*)$/i)) out.title = unquote(m[1]);
    else if (m = l.match(/^x-axis\s*(".*?"|\S+)?\s*(\[.*\])/i)) {
      out.xLabel = m[1] ? unquote(m[1]) : "";
      out.x = list(m[2]);
    } else if (m = l.match(/^y-axis\s*(".*?"|[^\d\s-][^\s]*)?\s*(-?[\d.]+)?\s*(?:-->\s*(-?[\d.]+))?/i)) {
      out.yLabel = m[1] ? unquote(m[1]) : "";
      if (m[2] != null) out.min = +m[2];
      if (m[3] != null) out.max = +m[3];
    } else if (m = l.match(/^(bar|line)\s*(".*?")?\s*(\[.*\])/i)) out.series.push({ type: m[1].toLowerCase(), name: m[2] ? unquote(m[2]) : "", values: list(m[3]).map(Number) });
  });
  return out;
}
function shadeIn(cx, cy, R, mid, span, r) {
  const out = [], a0 = mid - span / 2, dom = mid + Math.PI / 2 + (r() - 0.5) * 0.6;
  const area = span / 2 * R * R, count = Math.ceil(area / 150) + 3;
  const patch = (opMul, angle) => {
    const t = a0 + r() * span, rr = Math.sqrt(r()) * R * 1.02, px = cx + Math.cos(t) * rr, py = cy + Math.sin(t) * rr;
    const th = angle + (r() - 0.5) * 0.9, tx = Math.cos(th), ty = Math.sin(th), nx = -ty, ny = tx;
    const L = 22 + r() * 26, n = 10 + Math.floor(r() * 12), step = 0.9 + r() * 0.8;
    let d = "", side = 1;
    for (let i = 0; i < n; i++) {
      const o = (i - n / 2) * step, l = L * (0.6 + r() * 0.4) / 2;
      d += `${d ? " L" : "M"}${f(px + nx * o + tx * l * side + (r() - 0.5) * 1.5)} ${f(py + ny * o + ty * l * side + (r() - 0.5) * 1.5)}`;
      side = -side;
    }
    out.push([d, (0.18 + r() * 0.26) * opMul]);
  };
  for (let i = 0; i < count; i++) patch(1, dom);
  for (let i = 0; i < count * 0.45; i++) patch(0.6, dom + 1 + r() * 0.3);
  return out;
}
function colourIn(cx, cy, R, mid, span, r) {
  const out = [], dir = mid + Math.PI / 2, ax = Math.cos(mid), ay = Math.sin(mid);
  const from = span > Math.PI ? -R : -R * 0.08, to = R * 1.06, half = R + 14;
  let u = from, run = "", count = 0, side = 1, runW = 11 + r() * 3.5;
  while (u < to) {
    const th = dir + (r() - 0.5) * 0.38, tx = Math.cos(th), ty = Math.sin(th);
    const px = cx + ax * u, py = cy + ay * u, reach = half * (0.85 + r() * 0.3);
    const x = px + tx * reach * side + (r() - 0.5) * 6, y = py + ty * reach * side + (r() - 0.5) * 6;
    run += `${run ? " L" : "M"}${f(x)} ${f(y)}`;
    side = -side;
    count++;
    u += runW * (0.14 + r() * 0.18);
    if (count > 3 + r() * 4) {
      out.push([run, runW]);
      run = "";
      count = 0;
      runW = 11 + r() * 3.5;
      u -= runW * (0.3 + r() * 0.5);
    }
  }
  if (run) out.push([run, runW]);
  return out;
}
function dabs(p0, c1, c2, p3, r) {
  const N = 120, pts = [];
  for (let i = 0; i <= N; i++) pts.push(bez(p0, c1, c2, p3, i / N));
  let d = "", walked = 0, next = 2 + r() * 3;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], seg = Math.hypot(bx - ax, by - ay);
    walked += seg;
    if (walked < next) continue;
    const ux = (bx - ax) / (seg || 1), uy = (by - ay) / (seg || 1), len = 0.2 + r() * 1.8, off = (r() - 0.5) * 1.1;
    const x = bx - uy * off, y = by + ux * off;
    d += `M${f(x)} ${f(y)} l${f(ux * len)} ${f(uy * len)} `;
    next = walked + 4.2 + r() * 3.4;
  }
  return d;
}
var path = (d, extra = "") => `<path d="${d}"${extra}/>`;
var textBlock = (lines, cx, cy, lh, extra = "") => {
  const top = cy - lines.length * lh / 2;
  return lines.map((t, i) => `<text x="${f(cx)}" y="${f(top + lh * (i + 0.74))}" text-anchor="middle"${extra}>${esc(t)}</text>`).join("");
};
function sketchRect(x, y, w, h, r) {
  const c = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map((p) => jit(p, r, 2));
  return c.map((a, i) => stroke(a, c[(i + 1) % 4], r, 3, 2.4)).join(" ");
}
function roundRect(x, y, w, h, rad, r) {
  const k = rad, j = () => (r() - 0.5) * 1.4;
  return `M${f(x + k + j())} ${f(y + j())} L${f(x + w - k)} ${f(y + j())} Q${f(x + w)} ${f(y)} ${f(x + w + j())} ${f(y + k)} L${f(x + w + j())} ${f(y + h - k)} Q${f(x + w)} ${f(y + h)} ${f(x + w - k)} ${f(y + h + j())} L${f(x + k)} ${f(y + h + j())} Q${f(x)} ${f(y + h)} ${f(x + j())} ${f(y + h - k)} L${f(x + j())} ${f(y + k)} Q${f(x)} ${f(y)} ${f(x + k + 2)} ${f(y - 0.5)}`;
}
function ellipse(cx, cy, rx, ry, r) {
  const t0 = Math.PI * (0.85 + r() * 0.25), sweep = Math.PI * 2 * (1.06 + r() * 0.06), ph = r() * 6, pts = [];
  for (let t = 0; t <= sweep; t += 0.1) {
    const k = 1 + 0.03 * Math.sin(3 * t + ph) - 0.05 * (t / sweep);
    pts.push(`${f(cx + Math.cos(t0 + t) * rx * k)} ${f(cy + Math.sin(t0 + t) * ry * k)}`);
  }
  return "M" + pts.join(" L");
}
var hatch = (x, y, w, h, r, gap = 5, angle = 1) => hatchD(x, y, w, h, r, gap, angle);
var fillCls = (kind) => kind === "stipple" ? " pt-diagram__stipple" : kind === "pencil" ? " pt-diagram__pencil" : "";
var fillMarkup = (kind, x, y, w, h, r, cls, k = 0) => kind === "highlight" ? swipesD(x, y, w, h, r).map((d) => path(d, ' class="pt-diagram__swipe"')).join("") : path(fillD(kind, x, y, w, h, r, k), ` class="${cls}${fillCls(kind)}"`);
var fillD = (kind, x, y, w, h, r, k = 0) => kind === "hatch" || !FILLS[kind] ? hatchD(x, y, w, h, r, 4.4 + k % 3, [1, -1, 0.45, -2.2, 2.4, -0.5][k % 6]) : FILLS[kind](x, y, w, h, r);
var clipN = 0;
function hatchBox(x, y, w, h, r, gap, angle, cls, kind) {
  const id = "pth" + ++clipN;
  return `<clipPath id="${id}"><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"/></clipPath><g clip-path="url(#${id})">${kind === "highlight" || kind && kind !== "hatch" && FILLS[kind] ? fillMarkup(kind, x, y, w, h, r, cls) : path(hatch(x, y, w, h, r, gap, angle), ` class="${cls}"`)}</g>`;
}
function arrowHead(p, from, r, size = 9) {
  const a = Math.atan2(p[1] - from[1], p[0] - from[0]), s = 0.45 + (r() - 0.5) * 0.1;
  const q = (k) => [p[0] - Math.cos(a + k) * size, p[1] - Math.sin(a + k) * size];
  const l = q(s), rr = q(-s);
  return `M${f(l[0])} ${f(l[1])} L${f(p[0])} ${f(p[1])} L${f(rr[0])} ${f(rr[1])}`;
}
var bez = (p0, c1, c2, p3, t) => {
  const u = 1 - t;
  return [0, 1].map((i) => u * u * u * p0[i] + 3 * u * u * t * c1[i] + 3 * u * t * t * c2[i] + t * t * t * p3[i]);
};
function svgWrap(minX, minY, w, h, body, label) {
  return `<svg class="pt-diagram__svg" xmlns="http://www.w3.org/2000/svg" viewBox="${f(minX)} ${f(minY)} ${f(w)} ${f(h)}" width="${f(w)}" height="${f(h)}" role="img" aria-label="${esc(label)}">${body}</svg>`;
}
function renderFlow(src, o) {
  const g = parseFlow(src), r = rng(o.seed), m = measurer(o.font), lh = o.lineHeight;
  const ids = [...g.nodes.keys()];
  if (!ids.length) return "";
  for (const n of g.nodes.values()) {
    n.lines = n.label.split("\n");
    const tw = Math.max(...n.lines.map(m)), th = n.lines.length * lh;
    if (n.shape === "diamond") {
      n.w = tw + th + 44;
      n.h = th + 26 + tw * 0.22;
    } else if (n.shape === "circle") {
      n.w = n.h = Math.max(tw, th) + 34;
    } else {
      n.w = Math.max(tw + 34, 64);
      n.h = Math.max(th + 20, 44);
    }
    if (n.shape === "cylinder") n.h += 12;
  }
  const st = /* @__PURE__ */ new Map(), back = /* @__PURE__ */ new Set();
  const outs = (id) => g.edges.filter((e) => e.from === id);
  const dfs = (u) => {
    st.set(u, 1);
    for (const e of outs(u)) {
      if (st.get(e.to) === 1) back.add(e);
      else if (!st.get(e.to)) dfs(e.to);
    }
    st.set(u, 2);
  };
  ids.forEach((i) => {
    if (!st.get(i)) dfs(i);
  });
  const fwd = g.edges.filter((e) => !back.has(e) && e.from !== e.to);
  const preds = new Map(ids.map((i) => [i, []])), succs = new Map(ids.map((i) => [i, []]));
  fwd.forEach((e) => {
    preds.get(e.to).push(e.from);
    succs.get(e.from).push(e.to);
  });
  const rank = /* @__PURE__ */ new Map();
  const rk = (u) => {
    if (rank.has(u)) return rank.get(u);
    rank.set(u, 0);
    const p = preds.get(u);
    const v = p.length ? Math.max(...p.map(rk)) + 1 : 0;
    rank.set(u, v);
    return v;
  };
  ids.forEach(rk);
  const maxR = Math.max(...rank.values());
  const layers = Array.from({ length: maxR + 1 }, () => []);
  ids.forEach((i) => layers[rank.get(i)].push(i));
  const pos = () => {
    const p = /* @__PURE__ */ new Map();
    layers.forEach((L) => L.forEach((id, k) => p.set(id, k)));
    return p;
  };
  for (let it = 0; it < 4; it++) {
    let p = pos();
    for (let k = 1; k <= maxR; k++) {
      const bc = (id) => {
        const ps = preds.get(id);
        return ps.length ? ps.reduce((s, q) => s + p.get(q), 0) / ps.length : p.get(id);
      };
      layers[k].sort((a, b) => bc(a) - bc(b));
      p = pos();
    }
    for (let k = maxR - 1; k >= 0; k--) {
      const bc = (id) => {
        const ss = succs.get(id);
        return ss.length ? ss.reduce((s, q) => s + p.get(q), 0) / ss.length : p.get(id);
      };
      layers[k].sort((a, b) => bc(a) - bc(b));
      p = pos();
    }
  }
  const horiz = g.dir === "LR" || g.dir === "RL";
  const crossSize = (n) => horiz ? n.h : n.w, mainSize = (n) => horiz ? n.w : n.h;
  const gapCross = horiz ? 22 : 30, gapMain = horiz ? 64 : 52;
  let mainAt = 0;
  layers.forEach((L) => {
    const thick = Math.max(...L.map((id) => mainSize(g.nodes.get(id))));
    let total = L.reduce((s, id) => s + crossSize(g.nodes.get(id)), 0) + gapCross * (L.length - 1), c = -total / 2;
    L.forEach((id) => {
      const n = g.nodes.get(id);
      n.c = c + crossSize(n) / 2;
      c += crossSize(n) + gapCross;
      n.m = mainAt + thick / 2;
    });
    mainAt += thick + gapMain;
  });
  const settle = (L, want) => {
    const desired = L.map((id) => want(id));
    L.forEach((id, k) => {
      if (desired[k] != null) g.nodes.get(id).c = desired[k];
    });
    for (let k = 1; k < L.length; k++) {
      const a = g.nodes.get(L[k - 1]), b = g.nodes.get(L[k]), min = a.c + (crossSize(a) + crossSize(b)) / 2 + gapCross;
      if (b.c < min) b.c = min;
    }
    const wanted = desired.filter((v) => v != null);
    if (wanted.length) {
      const now = L.reduce((s, id) => s + g.nodes.get(id).c, 0) / L.length;
      const aim = wanted.reduce((s, v) => s + v, 0) / wanted.length;
      L.forEach((id) => {
        g.nodes.get(id).c += aim - now;
      });
    }
  };
  const avg = (list) => list.length ? list.reduce((s, id) => s + g.nodes.get(id).c, 0) / list.length : null;
  for (let it = 0; it < 2; it++) {
    for (let k = 1; k <= maxR; k++) settle(layers[k], (id) => avg(preds.get(id)));
    for (let k = maxR - 1; k >= 0; k--) settle(layers[k], (id) => avg(succs.get(id)));
  }
  const flipMain = g.dir === "BT" || g.dir === "RL";
  for (const n of g.nodes.values()) {
    const mm = flipMain ? -n.m : n.m;
    n.x = horiz ? mm : n.c;
    n.y = horiz ? n.c : mm;
  }
  let shapes = "", fills = "", texts = "", lines = "", heads = "", labels = "";
  for (const n of g.nodes.values()) {
    const x = n.x - n.w / 2, y = n.y - n.h / 2;
    const clipped = FILLS[o.fill] || o.fill === "highlight";
    if (FILLS[o.fill]) fills += `<g clip-path="url(#c-${o.uid}-${esc(n.id)})">${fillMarkup(o.fill, x, y, n.w, n.h, r, "pt-diagram__hatch")}</g>`;
    if (o.fill === "wash") fills += path(band(n.w * 0.9, n.h * 0.62, r, { t0: 0.2, t1: 0.1, b0: 0.9, b1: 0.8, x0: 2, x1: n.w * 0.9 - 2, bow: 1.6 }), ` class="pt-diagram__wash" transform="translate(${f(x + n.w * 0.05)} ${f(y + n.h * 0.2)})"`);
    let d, clip;
    switch (n.shape) {
      case "round":
        d = roundRect(x, y, n.w, n.h, 10, r);
        clip = `<rect x="${f(x)}" y="${f(y)}" width="${f(n.w)}" height="${f(n.h)}" rx="10"/>`;
        break;
      case "stadium":
        d = roundRect(x, y, n.w, n.h, n.h / 2, r);
        clip = `<rect x="${f(x)}" y="${f(y)}" width="${f(n.w)}" height="${f(n.h)}" rx="${f(n.h / 2)}"/>`;
        break;
      case "circle":
        d = ellipse(n.x, n.y, n.w / 2, n.h / 2, r);
        clip = `<circle cx="${f(n.x)}" cy="${f(n.y)}" r="${f(n.w / 2)}"/>`;
        break;
      case "diamond": {
        const P = [[n.x, y], [x + n.w, n.y], [n.x, y + n.h], [x, n.y]].map((p) => jit(p, r, 1.6));
        d = P.map((a, i) => stroke(a, P[(i + 1) % 4], r, 3, 2)).join(" ");
        clip = `<polygon points="${P.map((p) => p.map(f).join(",")).join(" ")}"/>`;
        break;
      }
      case "cylinder": {
        const ry = 7;
        d = ellipse(n.x, y + ry, n.w / 2, ry, r) + " " + stroke([x, y + ry], [x, y + n.h - ry], r, 1, 1.5) + " " + stroke([x + n.w, y + ry], [x + n.w, y + n.h - ry], r, 1, 1.5) + ` M${f(x)} ${f(y + n.h - ry)} Q${f(n.x)} ${f(y + n.h + ry)} ${f(x + n.w)} ${f(y + n.h - ry)}`;
        clip = `<rect x="${f(x)}" y="${f(y)}" width="${f(n.w)}" height="${f(n.h)}" rx="8"/>`;
        break;
      }
      case "subroutine":
        d = sketchRect(x, y, n.w, n.h, r) + " " + stroke([x + 8, y], [x + 8, y + n.h], r, 1, 1) + " " + stroke([x + n.w - 8, y], [x + n.w - 8, y + n.h], r, 1, 1);
        clip = `<rect x="${f(x)}" y="${f(y)}" width="${f(n.w)}" height="${f(n.h)}"/>`;
        break;
      case "flag": {
        const P = [[x, y], [x + n.w, y], [x + n.w, y + n.h], [x, y + n.h], [x + 14, n.y]].map((p) => jit(p, r, 1.5));
        d = P.map((a, i) => stroke(a, P[(i + 1) % P.length], r, 2, 1.5)).join(" ");
        clip = `<polygon points="${P.map((p) => p.map(f).join(",")).join(" ")}"/>`;
        break;
      }
      default:
        d = sketchRect(x, y, n.w, n.h, r);
        clip = `<rect x="${f(x)}" y="${f(y)}" width="${f(n.w)}" height="${f(n.h)}"/>`;
    }
    if (o.fill === "highlight") {
      const edge = ["diamond", "circle", "flag", "cylinder"].includes(n.shape) ? path(d, ' class="pt-diagram__wash pt-diagram__wash--edge"') : "";
      fills += `<g clip-path="url(#c-${o.uid}-${esc(n.id)})">${edge}${swipesD(x, y, n.w, n.h, r).map((q) => path(q, ' class="pt-diagram__wash pt-diagram__wash--swipe"')).join("")}</g>`;
    }
    if (clipped) fills = `<clipPath id="c-${o.uid}-${esc(n.id)}">${clip}</clipPath>` + fills;
    shapes += path(d);
    texts += textBlock(n.lines, n.x, n.y, lh);
  }
  const outCount = /* @__PURE__ */ new Map(), inCount = /* @__PURE__ */ new Map(), outIdx = /* @__PURE__ */ new Map(), inIdx = /* @__PURE__ */ new Map();
  g.edges.forEach((e) => {
    outCount.set(e.from, (outCount.get(e.from) || 0) + 1);
    inCount.set(e.to, (inCount.get(e.to) || 0) + 1);
  });
  const spread = (n, k, total) => total > 1 ? (k - (total - 1) / 2) * Math.min(18, (horiz ? n.h : n.w) / (total + 1)) : 0;
  const sign = flipMain ? -1 : 1;
  for (const e of g.edges) {
    const a = g.nodes.get(e.from), b = g.nodes.get(e.to);
    const ko = outIdx.get(e.from) || 0, ki = inIdx.get(e.to) || 0;
    outIdx.set(e.from, ko + 1);
    inIdx.set(e.to, ki + 1);
    let p0, p3, c1, c2;
    if (a === b) {
      const s = [a.x + a.w / 2, a.y - 6], t = [a.x + a.w / 2, a.y + 6];
      p0 = s;
      p3 = t;
      c1 = [s[0] + 34, s[1] - 26];
      c2 = [t[0] + 34, t[1] + 26];
    } else if (back.has(e)) {
      if (horiz) {
        const side = Math.max(a.y + a.h / 2, b.y + b.h / 2) + 28;
        p0 = [a.x, a.y + a.h / 2];
        p3 = [b.x, b.y + b.h / 2];
        c1 = [p0[0], side];
        c2 = [p3[0], side];
      } else {
        const side = Math.max(a.x + a.w / 2, b.x + b.w / 2) + 34;
        p0 = [a.x + a.w / 2, a.y];
        p3 = [b.x + b.w / 2, b.y];
        c1 = [side, p0[1]];
        c2 = [side, p3[1]];
      }
    } else if (horiz) {
      p0 = [a.x + sign * a.w / 2, a.y + spread(a, ko, outCount.get(e.from))];
      p3 = [b.x - sign * b.w / 2, b.y + spread(b, ki, inCount.get(e.to))];
      const dx = (p3[0] - p0[0]) * 0.45;
      c1 = [p0[0] + dx, p0[1]];
      c2 = [p3[0] - dx, p3[1]];
    } else {
      p0 = [a.x + spread(a, ko, outCount.get(e.from)), a.y + sign * a.h / 2];
      p3 = [b.x + spread(b, ki, inCount.get(e.to)), b.y - sign * b.h / 2];
      const dy = (p3[1] - p0[1]) * 0.45;
      c1 = [p0[0], p0[1] + dy];
      c2 = [p3[0], p3[1] - dy];
    }
    c1 = jit(c1, r, 3);
    c2 = jit(c2, r, 3);
    const cls = e.style === "dotted" ? ' class="pt-diagram__dotted"' : e.style === "thick" ? ' class="pt-diagram__thick"' : "";
    if (e.style === "dotted") lines += path(dabs(p0, c1, c2, p3, r), ' class="pt-diagram__dotted"');
    else lines += path(`M${f(p0[0])} ${f(p0[1])} C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p3[0])} ${f(p3[1])}`, cls);
    if (e.arrow) heads += path(arrowHead(p3, bez(p0, c1, c2, p3, 0.9), r, e.style === "thick" ? 11 : 9), e.style === "thick" ? ' class="pt-diagram__thick"' : "");
    if (e.label) {
      const mid = bez(p0, c1, c2, p3, 0.5), ls = e.label.split("\n"), tw = Math.max(...ls.map(m)) + 12, th = ls.length * lh + 4;
      labels += `<rect class="pt-diagram__label-bg" x="${f(mid[0] - tw / 2)}" y="${f(mid[1] - th / 2)}" width="${f(tw)}" height="${f(th)}" rx="3"/>` + textBlock(ls, mid[0], mid[1], lh, ' class="pt-diagram__label"');
    }
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of g.nodes.values()) {
    minX = Math.min(minX, n.x - n.w / 2);
    maxX = Math.max(maxX, n.x + n.w / 2);
    minY = Math.min(minY, n.y - n.h / 2);
    maxY = Math.max(maxY, n.y + n.h / 2);
  }
  const pad = 14 + (back.size || g.edges.some((e) => e.from === e.to) ? 40 : 0);
  minX -= 14;
  minY -= 14;
  maxX += pad;
  maxY += back.size && horiz ? pad : 14;
  const body = `<g class="pt-diagram__fill">${fills}</g><g class="pt-diagram__ink">${lines}${heads}${shapes}</g><g class="pt-diagram__labels">${labels}</g><g class="pt-diagram__text">${texts}</g>`;
  return svgWrap(minX, minY, maxX - minX, maxY - minY, body, "Flowchart: " + [...g.nodes.values()].map((n) => n.label.replace(/\n/g, " ")).join(", "));
}
function renderPie(src, o) {
  const p = parsePie(src), r = rng(o.seed), m = measurer(o.font), lh = o.lineHeight;
  const total = p.items.reduce((s, i) => s + i.value, 0) || 1, R = 92, cx = R + 14, cy = R + 14 + (p.title ? lh + 10 : 0);
  const ph1 = r() * 6, ph2 = r() * 6, ph3 = r() * 6;
  const rad = (t) => R * (1 + 0.024 * Math.sin(2 * t + ph1) + 0.013 * Math.sin(5 * t + ph2) + 6e-3 * Math.sin(9 * t + ph3));
  const at = (t, k = 1) => [cx + Math.cos(t) * rad(t) * k, cy + Math.sin(t) * rad(t) * k];
  let body = "", defs2 = "", a0 = -Math.PI / 2;
  p.items.forEach((it, k) => {
    const a1 = a0 + it.value / total * Math.PI * 2, col = SERIES[k % SERIES.length], mid = (a0 + a1) / 2;
    const pts = [[cx, cy]];
    for (let t = a0; t <= a1 + 1e-6; t += 0.04) pts.push(at(t, 0.985));
    pts.push(at(a1, 0.985));
    defs2 += `<clipPath id="p-${o.uid}-${k}"><polygon points="${pts.map((q) => q.map(f).join(",")).join(" ")}"/></clipPath>`;
    const g = (inner) => `<g clip-path="url(#p-${o.uid}-${k})" style="color:${col}">${inner}</g>`;
    if (o.chartFill === "highlight") {
      const edgeD = "M" + pts.map((q) => q.map(f).join(" ")).join(" L") + " Z";
      body += g(path(edgeD, ' class="pt-diagram__swipe-edge"') + colourIn(cx, cy, R, mid, a1 - a0, r).map(([q, w2]) => path(q, ` class="pt-diagram__swipe-edge" style="stroke-width:${f(w2)}px"`)).join(""));
    } else if (o.chartFill === "pencil") {
      body += g(shadeIn(cx, cy, R, mid, a1 - a0, r).map(([q, op]) => path(q, ` class="pt-diagram__shade" style="stroke-opacity:${f(op * 100) / 100}"`)).join(""));
    } else body += g(fillMarkup(o.chartFill, cx - R - 20, cy - R - 20, 2 * R + 40, 2 * R + 40, r, "pt-diagram__hatch-strong", k));
    const e = at(a0, 1.01);
    body += path(stroke([cx + (r() - 0.5) * 2, cy + (r() - 0.5) * 2], [e[0] + (r() - 0.5) * 2, e[1] + (r() - 0.5) * 2], r, 1.4, 1.4), ' class="pt-diagram__ink"');
    a0 = a1;
  });
  const s0 = r() * Math.PI * 2, sweep = Math.PI * 2 + 0.18 + r() * 0.2, ring = [];
  for (let t = 0; t <= sweep; t += 0.045) {
    const u = t / sweep, drift = 1 + (u - 0.5) * 0.016;
    const q = at(s0 + t, drift);
    ring.push([q[0] + (r() - 0.5) * 0.35, q[1] + (r() - 0.5) * 0.35]);
  }
  body += path(curve(ring, true), ' class="pt-diagram__ink"');
  const lx = cx + R + 30;
  let ly = cy - p.items.length * (lh + 6) / 2, legend = "", maxW = 0;
  p.items.forEach((it, k) => {
    const pct = Math.round(it.value / total * 100), label = `${it.label}  ${p.showData ? it.value : pct + "%"}`;
    maxW = Math.max(maxW, m(label));
    legend += `<g style="color:${SERIES[k % SERIES.length]}">${hatchBox(lx, ly + 4, 16, lh - 8, r, 3.2, 1, "pt-diagram__hatch-strong", o.chartFill)}${path(sketchRect(lx, ly + 4, 16, lh - 8, r), ' class="pt-diagram__ink"')}</g>`;
    legend += `<text x="${f(lx + 26)}" y="${f(ly + lh * 0.74)}">${esc(label)}</text>`;
    ly += lh + 6;
  });
  const w = lx + 26 + maxW + 14, h = cy + R + 18;
  const title = p.title ? `<text x="${f(w / 2)}" y="${f(lh)}" text-anchor="middle" class="pt-diagram__title">${esc(p.title)}</text>` : "";
  return svgWrap(0, 0, w, h, `<defs>${defs2}</defs>${body}<g class="pt-diagram__text">${legend}${title}</g>`, "Pie chart" + (p.title ? ": " + p.title : ""));
}
function renderXY(src, o) {
  const c = parseXY(src), r = rng(o.seed), m = measurer(o.font), lh = o.lineHeight;
  const all = c.series.flatMap((s) => s.values);
  const n = Math.max(c.x.length, ...c.series.map((s) => s.values.length), 1);
  let lo = c.min != null ? c.min : Math.min(0, ...all), hi = c.max != null ? c.max : Math.max(...all, 1);
  const step = (() => {
    const raw = (hi - lo) / 4, p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    return [1, 2, 2.5, 5, 10].map((k) => k * p).find((k) => k >= raw) || raw;
  })();
  if (c.max == null) hi = Math.ceil(hi / step) * step;
  if (c.min == null) lo = Math.floor(lo / step) * step;
  const W = Math.max(o.width || 480, 280), left = Math.max(...[lo, hi].map((v) => m(String(v)))) + 22 + (c.yLabel ? lh : 0), top = c.title ? lh + 14 : 10, bottom = lh + 14 + (c.xLabel ? lh : 0);
  const H = 240, plotW = W - left - 16, plotH = H - top - bottom;
  const X = (i) => left + (i + 0.5) * plotW / n, Y = (v) => top + plotH - (v - lo) / (hi - lo || 1) * plotH;
  let grid = "", ink = "", fills = "", marks = "", text = "";
  for (let v = lo; v <= hi + 1e-9; v += step) {
    const y = Y(v);
    grid += path(stroke([left, y], [left + plotW, y], r, 0, 1.2), ' class="pt-diagram__grid"');
    text += `<text x="${f(left - 8)}" y="${f(y + lh * 0.3)}" text-anchor="end" class="pt-diagram__small">${+v.toFixed(2)}</text>`;
  }
  ink += path(stroke([left, top - 6], [left, top + plotH], r, 2, 1.5) + " " + stroke([left, top + plotH], [left + plotW + 6, top + plotH], r, 2, 1.5));
  c.x.forEach((lab, i) => {
    text += `<text x="${f(X(i))}" y="${f(top + plotH + lh * 0.95)}" text-anchor="middle" class="pt-diagram__small">${esc(lab)}</text>`;
  });
  const bars = c.series.filter((s) => s.type === "bar"), bw = plotW / n * 0.62 / Math.max(1, bars.length);
  bars.forEach((s, k) => {
    const col = SERIES[(k + 1) % SERIES.length];
    s.values.forEach((v, i) => {
      const x = X(i) - bw * bars.length / 2 + k * bw + 2, y0 = Y(Math.max(lo, 0)), y = Y(v), hgt = Math.abs(y0 - y), w = bw - 4;
      const yy = Math.min(y, y0);
      fills += `<g style="color:${col}">` + hatchBox(x, yy, w, hgt, r, 4, 0.8, "pt-diagram__hatch-strong", o.chartFill) + "</g>";
      fills += `<g style="color:${col}">` + path(sketchRect(x, yy, w, hgt, r), ' class="pt-diagram__ink"') + "</g>";
    });
  });
  c.series.filter((s) => s.type === "line").forEach((s, k) => {
    const col = SERIES[(k + 2 + bars.length) % SERIES.length], pts = s.values.map((v, i) => [X(i), Y(v)]);
    if (pts.length > 1) marks += `<g style="color:${col}">` + path(curve(pts.map((p) => jit(p, r, 1)), true), ' class="pt-diagram__line"') + pts.map((p) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="3.2" class="pt-diagram__dot"/>`).join("") + "</g>";
  });
  if (c.title) text += `<text x="${f(W / 2)}" y="${f(lh)}" text-anchor="middle" class="pt-diagram__title">${esc(c.title)}</text>`;
  if (c.xLabel) text += `<text x="${f(left + plotW / 2)}" y="${f(H - 4)}" text-anchor="middle" class="pt-diagram__small">${esc(c.xLabel)}</text>`;
  if (c.yLabel) text += `<text transform="translate(${f(lh * 0.8)} ${f(top + plotH / 2)}) rotate(-90)" text-anchor="middle" class="pt-diagram__small">${esc(c.yLabel)}</text>`;
  return svgWrap(0, 0, W, H, `<g class="pt-diagram__fill">${grid}${fills}</g><g class="pt-diagram__ink">${ink}</g>${marks}<g class="pt-diagram__text">${text}</g>`, "Chart" + (c.title ? ": " + c.title : ""));
}
var uid = 0;
function renderDiagram(src, opts = {}) {
  const o = { seed: 1, font: "20px Caveat, cursive", lineHeight: 24, fill: "none", width: 480, uid: ++uid, ...opts };
  o.chartFill = o.fill && o.fill !== "none" && o.fill !== "wash" ? o.fill : "hatch";
  const k = kindOf(src);
  if (k === "flow") return renderFlow(src, o);
  if (k === "pie") return renderPie(src, o);
  if (k === "xy") return renderXY(src, o);
  return "";
}

// src/js/painter.js
var repaint = () => {
};
var SVGNS = "http://www.w3.org/2000/svg";
var PAINTERS = [
  {
    // highlighter passes behind a button, plus the hover smear position
    sel: ".pt-btn",
    measure: (el, o) => {
      const label = el.querySelector(".pt-btn__label");
      return {
        w: el.offsetWidth + 11,
        h: el.offsetHeight - 10,
        style: HIGHLIGHT[el.dataset.hl] ? el.dataset.hl : o.highlight,
        lx: label ? label.offsetLeft : 0,
        ly: label ? label.offsetTop : 0,
        // the box of the pass drawn on hover (the second pass, or the only pass on an outlined button)
        pass: (() => {
          const ps = getComputedStyle(el, el.classList.contains("pt-btn--outline") ? "::before" : "::after");
          return [parseFloat(ps.left) || 0, parseFloat(ps.width) || 0];
        })()
      };
    },
    key: (m) => `${m.style}|${m.w}|${m.h}`,
    draw: (el, m) => {
      if (m.w < 12 || m.h < 12) return;
      const r = rng(seedOf(el)), heavy = HEAVY_START.has(m.style);
      el.style.setProperty("--pt-mask-a", enc(svgDoc(m.w, m.h, gradient(m.w, "#000", heavy) + HIGHLIGHT[m.style](m.w, m.h, r).join(""))));
      el.style.setProperty("--pt-mask-b", enc(svgDoc(m.w, m.h, gradient(m.w, "#000", heavy) + secondPass(m.style, m.w, m.h, r).join(""))));
      el.style.setProperty("--pt-pool-y", POOL_Y[m.style] || "50%");
      el.style.setProperty("--pt-pool-x", heavy ? "8px" : "calc(100% - 8px)");
    },
    always: (el, m) => {
      const sm = el.querySelector(".pt-btn__smear");
      if (sm) {
        const [pl, pw] = m.pass;
        sm.style.left = pl + "px";
        sm.style.top = m.ly + "px";
        sm.style.width = pw + "px";
        sm.style.paddingLeft = m.lx - pl + "px";
      }
    }
  },
  {
    sel: ".pt-btn--outline",
    measure: (el, o) => ({
      w: el.offsetWidth,
      h: el.offsetHeight,
      style: OUTLINE[el.dataset.outline] ? el.dataset.outline : o.outline,
      t: toolOf(el)
    }),
    key: (m) => `${m.style}|${m.w}|${m.h}|${toolKey(m.t)}`,
    draw: (el, m) => {
      if (m.w < 12) return;
      el.style.setProperty("--pt-ol", enc(svgDoc(m.w, m.h, `<defs>${toolDefs(m.t)}</defs>` + OUTLINE[m.style](m.w, m.h, rng(seedOf(el) + 7), m.t))));
      el.style.setProperty("--pt-ol-size", "100% 100%");
      el.style.setProperty("--pt-ol-pos", "0 0");
    }
  },
  {
    // tape is torn off the roll by hand: each piece gets its own ragged ends
    sel: ".pt-tape",
    measure: (el) => ({ w: el.offsetWidth, h: el.offsetHeight }),
    key: (m) => `${m.w}|${m.h}`,
    draw: (el, m) => {
      if (m.w < 8 || m.h < 6) return;
      const r = rng(seedOf(el)), w = m.w, h = m.h, end = (x0, dir) => {
        const pts2 = [], slant = (r() - 0.5) * 3;
        for (let y = 0; y <= h; y += 1 + r() * 1.6) pts2.push([x0 + dir * (2.5 + (r() - 0.5) * 1.8 + slant * (y / h - 0.5) + (r() < 0.12 ? r() * 1.2 : 0)), Math.min(y, h)]);
        if (pts2[pts2.length - 1][1] < h) pts2.push([x0 + dir * (2 + r()), h]);
        return pts2;
      };
      const left = end(0, 1), right = end(w, -1);
      const edge = (y, x0, x1) => {
        const out = [];
        for (let x = x0 + 18; x < x1 - 9; x += 18) out.push([x, y + (r() - 0.5) * 0.5]);
        return out;
      };
      const pts = [...edge(0, left[0][0], right[0][0]), ...right, ...edge(h, left[left.length - 1][0], right[right.length - 1][0]).reverse(), ...left.reverse()];
      const d = "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(" L") + "Z";
      el.style.setProperty("--pt-tape-mask", enc(svgDoc(w, h, `<path d="${d}" fill="#000"/>`)));
    }
  },
  {
    // how a done item is crossed out: data-strike="none|line|double|scribble|under" on the item or the list,
    // and for "under" any link underline in data-ul
    sel: ".pt-check__text",
    measure: (el) => {
      const host = el.closest(".pt-check") || el, sk = el.closest("[data-strike]"), ul = el.closest("[data-ul]");
      return { strike: sk ? sk.dataset.strike : "line", ul: ul ? ul.dataset.ul : "wobble", t: toolOf(host) };
    },
    key: (m) => `${m.strike}|${m.ul}|${toolKey(m.t)}`,
    draw: (el, m) => {
      if (m.strike === "none") {
        el.style.setProperty("--pt-strike", "none");
        return;
      }
      const r = rng(seedOf(el)), under = m.strike === "under";
      const d = under ? m.ul === "wave" ? waveD(r) : (LINK[m.ul] || LINK.wobble)(r) : (STRIKE[m.strike] || STRIKE.line)(r);
      const vb = under && m.ul === "wave" ? `0 0 ${WAVE_W} 9` : "0 0 200 12";
      el.style.setProperty("--pt-strike", enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="none"><defs>${toolDefs(m.t)}</defs>${inkPath(d, m.t, { nonScaling: true, scale: under && m.ul === "marker" ? 2 : 1 })}</svg>`));
      el.style.setProperty("--pt-strike-y", under ? "100%" : "55%");
      el.style.setProperty("--pt-strike-h", m.strike === "scribble" ? "17px" : "10px");
    }
  },
  {
    sel: '.pt-btn[data-hover="circle"], .pt-btn[data-hover="underline"], .pt-link[data-hover="circle"], .pt-link[data-hover="underline"]',
    measure: (el) => {
      const svg = el.querySelector(":scope > .pt-hover-ink"), label = el.querySelector(":scope > .pt-btn__label") || el;
      const b = label.getBoundingClientRect(), o = el.getBoundingClientRect();
      return { svg, kind: el.dataset.hover, w: Math.round(b.width), h: Math.round(b.height), x: Math.round(b.left - o.left), y: Math.round(b.top - o.top) };
    },
    key: (m) => `${m.kind}|${m.w}|${m.h}|${m.x}|${m.y}`,
    draw: (el, m) => {
      if (!m.svg || m.w < 4) return;
      const r = rng(seedOf(el) + 5), circle = m.kind === "circle";
      const pw = circle ? 14 : 3, ph = circle ? 12 : 0, w = m.w + pw * 2, h = circle ? m.h + ph * 2 : 10;
      Object.assign(m.svg.style, { left: m.x - pw + "px", top: (circle ? m.y - ph : m.y + m.h - 2) + "px", width: w + "px", height: h + "px" });
      m.svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      m.svg.firstChild.setAttribute("d", circle ? ANNO.circle(w, h, r) : `M2 ${f(4 + r() * 2)} C ${f(w * 0.3)} ${f(3 + r() * 2)}, ${f(w * 0.7)} ${f(6 + r() * 2)}, ${f(w - 2)} ${f(4 + r() * 2)}`);
    }
  },
  {
    sel: ".pt-rule",
    measure: (el) => ({ w: el.clientWidth, h: el.clientHeight, style: RULE[el.dataset.rule] ? el.dataset.rule : el.dataset.rule ? "" : "wobble", t: toolOf(el) }),
    key: (m) => `${m.style}|${m.w}|${m.h}|${toolKey(m.t)}`,
    draw: (el, m) => {
      if (!m.style || m.w < 10) {
        el.style.removeProperty("--pt-gen");
        return;
      }
      el.style.setProperty("--pt-gen", enc(svgDoc(m.w, m.h, `<defs>${toolDefs(m.t)}</defs>` + RULE[m.style](m.w, m.h, rng(seedOf(el)), m.t))));
      el.classList.add("is-painted");
    }
  },
  {
    // the underline is drawn on a 200 × 12 box that stretches to each line of the link
    sel: ".pt-link",
    measure: (el) => ({ style: el.dataset.ul || "wobble", t: toolOf(el) }),
    key: (m) => `${m.style}|${toolKey(m.t)}`,
    draw: (el, m) => {
      if (m.style === "hl") return;
      const r = rng(seedOf(el)), defs2 = `<defs>${toolDefs(m.t)}</defs>`;
      const box = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 12" preserveAspectRatio="none">${defs2}${inner}</svg>`;
      if (m.style === "wave") {
        el.style.setProperty("--pt-u", enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${WAVE_W}" height="9" viewBox="0 0 ${WAVE_W} 9">${defs2}${inkPath(waveD(r), m.t, { scale: 0.8 })}</svg>`));
        el.style.setProperty("--pt-u-size", `${WAVE_W}px 9px`);
      } else {
        const shape = LINK[m.style] || LINK.wobble;
        el.style.setProperty("--pt-u", enc(box(inkPath(shape(r), m.t, { nonScaling: true, scale: m.style === "marker" ? 2 : 1 }))));
      }
      el.style.setProperty("--pt-u-second", enc(box(inkPath(LINK.second(r), m.t, { nonScaling: true, op: 0.8, scale: 0.8 }))));
    }
  },
  {
    sel: ".pt-progress",
    measure: (el) => {
      const raw = cssVar(el, "--pt-value"), now = el.getAttribute("aria-valuenow"), max = parseFloat(el.getAttribute("aria-valuemax")) || 100;
      const v = raw !== "" && Number.isFinite(parseFloat(raw)) ? parseFloat(raw) : now != null ? parseFloat(now) / max : 0;
      const LEGACY = { segments: "boxes", dots: "circles", ring: "ring", tally: "tally", sei: "sei" };
      const st = el.dataset.style || "highlight", shape = el.dataset.shape || LEGACY[st] || "bar";
      return {
        w: el.clientWidth,
        h: el.clientHeight,
        v,
        shape,
        style: LEGACY[st] ? "highlight" : st,
        t: toolOf(el),
        hl: cssVar(el, "--pt-hl") || "#fff04a",
        segments: parseInt(el.dataset.segments, 10) || 10,
        max: parseInt(el.dataset.max, 10) || 20
      };
    },
    key: (m) => `${m.shape}|${m.style}|${m.w}|${m.h}|${m.v}|${m.hl}|${m.segments}|${m.max}|${toolKey(m.t)}`,
    draw: (el, m) => {
      if (m.shape === "tally" || m.shape === "sei") el.style.setProperty("--pt-groups", Math.ceil(m.max / 5));
      if (m.w < 8 || m.h < 8) return;
      el.classList.add("is-painted");
      el.style.setProperty("--pt-progress-img", enc(svgDoc(m.w, m.h, `<defs>${toolDefs(m.t)}</defs>` + progressSVG(m.shape, m.style, m.w, m.h, rng(seedOf(el)), m.t, m.v, m))));
    }
  },
  {
    sel: ".pt-anno",
    measure: (el) => {
      const svg = el.querySelector(":scope > .pt-anno__ink");
      const b = svg ? svg.getBoundingClientRect() : { width: 0, height: 0 };
      return { w: Math.round(b.width * 2) / 2, h: Math.round(b.height * 2) / 2, style: el.dataset.anno, svg, t: toolOf(el) };
    },
    key: (m) => `${m.style}|${m.w}|${m.h}|${m.t.kind}|${m.t.w}`,
    draw: (el, m) => {
      if (!m.svg || !ANNO[m.style] || m.w < 2) return;
      m.svg.setAttribute("viewBox", `0 0 ${m.w} ${m.h}`);
      const d = ANNO[m.style](m.w, m.h, rng(seedOf(el)));
      const ps = m.style === "hatch" ? [[0, 0, 1, 1]] : passes(m.t);
      while (m.svg.childNodes.length > ps.length) m.svg.lastChild.remove();
      while (m.svg.childNodes.length < ps.length) m.svg.appendChild(svgEl("path", { pathLength: "1" }));
      ps.forEach(([dx, dy, k, o], i) => {
        const p = m.svg.childNodes[i];
        p.setAttribute("d", d);
        p.setAttribute("style", `--pt-k:${k};--pt-o:${o}`);
        if (dx || dy) p.setAttribute("transform", `translate(${f(dx)} ${f(dy)})`);
        else p.removeAttribute("transform");
      });
    }
  },
  {
    sel: ".pt-mark",
    measure: (el, o) => ({ style: HIGHLIGHT[el.dataset.hl] ? el.dataset.hl : o.highlight, c: cssVar(el, "--pt-hl") || "#fff04a" }),
    key: (m) => `${m.style}|${m.c}`,
    draw: (el, m) => {
      const w = 200, h = 40, heavy = HEAVY_START.has(m.style), pool = m.style === "dry" || m.style === "scribble" ? "" : `<ellipse cx="${heavy ? 9 : w - 9}" cy="${h * 0.55}" rx="7" ry="${h * 0.32}" fill="#000" fill-opacity=".09"/>`;
      el.style.setProperty("--pt-mark", enc(svgDoc(w, h, gradient(w, m.c, heavy) + HIGHLIGHT[m.style](w, h, rng(seedOf(el))).join("") + pool)));
    }
  },
  {
    sel: ".pt-swatch",
    measure: (el) => {
      const box = el.querySelector(".pt-swatch__ink");
      return { box, w: box ? box.clientWidth : 0, h: box ? box.clientHeight : 0, tool: SWATCH[el.dataset.tool] ? el.dataset.tool : "fountain", c: cssVar(el, "--pt-swatch") || "#213c6b" };
    },
    key: (m) => `${m.tool}|${m.w}|${m.h}|${m.c}`,
    draw: (el, m) => {
      if (!m.box || m.w < 20) return;
      m.box.style.backgroundImage = enc(svgDoc(m.w, m.h, SWATCH[m.tool](m.w, m.h, rng(seedOf(el)), m.c)));
    }
  }
];
PAINTERS.push(
  {
    sel: ".pt-litho",
    measure: (el) => ({ p: lithoParams(el) }),
    key: (m) => JSON.stringify(m.p),
    draw: (el, m) => {
      el.style.filter = `url(#${lithoFilterId(m.p)})`;
    }
  },
  {
    // the print replaces the picture's pixels; the original is kept in data-pt-src for reprints
    sel: "img.pt-print",
    measure: (el) => {
      if (!el.dataset.ptSrc) {
        if (!el.currentSrc && !el.getAttribute("src")) return { src: "" };
        el.dataset.ptSrc = el.currentSrc || el.src;
      }
      if (!el.dataset.ptW && el.complete && el.naturalWidth && !el.classList.contains("is-printed")) {
        const w = el.getBoundingClientRect().width;
        el.dataset.ptW = Math.abs(w - el.naturalWidth) < 1 && !el.style.width && !el.getAttribute("width") ? String(Math.round(w)) : "css";
      }
      const rec = sourceImage(el.dataset.ptSrc, () => repaint(el, true));
      return { src: el.dataset.ptSrc, rec, ready: rec.ready, failed: rec.failed, p: printParams(el) };
    },
    key: (m) => `${m.ready}|${m.failed}|${m.src}|${JSON.stringify(m.p)}`,
    draw: (el, m) => {
      el.classList.toggle("pt-print--blocked", !!m.failed);
      if (!m.src || !m.ready) return;
      if (el.dataset.ptW && el.dataset.ptW !== "css" && !el.style.width) el.style.width = el.dataset.ptW + "px";
      renderPrint(el, m.rec.img, m.p);
    }
  },
  {
    sel: ".pt-diagram",
    measure: (el) => {
      if (el.dataset.ptSrc == null) el.dataset.ptSrc = el.textContent.trim();
      const cs = getComputedStyle(el);
      return { src: el.dataset.ptSrc, w: Math.round(el.clientWidth), font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, lh: parseFloat(cs.lineHeight) || 24, fill: el.dataset.fill || "none" };
    },
    key: (m) => `${m.w}|${m.font}|${m.fill}|${m.src}`,
    draw: (el, m) => {
      if (!kindOf(m.src)) return;
      el.innerHTML = renderDiagram(m.src, { seed: seedOf(el), font: m.font, lineHeight: m.lh, fill: m.fill, width: m.w });
      el.classList.add("is-drawn-svg");
    }
  }
);
var PAINT_SELECTOR = PAINTERS.map((p) => p.sel).join(",");
function createScheduler(opts) {
  const queue = /* @__PURE__ */ new Set();
  const last = /* @__PURE__ */ new WeakMap();
  let frame = 0;
  function flush() {
    frame = 0;
    const jobs = [];
    for (const el of queue) {
      if (!el.isConnected) continue;
      PAINTERS.forEach((p, i) => {
        if (el.matches(p.sel)) jobs.push([el, p, i, p.measure(el, opts)]);
      });
    }
    queue.clear();
    for (const [el, p, i, m] of jobs) {
      const k = p.key(m), seen = last.get(el) || {};
      if (seen[i] !== k) {
        p.draw(el, m);
        seen[i] = k;
        last.set(el, seen);
      }
      if (p.always) p.always(el, m);
    }
  }
  const request = (el) => {
    queue.add(el);
    if (!frame) frame = requestAnimationFrame(flush);
  };
  repaint = (el, fresh) => {
    if (fresh) last.delete(el);
    request(el);
  };
  const forget = (el) => last.delete(el);
  const now = () => {
    if (frame) cancelAnimationFrame(frame);
    flush();
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    queue.clear();
  };
  return { request, forget, now, stop };
}
function createWatchers(scheduler, opts) {
  const ro = "ResizeObserver" in window ? new ResizeObserver((entries) => {
    for (const e of entries) scheduler.request(e.target);
  }) : null;
  const io = opts.lazy && "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) {
      io.unobserve(e.target);
      start(e.target);
    }
  }, { rootMargin: opts.lazyMargin }) : null;
  const started = /* @__PURE__ */ new WeakSet();
  function start(el) {
    started.add(el);
    scheduler.request(el);
    if (ro) ro.observe(el);
  }
  return {
    watch(el) {
      if (io) io.observe(el);
      else start(el);
    },
    isStarted: (el) => started.has(el),
    unwatch(el) {
      if (io) io.unobserve(el);
      if (ro) ro.unobserve(el);
    },
    disconnect() {
      if (io) io.disconnect();
      if (ro) ro.disconnect();
    }
  };
}
var svgEl = (name, attrs = {}) => {
  const e = document.createElementNS(SVGNS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
};

// src/js/decorate.js
var UL_MIX = ["wobble", "slant", "swash"];
var DECORATORS = [
  [".pt-btn", (el) => {
    if (!el.querySelector(":scope > .pt-btn__label")) {
      const label = document.createElement("span");
      label.className = "pt-btn__label";
      while (el.firstChild) label.appendChild(el.firstChild);
      el.appendChild(label);
    }
    if (!el.querySelector(":scope > .pt-btn__smear")) {
      const sm = document.createElement("span");
      sm.className = "pt-btn__smear";
      sm.setAttribute("aria-hidden", "true");
      sm.textContent = el.querySelector(".pt-btn__label").textContent;
      el.appendChild(sm);
    }
  }],
  [".pt-btn[data-hover], .pt-link[data-hover]", (el) => {
    if (!["circle", "underline"].includes(el.dataset.hover) || el.querySelector(":scope > .pt-hover-ink")) return;
    const svg = svgEl("svg", { class: "pt-hover-ink", "aria-hidden": "true", focusable: "false", preserveAspectRatio: "none" });
    svg.appendChild(svgEl("path", { pathLength: "1" }));
    el.appendChild(svg);
  }],
  [".pt-mark", (el) => {
    if (el.querySelector(":scope > .pt-mark__ink")) return;
    const s = document.createElement("span");
    s.className = "pt-mark__ink";
    while (el.firstChild) s.appendChild(el.firstChild);
    el.appendChild(s);
  }],
  [".pt-anno", (el) => {
    if (el.querySelector(":scope > .pt-anno__ink")) return;
    const svg = svgEl("svg", { class: "pt-anno__ink", "aria-hidden": "true", focusable: "false" });
    svg.appendChild(svgEl("path", { pathLength: "1" }));
    el.appendChild(svg);
  }],
  [".pt-check, .pt-radio", (el) => {
    if (el.classList.contains("is-ready")) return;
    const input = el.querySelector("input");
    if (!input) return;
    const r = rng(seedOf(el)), radio = el.classList.contains("pt-radio");
    const svg = svgEl("svg", { width: "22", height: "22", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" });
    svg.appendChild(svgEl("path", { d: radio ? wobblyRing(r) : wobblyBox(r) }));
    svg.appendChild(svgEl("path", { class: "pt-tick", pathLength: "1", d: radio ? DOT : TICK }));
    input.after(svg);
    if (!radio && !el.querySelector(".pt-check__text")) {
      const t = document.createElement("span");
      t.className = "pt-check__text";
      let n = svg.nextSibling;
      while (n) {
        const next = n.nextSibling;
        t.appendChild(n);
        n = next;
      }
      el.appendChild(t);
    }
    el.classList.add("is-ready");
  }],
  [".pt-habits", (el) => {
    let habit = 0, days = 0;
    el.querySelectorAll(":scope > .pt-habits__row").forEach((row) => {
      const head = row.classList.contains("pt-habits__head");
      if (!head) habit++;
      const name = row.querySelector(":scope > .pt-habits__name");
      const cells = Array.from(row.children).filter((c) => c !== name);
      days = Math.max(days, cells.length);
      const at = (c, ra, ca, rb, cb) => {
        c.style.setProperty("--pt-ra", ra);
        c.style.setProperty("--pt-ca", ca);
        c.style.setProperty("--pt-rb", rb);
        c.style.setProperty("--pt-cb", cb);
      };
      const r = head ? 1 : habit + 1;
      if (name) at(name, r, 1, 1, head ? 1 : habit + 1);
      cells.forEach((c, d) => at(c, r, d + 2, d + 2, head ? 1 : habit + 1));
    });
    el.style.setProperty("--pt-habit-count", habit);
    if (!el.style.getPropertyValue("--pt-days")) el.style.setProperty("--pt-days", days);
  }],
  [".pt-habit", (el) => {
    if (el.classList.contains("is-ready")) return;
    const input = el.querySelector("input");
    if (!input) return;
    const svg = svgEl("svg", { width: "20", height: "20", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" });
    svg.appendChild(svgEl("circle", { class: "pt-ring", cx: "12", cy: "12", r: "9" }));
    svg.appendChild(svgEl("path", { class: "pt-fill", pathLength: "1", d: spiral(rng(seedOf(el))) }));
    input.after(svg);
    el.classList.add("is-ready");
  }],
  [".pt-links-mix .pt-link:not([data-ul])", (el, o, i) => {
    el.dataset.ul = UL_MIX[(i + (rng(seedOf(el))() * 3 | 0)) % 3];
  }]
];
function wobble2(el, max) {
  if (el.dataset.ptWobbled) return;
  const r = rng(seedOf(el) + 11);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let count = 0;
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (count > max) break;
    const frag = document.createDocumentFragment();
    for (const part of node.textContent.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part));
        continue;
      }
      const word = document.createElement("span");
      word.style.whiteSpace = "nowrap";
      for (const ch of part) {
        const s = document.createElement("span");
        s.className = "pt-c";
        s.textContent = ch;
        count++;
        s.style.cssText = `--y:${f((r() - 0.5) * 1.2)};--r:${f((r() - 0.5) * 2)};--o:${f(r() < 0.1 ? 0.74 + r() * 0.12 : 0.9 + r() * 0.1)}`;
        word.appendChild(s);
      }
      frag.appendChild(word);
    }
    node.replaceWith(frag);
  }
  el.dataset.ptWobbled = "1";
  if (!el.getAttribute("aria-label") && el.matches("h1,h2,h3,h4,h5,h6,.pt-label--emboss")) el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
}

// src/js/baseline.js
var SNAP_SELECTOR = ":is(h1, h2, h3, h4, p, li, .pt-btn, .pt-snap):not(.pt-nosnap)";
var SKIP = ".pt-sticky, .pt-card, .pt-torn, .pt-ticket, .pt-week, .pt-approval, .pt-nosnap, .pt-tabs, .pt-habits, .pt-photo, .pt-postage, .pt-diagram";
function snapSheet(sheet, scope = sheet) {
  const grid = parseFloat(getComputedStyle(sheet).getPropertyValue("--pt-grid")) || 24;
  const all = Array.from(scope.querySelectorAll(SNAP_SELECTOR));
  const els = all.filter((el) => {
    if (el.closest(SKIP)) return false;
    const up = el.parentElement && el.parentElement.closest(SNAP_SELECTOR);
    return !up || !sheet.contains(up) || up === sheet;
  });
  if (!els.length) return;
  for (const el of els) el.style.translate = "";
  const probes = els.map((el) => {
    const host = el.querySelector(".pt-btn__label") || el;
    const p = document.createElement("span");
    p.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
    host.insertBefore(p, host.firstChild);
    return p;
  });
  const top = sheet.getBoundingClientRect().top + sheet.clientTop;
  const ys = probes.map((p) => p.getBoundingClientRect().top - top);
  probes.forEach((p) => p.remove());
  els.forEach((el, i) => {
    const d = Math.round(Math.round(ys[i] / grid) * grid - ys[i]);
    if (d) el.style.translate = `0 ${d}px`;
  });
}

// src/js/ink.js
var PEN_ASSETS = ["--pt-u-wobble", "--pt-u-slant", "--pt-u-double", "--pt-u-swash", "--pt-u-marker", "--pt-u-wave", "--pt-u-second"];
var RIBBON_ASSETS = ["--pt-r-wobble", "--pt-r-double", "--pt-r-dashes", "--pt-box", "--pt-strike"];
var PEN_DEFAULT = "%23213c6b";
var RIBBON_DEFAULT = "%2324262c";
var templates = null;
function readTemplates() {
  if (templates) return templates;
  const html = document.documentElement;
  templates = {};
  for (const v of [...PEN_ASSETS, ...RIBBON_ASSETS]) templates[v] = cssVar(html, v);
  return templates;
}
function resolve(colour, el = document.documentElement) {
  if (!colour) return "";
  if (/^--/.test(colour)) return cssVar(el, colour);
  if (/^[a-z]+(-[a-z0-9]+)+$/.test(colour)) return cssVar(el, "--pt-" + colour) || colour;
  return colour;
}
function recolour(target, list, from, hex) {
  const t = readTemplates(), to = "%23" + hex.slice(1);
  for (const v of list) if (t[v]) target.style.setProperty(v, t[v].split(from).join(to));
}
function setPen(colour, target = document.documentElement) {
  const hex = toHex(resolve(colour, target));
  target.style.setProperty("--pt-pen", hex);
  recolour(target, PEN_ASSETS, PEN_DEFAULT, hex);
  if (document.getElementById("pt-filters")) injectFilters({ colors: { pen: hex } });
  return hex;
}
function setRibbon(colour, target = document.documentElement) {
  const hex = toHex(resolve(colour, target));
  target.style.setProperty("--pt-ribbon", hex);
  recolour(target, RIBBON_ASSETS, RIBBON_DEFAULT, hex);
  if (document.getElementById("pt-filters")) injectFilters({ colors: { ribbon: hex } });
  return hex;
}
function setPencil(colour, target = document.documentElement) {
  const hex = toHex(resolve(colour, target));
  target.style.setProperty("--pt-pencil", hex);
  return hex;
}
function setHighlighter(colour, target = document.documentElement) {
  const hex = toHex(resolve(colour, target));
  target.style.setProperty("--pt-hl", hex);
  if (document.getElementById("pt-filters")) injectFilters({ colors: { highlighter: hex } });
  return hex;
}

// src/js/planner.js
var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
var KANJI = "\u6708\u706B\u6C34\u6728\u91D1\u571F\u65E5";
var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var set = (el, sel, text) => {
  const n = el.querySelector(sel);
  if (n) n.textContent = text;
};
var dayIndex = (d) => (d.getDay() + 6) % 7;
function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  return Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 864e5 + 1) / 7);
}
function dayHead(el, date = /* @__PURE__ */ new Date()) {
  const i = dayIndex(date);
  set(el, ".pt-dayhead__num", date.getDate());
  set(el, ".pt-dayhead__month", MONTHS[date.getMonth()] + " " + date.getFullYear());
  set(el, ".pt-dayhead__weekday", DAYS[i]);
  set(el, ".pt-dayhead__kanji", KANJI[i]);
  set(el, ".pt-dayhead__weekno", "Week " + isoWeek(date));
}
function week(el, date = /* @__PURE__ */ new Date()) {
  const i = dayIndex(date), mon = new Date(date);
  mon.setDate(date.getDate() - i);
  el.querySelectorAll(".pt-week__day").forEach((d, k) => {
    const dt = new Date(mon);
    dt.setDate(mon.getDate() + k);
    const ds = d.querySelector(".pt-week__date");
    if (!ds) return;
    ds.textContent = dt.getDate();
    const today = k === i;
    ds.classList.toggle("pt-anno", today);
    if (today) {
      ds.dataset.anno = "circle";
      ds.style.cssText = "--pt-anno:var(--pt-ink-beni);--pt-ox:6px;--pt-oy:3px";
    }
  });
}

// src/js/palette.js
var PALETTE = {
  inks: [
    ["ink-sumi", "Sumi", "\u58A8", "ink-stick black", "#232429"],
    ["ink-blueblack", "Blue-black", "", "the classic office ink", "#263252"],
    ["ink-kon", "Kon", "\u7D3A", "navy", "#22305e"],
    ["ink-ai", "Ai", "\u85CD", "indigo", "#213c6b"],
    ["ink-konpeki", "Konpeki", "\u7D3A\u78A7", "deep sky blue", "#1f5a9e"],
    ["ink-tsuyukusa", "Tsuyukusa", "\u9732\u8349", "dayflower blue", "#2f6db5"],
    ["ink-asagi", "Asagi", "\u6D45\u8471", "pale leek blue-green", "#12737e"],
    ["ink-hisoku", "Hisoku", "\u79D8\u8272", "celadon", "#3f7f77"],
    ["ink-wakatake", "Wakatake", "\u82E5\u7AF9", "young bamboo", "#3c7a4c"],
    ["ink-matcha", "Matcha", "\u62B9\u8336", "powdered green tea", "#5d7334"],
    ["ink-uguisu", "Uguisu", "\u9DAF", "bush warbler olive", "#6b6b2a"],
    ["ink-yamabuki", "Yamabuki", "\u5C71\u5439", "kerria gold", "#b9800f"],
    ["ink-kaki", "Kaki", "\u67FF", "persimmon", "#c25a26"],
    ["ink-shu", "Shu", "\u6731", "vermilion", "#c13d25"],
    ["ink-beni", "Beni", "\u7D05", "safflower red", "#a52a45"],
    ["ink-sakura", "Sakura", "\u685C", "cherry blossom", "#c2637f"],
    ["ink-fuji", "Fuji", "\u85E4", "wisteria", "#6b5aa6"],
    ["ink-edomurasaki", "Edo murasaki", "\u6C5F\u6238\u7D2B", "Edo purple", "#5b3f86"],
    ["ink-tobi", "Tobi", "\u9CF6", "kite brown", "#714a36"],
    ["ink-kakishibu", "Kakishibu", "\u67FF\u6E0B", "persimmon tannin", "#8a5030"],
    ["ink-nezumi", "Nezumi", "\u9F20", "mouse grey", "#5f6066"]
  ],
  ribbons: [
    ["ribbon-black", "Black", "", "a fresh ribbon", "#24262c"],
    ["ribbon-blue", "Carbon blue", "", "", "#2b3550"],
    ["ribbon-faded", "Faded", "", "a ribbon near its end", "#55565c"],
    ["ribbon-red", "Red", "", "the red half of a two-colour ribbon", "#9e2b25"]
  ],
  ballpoints: [
    ["bp-blue", "Blue", "", "", "#2b40b0"],
    ["bp-black", "Black", "", "", "#1d1e22"],
    ["bp-red", "Red", "", "", "#c2302d"],
    ["bp-green", "Green", "", "", "#2c7a4b"]
  ],
  graphite: [
    ["pencil-2h", "2H", "", "hard and light", "#9a9ca3"],
    ["pencil-hb", "HB", "", "the everyday pencil", "#6a6c72"],
    ["pencil-2b", "2B", "", "soft", "#4d4f55"],
    ["pencil-6b", "6B", "", "soft and dark", "#2f3136"]
  ],
  colourPencils: [
    ["pencil-red", "Red", "", "for corrections", "#c8432f"],
    ["pencil-vermilion", "Vermilion", "", "", "#d65a2e"],
    ["pencil-yellow", "Yellow", "", "", "#d9a521"],
    ["pencil-green", "Green", "", "", "#4f8a4a"],
    ["pencil-sky", "Sky blue", "", "", "#4a90c9"],
    ["pencil-blue", "Blue", "", "for editing", "#2f62b8"],
    ["pencil-violet", "Violet", "", "", "#7a5aa8"],
    ["pencil-pink", "Pink", "", "", "#d0607e"],
    ["pencil-brown", "Brown", "", "", "#8a5a3c"],
    ["pencil-black", "Black", "", "", "#34363b"]
  ],
  highlighters: [
    ["hl-yellow", "Yellow", "", "", "#fff04a"],
    ["hl-pink", "Pink", "", "", "#ff8fc4"],
    ["hl-green", "Green", "", "", "#a8f28e"],
    ["hl-orange", "Orange", "", "", "#ffc06a"],
    ["hl-blue", "Blue", "", "", "#9fd8ff"]
  ],
  stamps: [
    ["stamp-red", "Shuniku red", "\u6731\u8089", "seal paste", "#c0312b"],
    ["stamp-vermilion", "Vermilion", "\u6731", "", "#d23c22"],
    ["stamp-blue", "Blue pad", "", "", "#2a4fa8"],
    ["stamp-green", "Green pad", "", "", "#2f7d4a"],
    ["stamp-pink", "Pink pad", "", "", "#e0558a"],
    ["stamp-brown", "Brown pad", "", "", "#8a5a3c"]
  ],
  papers: [
    ["white", "White", "", "", "#fcfbf7"],
    ["cream", "Cream", "", "", "#f8f1df"],
    ["washi", "Washi", "\u548C\u7D19", "Japanese paper", "#f6f2e6"],
    ["kraft", "Kraft", "", "", "#c9a67a"],
    ["recycled", "Recycled", "", "", "#e9e8e2"],
    ["tracing", "Tracing", "", "", "#f4f6f6"]
  ]
};

// src/js/index.js
var VERSION = "0.3.0";
var DEFAULTS2 = {
  root: null,
  // element to enhance; defaults to document.body
  seed: null,
  // a number makes every drawing repeatable
  filters: true,
  // inject the SVG filters (false if you paste dist/papertooth-filters.svg yourself)
  filterParams: {},
  // see FILTER_DEFAULTS: text, head, graphite, stamp, smudge, smear, typewriter
  snap: true,
  // put text on the grid inside .pt-sheet
  lazy: true,
  // draw shapes only when they come near the screen
  lazyMargin: "600px",
  motion: "scroll",
  // 'scroll' | 'load' | 'none'
  drawSelector: "[data-pt-draw]",
  drawAll: true,
  // draw every mark as it comes into view, not only inside [data-pt-draw] blocks
  drawOnLoad: false,
  // also draw on what is already on screen when the page opens (costs more on slow phones)
  stagger: 0.12,
  // seconds between items drawing on inside one block
  highlight: "swipe",
  // default highlighter style for .pt-btn and .pt-mark
  outline: "sketch",
  // default outline for .pt-btn--outline
  wobbleMax: 400,
  // letters split per .pt-wobble element
  observe: true,
  // enhance elements added to the page later
  today: true,
  // fill .pt-dayhead[data-today] and .pt-week[data-today] with today
  pen: null,
  pencil: null,
  ribbon: null,
  highlighter: null
};
var DECORATE_SELECTOR = DECORATORS.map((d) => d[0]).join(",");
function init(options = {}) {
  const o = { ...DEFAULTS2, ...options };
  const root = o.root || document.body;
  const html = document.documentElement;
  if (o.seed != null) setSeed(o.seed);
  const scheduler = createScheduler(o);
  const watchers = createWatchers(scheduler, o);
  const seen = /* @__PURE__ */ new WeakSet();
  if (o.filters) injectFilters(o.filterParams);
  if (o.pen) setPen(o.pen);
  if (o.pencil) setPencil(o.pencil);
  if (o.ribbon) setRibbon(o.ribbon);
  if (o.highlighter) setHighlighter(o.highlighter);
  const SEL_TEXT = ".pt-sheet :is(p, li, h1, h2, h3, h4, blockquote), .pt-btn__label, .pt-mark__ink";
  let selFrame = 0, selected = [];
  const onSelection = () => {
    if (selFrame) return;
    selFrame = requestAnimationFrame(() => {
      selFrame = 0;
      const sel = document.getSelection(), now = [];
      if (sel && !sel.isCollapsed && sel.rangeCount) {
        const range = sel.getRangeAt(0), base2 = range.commonAncestorContainer;
        const scope = base2.nodeType === 1 ? base2 : base2.parentElement;
        const cands = /* @__PURE__ */ new Set([...scope ? scope.querySelectorAll(SEL_TEXT) : []]);
        for (let n = scope; n && n !== document.body; n = n.parentElement) if (n.matches(SEL_TEXT)) cands.add(n);
        cands.forEach((el) => {
          if (sel.containsNode(el, true)) now.push(el);
        });
      }
      selected.forEach((el) => {
        if (!now.includes(el)) el.classList.remove("pt-selecting");
      });
      now.forEach((el) => el.classList.add("pt-selecting"));
      selected = now;
    });
  };
  document.addEventListener("selectionchange", onSelection);
  let mo = null;
  const quiet = () => {
    if (mo) mo.takeRecords();
  };
  function scan(scope) {
    if (scope.nodeType !== 1 || !scope.isConnected) return;
    const has = (sel) => (scope.matches(sel) ? [scope] : []).concat(Array.from(scope.querySelectorAll(sel)));
    has(".pt-wobble, .pt-label--emboss").forEach((el) => wobble2(el, o.wobbleMax));
    if (o.today) {
      has(".pt-dayhead[data-today]").forEach((el) => dayHead(el));
      has(".pt-week[data-today]").forEach((el) => week(el));
    }
    for (const [sel, fn] of DECORATORS) has(sel).forEach((el, i) => fn(el, o, i));
    has(".pt-sheet").forEach(watchSheet);
    has(PAINT_SELECTOR).forEach((el) => {
      if (!seen.has(el)) {
        seen.add(el);
        watchers.watch(el);
      }
    });
    if (o.motion !== "none") {
      has(o.drawSelector).forEach((b) => {
        if (b.dataset.ptDraw !== "off") prepareDraw(b);
      });
      if (o.drawAll) {
        const blocks = /* @__PURE__ */ new Set();
        has(DRAWABLE).forEach((el) => {
          if (el.closest("[data-pt-draw]")) return;
          const block = el.closest(".pt-sheet > *") || el;
          if (!block.closest('[data-pt-draw="off"]')) blocks.add(block);
        });
        const still = booting && !o.drawOnLoad && drawIO ? new Set([...blocks].filter((b) => {
          const r = b.getBoundingClientRect();
          return r.bottom > 0 && r.top < innerHeight;
        })) : /* @__PURE__ */ new Set();
        blocks.forEach((block) => {
          if (still.has(block)) {
            block.setAttribute("data-pt-draw", "off");
            return;
          }
          block.setAttribute("data-pt-draw", "");
          prepareDraw(block);
        });
      }
    }
    quiet();
  }
  const DRAWABLE = ".pt-anno, .pt-btn, .pt-rule, .pt-link, .pt-mark, .pt-stamp, .pt-tape, .pt-sticky, .pt-flag, .pt-torn, .pt-ticket, .pt-photo, .pt-postage, .pt-label, .pt-progress, .pt-diagram, .pt-draw-path";
  let drawIO = null;
  if (o.motion !== "none" && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    html.classList.add("pt-motion");
    if (o.motion === "scroll" && "IntersectionObserver" in window) {
      drawIO = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) {
          e.target.classList.add("is-drawn");
          drawIO.unobserve(e.target);
        }
      }, { threshold: 0.2 });
    }
  }
  function prepareDraw(block) {
    if (block.dataset.ptDrawReady) return;
    block.dataset.ptDrawReady = "1";
    const items = block.matches(DRAWABLE) ? [block] : [];
    items.push(...block.querySelectorAll(DRAWABLE));
    items.forEach((it, i) => it.style.setProperty("--pt-delay", Math.min(i * o.stagger, 1.4).toFixed(2) + "s"));
    if (drawIO) drawIO.observe(block);
    else block.classList.add("is-drawn");
  }
  function replay(scope = root) {
    const blocks = (scope.matches && scope.matches(o.drawSelector) ? [scope] : []).concat(Array.from(scope.querySelectorAll(o.drawSelector))).filter((b) => b.dataset.ptDraw !== "off");
    blocks.forEach((b) => b.classList.remove("is-drawn"));
    void document.body.offsetWidth;
    blocks.forEach((b) => {
      const r = b.getBoundingClientRect();
      if (!drawIO || r.bottom > 0 && r.top < innerHeight) b.classList.add("is-drawn");
      else drawIO.observe(b);
    });
  }
  const sheets = () => Array.from((root.matches && root.matches(".pt-sheet") ? [root] : []).concat(Array.from(root.querySelectorAll(".pt-sheet"))));
  let snapFrame = 0;
  function snap() {
    if (!o.snap) return;
    cancelAnimationFrame(snapFrame);
    snapFrame = requestAnimationFrame(() => {
      sheets().forEach((s) => snapSheet(s));
      quiet();
    });
  }
  const widths = /* @__PURE__ */ new WeakMap();
  const sheetRO = "ResizeObserver" in window ? new ResizeObserver((entries) => {
    let changed = false;
    for (const e of entries) {
      const w = Math.round(e.contentRect.width);
      if (widths.get(e.target) !== w) {
        widths.set(e.target, w);
        changed = true;
      }
    }
    if (changed) snap();
  }) : null;
  const onVisibility = (e) => {
    if (!e.skipped) snap();
  };
  const watched = /* @__PURE__ */ new Set();
  function watchSheet(s) {
    if (watched.has(s)) return;
    watched.add(s);
    if (sheetRO) sheetRO.observe(s);
    s.addEventListener("contentvisibilityautostatechange", onVisibility, true);
  }
  let booting = true, destroyed = false;
  scan(root);
  booting = false;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
    if (!destroyed) refresh();
  });
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  const onScheme = () => refresh();
  scheme.addEventListener("change", onScheme);
  snap();
  if (o.observe && "MutationObserver" in window) {
    let pending = /* @__PURE__ */ new Set(), queued = false;
    mo = new MutationObserver((list) => {
      for (const m of list) m.addedNodes.forEach((n) => {
        if (n.nodeType === 1 && !n.closest("#pt-filters")) pending.add(n);
      });
      if (pending.size && !queued) {
        queued = true;
        queueMicrotask(() => {
          queued = false;
          const nodes = pending;
          pending = /* @__PURE__ */ new Set();
          nodes.forEach(scan);
          snap();
        });
      }
    });
    mo.observe(root, { childList: true, subtree: true });
  }
  function refresh(scope = root) {
    const els = (scope.matches && scope.matches(PAINT_SELECTOR) ? [scope] : []).concat(Array.from(scope.querySelectorAll(PAINT_SELECTOR)));
    els.forEach((el) => {
      scheduler.forget(el);
      if (watchers.isStarted(el)) scheduler.request(el);
    });
    snap();
  }
  const after = (fn) => (...a) => {
    const v = fn(...a);
    refresh();
    return v;
  };
  return {
    options: o,
    refresh,
    replay,
    snap,
    scan,
    // shapes drawn into images bake their ink in, so every change of instrument redraws them
    setPen: after(setPen),
    setPencil: after(setPencil),
    setRibbon: after(setRibbon),
    setHighlighter: after(setHighlighter),
    setFilters: (params) => injectFilters(params),
    setTypewriter: (params) => injectFilters({ typewriter: params }),
    planner: { dayHead, week, isoWeek },
    destroy() {
      destroyed = true;
      document.removeEventListener("selectionchange", onSelection);
      scheme.removeEventListener("change", onScheme);
      cancelAnimationFrame(selFrame);
      cancelAnimationFrame(snapFrame);
      scheduler.stop();
      watchers.disconnect();
      if (drawIO) drawIO.disconnect();
      if (sheetRO) sheetRO.disconnect();
      if (mo) mo.disconnect();
      watched.forEach((s) => s.removeEventListener("contentvisibilityautostatechange", onVisibility, true));
      watched.clear();
      selected.forEach((el) => el.classList.remove("pt-selecting"));
      html.classList.remove("pt-motion");
    }
  };
}
export {
  DEFAULTS2 as DEFAULTS,
  DEFAULTS as FILTER_DEFAULTS,
  PALETTE,
  VERSION,
  dayHead,
  filtersMarkup,
  init,
  isoWeek,
  lithoFilter,
  renderDiagram,
  setHighlighter,
  setPen,
  setPencil,
  setRibbon,
  smearColour,
  typewriterFilter,
  week
};
