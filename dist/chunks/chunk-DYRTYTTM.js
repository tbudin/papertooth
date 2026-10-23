/*! papertooth v0.4.1 | (c) 2026 Thomas Budin | MIT License | github.com/tbudin/papertooth */
import {
  FILLS,
  band,
  hatchD,
  swipesD
} from "./chunk-Y5X4XYAH.js";
import {
  curve,
  f,
  jit,
  rng,
  stroke
} from "./chunk-TVJQOPJV.js";

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
  let body = "", defs = "", a0 = -Math.PI / 2;
  p.items.forEach((it, k) => {
    const a1 = a0 + it.value / total * Math.PI * 2, col = SERIES[k % SERIES.length], mid = (a0 + a1) / 2;
    const pts = [[cx, cy]];
    for (let t = a0; t <= a1 + 1e-6; t += 0.04) pts.push(at(t, 0.985));
    pts.push(at(a1, 0.985));
    defs += `<clipPath id="p-${o.uid}-${k}"><polygon points="${pts.map((q) => q.map(f).join(",")).join(" ")}"/></clipPath>`;
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
  return svgWrap(0, 0, w, h, `<defs>${defs}</defs>${body}<g class="pt-diagram__text">${legend}${title}</g>`, "Pie chart" + (p.title ? ": " + p.title : ""));
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

export {
  measurer,
  kindOf,
  parseFlow,
  parsePie,
  parseXY,
  renderFlow,
  renderPie,
  renderXY,
  renderDiagram
};
