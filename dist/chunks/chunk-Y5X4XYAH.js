/*! papertooth v0.4.1 | (c) 2026 Thomas Budin | MIT License | github.com/tbudin/papertooth */
import {
  brushFilter,
  curve,
  f,
  jit,
  stroke
} from "./chunk-TVJQOPJV.js";

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
var textured = (t) => grainy(t) || t.kind === "brush";
function toolDefs(t, id = "pg") {
  if (t.kind === "brush") return brushFilter(id);
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
  const base = `fill="none" stroke="${c}" stroke-linecap="round" stroke-linejoin="round"${opts.nonScaling ? ' vector-effect="non-scaling-stroke"' : ""}`;
  const dash = t.kind === "ballpoint" ? ` stroke-dasharray="${opts.dash || "38 1.1 61 .7 23 1.4"}"` : "";
  let out = passes({ ...t, w }, opts.nonScaling).map(([dx, dy, k, o]) => `<path d="${d}" ${base} stroke-width="${f(w * k)}" stroke-opacity="${f(op * o * 100) / 100}"${dash}${dx || dy ? ` transform="translate(${f(dx)} ${f(dy)})"` : ""}/>`).join("");
  if (t.kind === "marker") out = `<g style="mix-blend-mode:multiply">${out}</g>`;
  if (t.kind === "pen" && !opts.nonScaling && op > 0.5) {
    out += ends(d).slice(0, 24).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(w * 0.55)}" fill="${c}" fill-opacity="${f(op * 55) / 100}"/>`).join("");
  }
  return textured(t) && !opts.noFilter ? `<g filter="url(#${opts.filterId || "pg"})">${out}</g>` : out;
}
function inkFill(d, t, opts = {}) {
  const fill2 = `<path d="${d}" fill="${t.color}" fill-opacity="${f(t.op * (t.kind === "marker" ? 0.86 : 1) * 100) / 100}"/>`;
  return textured(t) && !opts.noFilter ? `<g filter="url(#${opts.filterId || "pg"})">${fill2}</g>` : fill2;
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
function stippleD(x, y, w, h, r, density = 0.1) {
  let d = "";
  const n = Math.round(w * h * density / 10);
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
  // an X through something that is over, such as a day gone by
  x: (w, h, r) => stroke([2, 2], [w - 2, h - 2], r, 1.5, 2) + " " + stroke([w - 2, 2], [2, h - 2], r, 1.5, 2),
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

export {
  toolOf,
  toolKey,
  toolDefs,
  passes,
  inkPath,
  band,
  HIGHLIGHT,
  POOL_Y,
  HEAVY_START,
  secondPass,
  gradient,
  hatchD,
  swipesD,
  FILLS,
  OUTLINE,
  RULE,
  LINK,
  STRIKE,
  WAVE_W,
  waveD,
  ANNO,
  progressSVG,
  SWATCH,
  spiral,
  wobblyBox,
  wobblyRing,
  TICK,
  DOT
};
