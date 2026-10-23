// Shape generators. Each takes a width, a height and a seeded random function, and returns SVG.
import { f, curve, jit, stroke } from './core.js';
import { inkPath, inkFill, toolDefs } from './tools.js';

/* ---------- highlighter ---------- */
// a closed felt-tip band: bowed, rising a little, ragged where the nib lands, chisel at the end
export function band(w, h, r, o) {
  const n = Math.max(4, Math.round(w / 34)), top = [], bot = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = o.x0 + (o.x1 - o.x0) * u, bow = Math.sin(Math.PI * u) * o.bow;
    let ty = h * (o.t0 + (o.t1 - o.t0) * u) - bow + (r() - .5) * 1.3;
    let by = h * (o.b0 + (o.b1 - o.b0) * u) - bow * .6 + (r() - .5) * 1.3;
    if (o.taper && u > .62) {
      const k = (u - .62) / .38, mid = (ty + by) / 2 - k * h * .1;
      ty += (mid - ty) * k * .8; by += (mid - by) * k * .8;
    }
    top.push([x, ty]); bot.push([x, by]);
  }
  const te = top[n], be = bot[n], ts = top[0], bs = bot[0], hg = be[1] - te[1], my = (ts[1] + bs[1]) / 2;
  return curve(top, true)
    + ` C${f(te[0] + 3)} ${f(te[1] + hg * .25)} ${f(be[0] + 2.5)} ${f(be[1] - hg * .3)} ${f(be[0])} ${f(be[1])}`
    + curve(bot.slice().reverse(), false)
    + ` L${f(bs[0] + 1.5)} ${f(bs[1] - 2.5)} L${f(ts[0] - 1 - r() * 2)} ${f(my + 2 + r() * 3)} L${f(ts[0] + 2)} ${f(my - 1)} L${f(ts[0] + .5)} ${f(ts[1] + 2)} Z`;
}
const fill = (d, op) => `<path d="${d}" fill="url(#g)" fill-opacity="${op}"/>`;

export const HIGHLIGHT = {
  swipe: (w, h, r) => [fill(band(w, h, r, { t0: .2, t1: .1, b0: .9, b1: .8, x0: 3 + r() * 3, x1: w - 3, bow: 2.4 }), 1)],
  // pressed hard at the start, lifted off at the end
  flick: (w, h, r) => [fill(band(w, h, r, { t0: .22, t1: .1, b0: .9, b1: .76, x0: 2, x1: w - 1, bow: 1.4, taper: true }), 1)],
  double: (w, h, r) => [
    fill(band(w, h, r, { t0: .1, t1: .04, b0: .66, b1: .58, x0: 2, x1: w - 8 - r() * 6, bow: 2 }), .72),
    fill(band(w, h, r, { t0: .4, t1: .32, b0: .97, b1: .9, x0: 10 + r() * 10, x1: w - 2, bow: 1.4 }), .72)
  ],
  low: (w, h, r) => [fill(band(w, h, r, { t0: .54, t1: .47, b0: .99, b1: .93, x0: 2, x1: w - 2, bow: 1 }), 1)],
  // a felt tip running dry: full where it lands, then the felt splits into long streaks
  // with paper showing between them; the outer streaks give out first
  dry: (w, h, r) => {
    const shape = band(w, h, r, { t0: .18, t1: .12, b0: .88, b1: .8, x0: 2, x1: w - 3, bow: 1.6 });
    const top = h * .15, bot = h * .86, n = Math.max(6, Math.round((bot - top) / 2.6)), pitch = (bot - top) / n;
    let streaks = '';
    for (let i = 0; i < n; i++) {
      const edge = Math.abs((i + .5) / n - .5) * 2;               // 0 in the middle, 1 at the edges
      const end = w * Math.min(1, .55 + r() * .45 + (1 - edge) * .3);
      const y0 = top + pitch * (i + .5) + (r() - .5) * pitch * .3;
      const th = pitch * (.55 + r() * .4);                         // thickness, leaving a thin gap
      const pts = [], k = Math.max(3, Math.round(end / 26));
      for (let j = 0; j <= k; j++) {
        const u = j / k, x = 2 + (end - 2) * u;
        pts.push([x, y0 - u * h * .06 + (r() - .5) * .5, th * (1 - u * u * .5)]);
      }
      // a streak can break once towards its end, where the felt skips
      const brk = r() < .5 ? .55 + r() * .35 : 2;
      const seg = (from, to) => {
        const p = pts.filter((_, j) => j / k >= from && j / k <= to);
        if (p.length < 2) return '';
        const up = p.map(q => [q[0], q[1] - q[2] / 2]), dn = p.map(q => [q[0], q[1] + q[2] / 2]).reverse();
        return 'M' + up.concat(dn).map(q => f(q[0]) + ' ' + f(q[1])).join(' L') + 'Z ';
      };
      streaks += `<path d="${brk < 1 ? seg(0, brk) + seg(brk + .06, 1) : seg(0, 1)}" fill="url(#g)" fill-opacity="${f((.72 + r() * .28) * 100) / 100}"/>`;
    }
    // where the nib landed the felt is still wet: short tapered fillers close the gaps, then give out one by one
    let head = '';
    for (let i = 0; i <= n; i++) {
      const y = top + pitch * i + (r() - .5) * .4, len = w * (.06 + r() * .22), th = pitch * .75;
      head += `<path d="M2 ${f(y - th / 2)} L${f(len)} ${f(y - len / w * h * .06)} L2 ${f(y + th / 2)}Z" fill="url(#g)" fill-opacity=".8"/>`;
    }
    return [`<clipPath id="dc"><path d="${shape}"/></clipPath>`,
      `<g clip-path="url(#dc)"><path d="${shape}" fill="url(#g)" fill-opacity=".14"/>${head}${streaks}</g>`];
  },
  scribble: (w, h, r) => {
    const out = [], sw = h * .26;
    let x = 4 + r() * 3, up = true, prev = [x, h * (.78 + r() * .12)];
    while (x < w - 6) {
      x = Math.min(w - 4, x + 5 + r() * 8);
      const next = [x, up ? h * (.12 + r() * .14) : h * (.76 + r() * .16)];
      const cx = (prev[0] + next[0]) / 2 + (r() - .5) * 6, cy = (prev[1] + next[1]) / 2 + (r() - .5) * 5;
      out.push(`<path d="M${f(prev[0])} ${f(prev[1])} Q${f(cx)} ${f(cy)} ${f(next[0])} ${f(next[1])}" fill="none" stroke="url(#g)" stroke-width="${f(sw)}" stroke-linecap="round" stroke-opacity=".72"/>`);
      prev = next; up = !up;
    }
    return out;
  }
};
export const POOL_Y = { low: '76%', double: '62%' };
/** Strokes that start heavy and fade, instead of building up to the end. */
export const HEAVY_START = new Set(['flick', 'dry']);
export const secondPass = (style, w, h, r) => style === 'scribble'
  ? HIGHLIGHT.scribble(w, h, r)
  : [fill(band(w, h, r, { t0: style === 'low' ? .6 : .32, t1: style === 'low' ? .55 : .26, b0: .8, b1: .74, x0: w * .16, x1: w - 4, bow: 1.4 }), 1)];

/** Ink density along the stroke: by default lighter where the nib lands and fullest at the end. */
export const gradient = (w, color, heavyStart) => {
  const stops = heavyStart ? [[0, 1], [.12, 1], [.5, .86], [.86, .66], [1, .48]] : [[0, .5], [.14, .72], [.5, .87], [.86, 1], [1, 1]];
  return `<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${f(w)}" y2="0">`
    + stops.map(([o, a]) => `<stop offset="${o}" stop-color="${color}" stop-opacity="${a}"/>`).join('') + '</linearGradient></defs>';
};

/* ---------- fills: hatching, cross-hatching, scribble, stipple ---------- */
// hand hatching is never even: the gap, the angle and the length of each stroke all drift
export function hatchD(x, y, w, h, r, gap = 5, angle = 1) {
  let d = '';
  const lo = Math.min(0, -h * angle) - 4, hi = w + Math.max(0, -h * angle) + 4;
  for (let k = lo; k < hi;) {
    const a = angle * (1 + (r() - .5) * .3), x0 = x + k + (r() - .5) * 1.5;
    const s = r() < .3 ? r() * .25 : 0, e = r() < .3 ? 1 - r() * .25 : 1;
    const p0 = [x0 + h * a * s, y + h - h * s], p1 = [x0 + h * a * e, y + h - h * e];
    d += stroke(p0, p1, r, .8, 1.6) + ' ';
    if (r() < .1) d += stroke([p0[0] + 1.2, p0[1]], [p1[0] + 1.4, p1[1]], r, .4, 1) + ' ';
    k += gap * (.55 + r() * .95);
  }
  return d;
}
export function scribbleD(x, y, w, h, r, step = 6) {
  const pts = [];
  let t = x - 2, up = r() < .5;
  while (t < x + w + 2) { pts.push([t, up ? y + h * (r() * .15) : y + h * (1 - r() * .15)]); t += step * (.6 + r() * .8); up = !up; }
  return curve(pts, true);
}
export function stippleD(x, y, w, h, r, density = .1) {
  let d = '';
  const n = Math.round(w * h * density / 10);
  for (let i = 0; i < n; i++) { const px = x + r() * w, py = y + r() * h; d += `M${f(px)} ${f(py)} h.01 `; }
  return d;
}
// shading with the side of a pencil: close, flat, light strokes laid in two directions so they read as tone
export function pencilD(x, y, w, h, r) {
  // tight back-and-forth strokes in overlapping bands; the grain filter turns them into tone
  const rh = Math.max(6, Math.min(h + 2, 13)), rows = Math.max(1, Math.ceil((h + 2) / (rh * .7)));
  let d = '';
  for (let i = 0; i < rows; i++) {
    const y0 = y - 1 + i * rh * .7 + (r() - .5) * 1.5, y1 = y0 + rh;
    let t = x - 4 - r() * 3, up = r() < .5, pts = '';
    while (t < x + w + 4) {
      pts += `${pts ? ' L' : 'M'}${f(t + (up ? 2.5 : 0))} ${f((up ? y0 : y1) + (r() - .5) * 2)}`;
      t += .9 + r() * 1.1; up = !up;
    }
    d += pts + ' ';
  }
  return d;
}
/** Overlapping highlighter swipes along the area's longer side, one path per swipe so the overlaps build up. */
export function swipesD(x, y, w, h, r) {
  // a tall area is filled up and down, the way you would colour in a bar
  if (h > w * 1.15) return swipesAt(x + w / 2, y + h / 2, h, w, Math.PI / 2, r);
  return rowsOfSwipes(x, y, w, h, r);
}
function rowsOfSwipes(x, y, w, h, r) {
  const bh = Math.max(8, Math.min(15, h + 4)), n = Math.max(1, Math.ceil((h + 4 - bh) / (bh * .72)) + 1);
  const step = n > 1 ? (h + 4 - bh) / (n - 1) : 0, out = [];
  for (let i = 0; i < n; i++) {
    const oy = y - 2 + (n > 1 ? i * step : (h - bh) / 2), ox = x - 3 - r() * 3, sw = w + 6 + r() * 4;
    out.push(band(sw, bh, r, { t0: .1, t1: .05, b0: .94, b1: .9, x0: 1, x1: sw - 1, bow: .8 })
      .replace(/(-?[\d.]+) (-?[\d.]+)/g, (m, a, b) => `${f(+a + ox)} ${f(+b + oy)}`));
  }
  return out;
}
/** Swipes covering a box of length `len` and width `wid`, centred on (cx, cy) and turned to `angle`. */
export function swipesAt(cx, cy, len, wid, angle, r) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return rowsOfSwipes(-len / 2, -wid / 2, len, wid, r).map(d =>
    d.replace(/(-?[\d.]+) (-?[\d.]+)/g, (m, a, b) => `${f(cx + a * c - b * s)} ${f(cy + a * s + b * c)}`));
}
export const FILLS = {
  hatch: (x, y, w, h, r) => hatchD(x, y, w, h, r, 5, 1),
  cross: (x, y, w, h, r) => hatchD(x, y, w, h, r, 6, 1) + hatchD(x, y, w, h, r, 7, -1.1),
  scribble: (x, y, w, h, r) => scribbleD(x, y, w, h, r, 5),
  stipple: (x, y, w, h, r) => stippleD(x, y, w, h, r, .9),
  pencil: pencilD
};

/* ---------- outlines ---------- */
function sketchBox(w, h, r, gaps) {
  const x0 = 4, y0 = 7, x1 = w - 4, y1 = h - 7;
  const c = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(p => jit(p, r, 2.4));
  let d = '';
  for (let i = 0; i < 4; i++) {
    const a = c[i], b = c[(i + 1) % 4];
    if (!gaps) { d += stroke(a, b, r, 3.5, 3) + ' '; continue; }
    const n = 1 + (r() < .6 ? 1 : 0), cuts = [0];
    for (let k = 1; k <= n; k++) cuts.push(k / (n + 1) + (r() - .5) * .15);
    cuts.push(1);
    const p = u => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    for (let k = 0; k < cuts.length - 1; k++) {
      d += stroke(p(cuts[k] + (k ? .02 : 0)), p(cuts[k + 1] - (k < cuts.length - 2 ? .02 : 0)), r, k ? .5 : 2.5, 1.6) + ' ';
    }
  }
  return d;
}
export { sketchBox };
function loop(w, h, r, pad) {
  const cx = w / 2 + (r() - .5) * 3, cy = h / 2, rx = w / 2 - pad, ry = h / 2 - pad - .5;
  const t0 = Math.PI * (.85 + r() * .25), sweep = Math.PI * 2 * (1.08 + r() * .08), ph = r() * 6, tilt = (r() - .5) * .06, pts = [];
  for (let t = 0; t <= sweep; t += .08) {
    const u = t / sweep, k = 1 + .04 * Math.sin(3 * t + ph) - .08 * u;
    const ex = Math.cos(t0 + t) * rx * k, ey = Math.sin(t0 + t) * ry * (k + .05 * u);
    pts.push(`${f(cx + ex - ey * tilt)} ${f(cy + ey + ex * tilt - u * 1.5)}`);
  }
  return 'M' + pts.join(' L');
}
export { loop };

/* brackets: one side is a list of points; it is drawn through them with a little wobble, then gone over once more, lightly */
const BRACKET = {
  square: (x, y0, y1, dir, arm) => [[x + dir * arm, y0 + .5], [x + .3 * dir, y0], [x, (y0 + y1) / 2], [x + .3 * dir, y1], [x + dir * arm, y1 - .5]],
  round: (x, y0, y1, dir, arm) => [[x + dir * arm, y0], [x + dir * arm * .2, y0 + (y1 - y0) * .2], [x, (y0 + y1) / 2], [x + dir * arm * .2, y1 - (y1 - y0) * .2], [x + dir * arm, y1]],
  curly: (x, y0, y1, dir, arm) => { const m = (y0 + y1) / 2; return [[x + dir * arm, y0], [x + dir * arm * .35, y0 + 3], [x + dir * arm * .35, m - 5], [x - dir * arm * .15, m], [x + dir * arm * .35, m + 5], [x + dir * arm * .35, y1 - 3], [x + dir * arm, y1]]; },
  angle: (x, y0, y1, dir, arm) => [[x + dir * arm, y0], [x, (y0 + y1) / 2], [x + dir * arm, y1]]
};
function bracketPair(kind, w, h, r, t) {
  const y0 = 5 + r() * 2, y1 = h - 5 - r() * 2, arm = Math.min(10, h * .28) + r() * 3;
  const side = (x, dir) => {
    const pts = BRACKET[kind](x, y0, y1, dir, kind === 'curly' ? arm * 1.1 : arm).map(p => jit(p, r, 1.4));
    // overshoot past the first point, as a quick pen does
    pts.unshift([pts[0][0] + dir * (1 + r() * 2), pts[0][1] - (r() - .3) * 1.5]);
    return kind === 'square' || kind === 'angle' ? 'M' + pts.map(p => p.map(f).join(' ')).join(' L') : curve(pts, true);
  };
  const d = side(5, 1) + ' ' + side(w - 5, -1);
  const again = side(5.6, 1) + ' ' + side(w - 5.4, -1);
  return inkPath(d, t) + inkPath(again, t, { op: .35, scale: .7 });
}
function kagi(w, h, r, t) {
  // 「 at the top left and 」 at the bottom right, as in Japanese quotation marks
  const a = Math.min(14, w * .16), b = Math.min(12, h * .4);
  const tl = [[5 + a, 6], [5, 6.3], [5.3, 6 + b]].map(p => jit(p, r, 1.2));
  const br = [[w - 5 - a, h - 6], [w - 5, h - 6.3], [w - 5.3, h - 6 - b]].map(p => jit(p, r, 1.2));
  const pl = q => 'M' + q.map(p => p.map(f).join(' ')).join(' L');
  return inkPath(pl(tl) + ' ' + pl(br), t) + inkPath(pl(tl.map(p => [p[0] + .6, p[1] + .5])) + ' ' + pl(br.map(p => [p[0] - .5, p[1] - .6])), t, { op: .35, scale: .7 });
}
function lenticular(w, h, r, t) {
  // 【 】: two filled brackets, heavy in the middle and pointed at both ends
  const side = (x, dir) => {
    const y0 = 5, y1 = h - 5, m = (y0 + y1) / 2, k = 5 + r();
    return `M${f(x + dir * 7)} ${f(y0)} L${f(x)} ${f(y0 + .5)} L${f(x - dir * .3)} ${f(y1 - .5)} L${f(x + dir * 7)} ${f(y1)} Q${f(x + dir * (k - 1))} ${f(m)} ${f(x + dir * 7)} ${f(y0)} Z`;
  };
  return inkFill(side(5, 1) + ' ' + side(w - 5, -1), t);
}
const broken = (w, h, r, t) => inkPath(sketchBox(w, h, r, true), t);
export const OUTLINE = {
  sketch: (w, h, r, t) => inkPath(sketchBox(w, h, r), t),
  double: (w, h, r, t) => inkPath(sketchBox(w, h, r), t) + inkPath(sketchBox(w, h, r), t, { op: .55, scale: .8 }),
  broken,
  pencil: broken,
  circled: (w, h, r, t) => inkPath(loop(w, h, r, 4), t),
  corners: (w, h, r, t) => {
    const x0 = 4, y0 = 7, x1 = w - 4, y1 = h - 7, lx = Math.min(16, w * .15), ly = 10;
    const L = (p, ax, ay) => { const q = jit(p, r, 1.6); return stroke([q[0] + ax * lx, q[1] + (r() - .5)], q, r, 1.5, 1.5) + ' ' + stroke(q, [q[0] + (r() - .5), q[1] + ay * ly], r, 1.5, 1.2); };
    return inkPath([L([x0, y0], 1, 1), L([x1, y0], -1, 1), L([x1, y1], -1, -1), L([x0, y1], 1, -1)].join(' '), t);
  },
  brackets: (w, h, r, t) => bracketPair('square', w, h, r, t),
  parens: (w, h, r, t) => bracketPair('round', w, h, r, t),
  braces: (w, h, r, t) => bracketPair('curly', w, h, r, t),
  angles: (w, h, r, t) => bracketPair('angle', w, h, r, t),
  kagi: (w, h, r, t) => kagi(w, h, r, t),
  lenticular: (w, h, r, t) => lenticular(w, h, r, t)
};

/* ---------- separators ---------- */
function wobble(x0, x1, y, r, amp = 1.6) {
  const n = Math.max(3, Math.round((x1 - x0) / 60)), pts = [];
  for (let i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, y + (r() - .5) * amp * 2 - (i / n) * (r() - .4) * 1.5]);
  return curve(pts, true);
}
export const RULE = {
  wobble: (w, h, r, t) => inkPath(wobble(2, w - 2, h / 2, r), t),
  short: (w, h, r, t) => inkPath(wobble(2, w - 2, h / 2, r, 1.2), t),
  double: (w, h, r, t) => inkPath(wobble(2, w - 2, h / 2 - 2.6, r, 1) + ' ' + wobble(5, w - 4, h / 2 + 2.6, r, 1), t),
  dashes: (w, h, r, t) => {
    let d = '', x = 3;
    while (x < w - 6) { const len = 9 + r() * 8; d += wobble(x, Math.min(w - 3, x + len), h / 2 + (r() - .5) * 1.2, r, .5) + ' '; x += len + 7 + r() * 6; }
    return inkPath(d, t);
  },
  brush: (w, h, r, t) => {
    const n = Math.max(8, Math.round(w / 22)), top = [], bot = [], ph = r() * 6, c0 = h / 2 + (r() - .5) * 2, k = t.w / 1.3;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = 3 + (w - 6) * u;
      const y = c0 + Math.sin(u * 5.3 + ph) * 1.1 + Math.sin(u * 13 + ph * 2) * .4 - u * 1.2;
      const th = (.5 + 2.1 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), .55)) * (.85 + r() * .3) * k;
      top.push([x, y - th / 2]); bot.push([x, y + th / 2]);
    }
    return inkFill(`${curve(top, true)} L${f(bot[n][0])} ${f(bot[n][1])}${curve(bot.slice().reverse(), false)} Z`, t);
  },
  coil: (w, h, r, t) => {
    const a = 15 / (2 * Math.PI), p1 = r() * 6, p2 = r() * 6, pts = [], T = (w - 10) / a;
    for (let s = 0; s <= T; s += .22) {
      const env = Math.min(1, s / 4, (T - s) / 4);
      const b = (4 + 1.6 * Math.sin(s * .31 + p1) + .9 * Math.sin(s * .83 + p2)) * env;
      pts.push(`${f(5 + a * s - b * Math.sin(s))} ${f(h / 2 + 1 - b * .9 * Math.cos(s) + Math.sin(s * .12 + p1) * 1.4)}`);
    }
    return inkPath('M' + pts.join(' L'), t);
  },
  scrawl: (w, h, r, t) => {
    const pts = []; let x = 3, s = 1;
    while (x < w - 3) {
      const amp = (.6 + r() * 3.4) * Math.min(1, x / 30, (w - x) / 30 + .2);
      pts.push([x, h / 2 + s * amp + (r() - .5)]);
      x += 4 + r() * 9; if (r() < .88) s = -s;
    }
    pts.push([w - 3, h / 2]);
    return inkPath(curve(pts, true), t);
  }
};

/* ---------- link underlines: drawn on a 200 × 12 box that stretches to each line of the link ---------- */
export const LINK = {
  wobble: r => `M1 ${f(6 + r())} C ${f(30 + r() * 10)} ${f(3.5 + r())}, ${f(62 + r() * 10)} ${f(8 + r())}, 100 ${f(5.5 + r())} S ${f(165 + r() * 10)} ${f(3 + r())}, 199 ${f(6.5 + r())}`,
  slant: r => `M1 ${f(8.5 + r())} C 40 ${f(7.5 + r())}, 120 ${f(5.5 + r())}, 199 ${f(2.5 + r())}`,
  double: r => `M1 ${f(3.5 + r())} C 50 2, 120 ${f(4.5 + r())}, 199 3 M6 ${f(9 + r() * .8)} C 60 10, 130 ${f(7 + r())}, 194 ${f(9.5 + r() * .5)}`,
  swash: r => `M1 6 C 50 ${f(8.5 + r())}, 120 ${f(7.5 + r())}, 178 7 C 192 6, 198 3, 199 1`,
  marker: r => `M3 8 C 50 ${f(5.5 + r())}, 140 ${f(6.5 + r())}, 197 5`,
  second: r => `M5 10 C 60 ${f(10.5 + r() * .5)}, 112 ${f(7 + r())}, 196 9`
};
/** Ways to cross out a done item, in a 200 x 12 box. Underlines reuse the link shapes. */
export const STRIKE = {
  line: r => `M1 ${f(6.5 + r())} C 50 ${f(5 + r())}, 130 ${f(7 + r())}, 199 ${f(5 + r())}`,
  double: r => LINK.double(r),
  scribble: r => { let d = `M1 ${f(5 + r() * 2)}`, x = 1, up = true; while (x < 196) { x = Math.min(199, x + 2.5 + r() * 3); d += ` L${f(x)} ${f(up ? .5 + r() * 2 : 9.5 + r() * 2)}`; up = !up; } return d; }
};
export const WAVE_TILE = 'M0 5 C 3 2, 6 2, 9 5 S 15 8, 18 5';
/** A long stretch of hand-drawn wave (WAVE_W wide, repeating): every crest a little different in length and height. */
export const WAVE_W = 150;
export function waveD(r) {
  const n = 16, lens = Array.from({ length: n }, () => .75 + r() * .5), sum = lens.reduce((a, b) => a + b, 0);
  let x = 0, y = 4.5, d = 'M0 4.5', up = true;
  lens.forEach((l, i) => {
    const L = l / sum * WAVE_W, A = 1.6 + r() * 1.7, ny = i === n - 1 ? 4.5 : 4.5 + (r() - .5) * .8, dir = up ? -1 : 1;
    d += ` C${f(x + L * (.3 + r() * .1))} ${f(y + dir * A * 1.3)} ${f(x + L * (.6 + r() * .1))} ${f(ny + dir * A * 1.3)} ${f(x + L)} ${f(ny)}`;
    x += L; y = ny; up = !up;
  });
  return d;
}

/* ---------- marks on text ---------- */
export const ANNO = {
  circle: (w, h, r) => loop(w, h, r, 2),
  box: (w, h, r) => {
    const c = [[2, 2], [w - 2, 2], [w - 2, h - 2], [2, h - 2]].map(p => jit(p, r, 2));
    return c.map((a, i) => stroke(a, c[(i + 1) % 4], r, 3, 2.5)).join(' ');
  },
  strike: (w, h, r) => stroke([2, h * .6], [w - 2, h * .44], r, 2, 3),
  under: (w, h, r) => stroke([1, h * .35], [w - 1, h * .22], r, 2, 2) + ' ' + stroke([5, h * .82], [w - 4, h * .7], r, 2, 2),
  cross: (w, h, r) => {
    const pts = []; let x = 2, up = true;
    while (x < w - 2) { pts.push([x, up ? h * (.18 + r() * .1) : h * (.78 + r() * .12)]); x += 2.5 + r() * 3; up = !up; }
    pts.push([w - 2, h * .5]);
    return curve(pts, true);
  },
  hatch: (w, h, r) => hatchD(0, 0, w, h, r, 3.6, .6),
  hanamaru: (w, h, r) => {
    const cx = w / 2, cy = h / 2, rx = w / 2 - 3, ry = h / 2 - 3, pts = [];
    const t0 = Math.PI * (.9 + r() * .2), spin = Math.PI * 3.1;
    for (let t = 0; t <= spin; t += .09) { const k = .2 + .6 * (t / spin); pts.push([cx + Math.cos(t0 + t) * rx * k, cy + Math.sin(t0 + t) * ry * k]); }
    const n = 7 + Math.floor(r() * 2), b = t0 + spin;
    for (let t = 0; t <= Math.PI * 2.08; t += .035) {
      const k = .8 + .22 * Math.pow(Math.abs(Math.sin(n * t / 2)), .7);
      pts.push([cx + Math.cos(b + t) * rx * k, cy + Math.sin(b + t) * ry * k]);
    }
    return 'M' + pts.map(q => f(q[0]) + ' ' + f(q[1])).join(' L');
  }
};

/* ---------- progress ---------- */
// 正 is how Japanese tallies are kept: five strokes per character
const SEI = [[[0, 0], [1, 0]], [[.5, 0], [.5, 1]], [[.5, .5], [.88, .5]], [[.14, .46], [.14, 1]], [[-.04, 1], [1.04, 1]]];
/* the inside of a progress bar or of its filled cells, in any fill */
function progressFill(style, x, y, w, h, r, t, o) {
  if (style === 'highlight') return `<g style="mix-blend-mode:multiply">${swipesD(x, y, w, h, r).map(d => `<path d="${d}" fill="${o.hl || '#fff04a'}" fill-opacity=".62"/>`).join('')}</g>`;
  if (style === 'pencil') return `<defs>${toolDefs({ kind: 'graphite' }, 'pg2')}</defs>${inkPath(pencilD(x, y, w, h, r), { ...t, kind: 'graphite' }, { scale: .5, op: .5, filterId: 'pg2' })}`;
  const d = FILLS[style] ? FILLS[style](x, y, w, h, r) : hatchD(x, y, w, h, r, 4, 1);
  return inkPath(d, t, { scale: style === 'scribble' ? 1.2 : style === 'stipple' ? 1.4 : .7, op: .8 });
}

/** A progress meter. `shape`: bar, boxes, circles, ring, tally, sei. `style`: the fill (highlight, pencil, hatch, cross, scribble, stipple). */
export function progressSVG(shape, style, w, h, r, t, v, o = {}) {
  const val = Math.max(0, Math.min(1, v));
  let out = '';
  const box = (x, y, bw, bh) => { const c = [[x, y], [x + bw, y], [x + bw, y + bh], [x, y + bh]].map(p => jit(p, r, 1.2)); return c.map((a, i) => stroke(a, c[(i + 1) % 4], r, 2, 1.6)).join(' '); };
  if (shape === 'ring') {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 6;
    out += inkPath(loop(2 * R + 8, 2 * R + 8, r, 4).replace(/(-?[\d.]+) (-?[\d.]+)/g, (m, x, y) => `${f(+x + cx - R - 4)} ${f(+y + cy - R - 4)}`), t, { op: .35, scale: .8 });
    if (val > 0) {
      const pts = [], end = val * Math.PI * 2;
      for (let a = 0; a <= end + 1e-6; a += .12) pts.push([cx + Math.cos(a - Math.PI / 2) * (R - (r() - .5) * .8), cy + Math.sin(a - Math.PI / 2) * (R - (r() - .5) * .8)]);
      pts.push([cx + Math.cos(end - Math.PI / 2) * R, cy + Math.sin(end - Math.PI / 2) * R]);
      out += inkPath(curve(pts, true), t, { scale: 2.6 });
    }
    return out;
  }
  if (shape === 'tally' || shape === 'sei') {
    const total = o.max || 20, count = Math.round(val * total), groups = Math.ceil(total / 5), gw = w / groups;
    let d = '';
    for (let g = 0; g < groups; g++) {
      const n = Math.max(0, Math.min(5, count - g * 5)), x0 = g * gw + gw * .14, cw = gw * .64, y0 = 4, ch = h - 8;
      if (shape === 'tally') {
        for (let i = 0; i < Math.min(4, n); i++) { const x = x0 + cw * (i + .5) / 4; d += stroke([x + (r() - .5), y0 + r()], [x + (r() - .5) * 1.5, y0 + ch - r()], r, 1, 1.2) + ' '; }
        if (n === 5) d += stroke([x0 - 2, y0 + ch * .7], [x0 + cw + 2, y0 + ch * .25], r, 1.5, 1.5) + ' ';
      } else {
        for (let i = 0; i < n; i++) { const [p, q] = SEI[i]; d += stroke([x0 + p[0] * cw, y0 + p[1] * ch], [x0 + q[0] * cw, y0 + q[1] * ch], r, .6, 1) + ' '; }
      }
    }
    return inkPath(d, t);
  }
  if (shape === 'boxes' || shape === 'circles') {
    // the cells are drawn empty; the filled ones are coloured in with the chosen fill, clipped to their outline
    const n = o.segments || 10, gap = 4, sw = (w - 8 - gap * (n - 1)) / n, sh = Math.min(h - 8, shape === 'circles' ? sw : h - 8), y = (h - sh) / 2;
    const filled = Math.round(val * n);
    let outline = '', clip = '';
    for (let i = 0; i < n; i++) {
      const x = 4 + i * (sw + gap);
      if (shape === 'circles') {
        outline += loop(sw + 2, sh + 2, r, 1).replace(/(-?[\d.]+) (-?[\d.]+)/g, (m, a, b) => `${f(+a + x - 1)} ${f(+b + y - 1)}`) + ' ';
        if (i < filled) clip += `<ellipse cx="${f(x + sw / 2)}" cy="${f(y + sh / 2)}" rx="${f(sw / 2)}" ry="${f(sh / 2)}"/>`;
      } else {
        outline += box(x, y, sw, sh) + ' ';
        if (i < filled) clip += `<rect x="${f(x)}" y="${f(y)}" width="${f(sw)}" height="${f(sh)}"/>`;
      }
    }
    if (filled) out += `<clipPath id="pcells">${clip}</clipPath><g clip-path="url(#pcells)">${progressFill(style, 4, y, filled * (sw + gap), sh, r, t, o)}</g>`;
    return out + inkPath(outline, t, { op: .6, scale: .8 });
  }
  // a bar: a sketched box, filled up to the value
  const bw = w - 6, fillW = bw * val;
  out += `<clipPath id="pc"><rect x="3" y="0" width="${f(Math.max(0, fillW))}" height="${f(h)}"/></clipPath>`;
  if (style === 'highlight') out += `<g clip-path="url(#pc)">${gradient(w, o.hl || '#fff04a')}<path d="${band(w - 4, h - 6, r, { t0: .12, t1: .08, b0: .92, b1: .86, x0: 2, x1: w - 6, bow: 1 })}" transform="translate(2 3)" fill="url(#g)" fill-opacity=".9" style="mix-blend-mode:multiply"/></g>`;
  else out += `<g clip-path="url(#pc)">${progressFill(style, 3, 3, bw, h - 6, r, t, o)}</g>`;
  out += inkPath(box(2, 2, w - 4, h - 4), t);
  return out;
}

/* ---------- ink samples ---------- */
export const SWATCH = {
  fountain: (w, h, r, c) => {
    const n = 16, top = [], bot = [], ph = r() * 6;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = 4 + (w - 12) * u, cy = h / 2 + Math.sin(u * 4.4 + ph) * 3 - u * 3;
      const th = (2.5 + 11 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08)), .6)) * (.9 + r() * .2);
      top.push([x, cy - th / 2]); bot.push([x, cy + th / 2]);
    }
    const d = `${curve(top, true)} L${f(bot[n][0])} ${f(bot[n][1])}${curve(bot.slice().reverse(), false)} Z`;
    const e = top[n - 1], eb = bot[n - 1];
    return `<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${c}" stop-opacity=".5"/><stop offset=".45" stop-color="${c}" stop-opacity=".72"/><stop offset=".9" stop-color="${c}" stop-opacity=".92"/><stop offset="1" stop-color="${c}"/></linearGradient></defs>`
      + `<path d="${d}" fill="url(#g)"/><path d="${d}" fill="none" stroke="${c}" stroke-opacity=".45" stroke-width=".9"/>`
      + `<ellipse cx="${f(e[0] + 2)}" cy="${f((e[1] + eb[1]) / 2)}" rx="3" ry="${f(Math.max(2, (eb[1] - e[1]) / 2))}" fill="${c}" fill-opacity=".55"/>`;
  },
  ballpoint: (w, h, r, c) => {
    const a = 10 / (2 * Math.PI), T = (w - 12) / a, pts = [], blobs = [];
    for (let t = 0; t <= T; t += .2) {
      const b = 5.5 + 1.5 * Math.sin(t * .5), x = 6 + a * t - b * .9 * Math.sin(t), y = h / 2 - b * 1.4 * Math.cos(t);
      pts.push(`${f(x)} ${f(y)}`);
      if (r() < .025) blobs.push(`<circle cx="${f(x)}" cy="${f(y)}" r="1.1" fill="${c}"/>`);
    }
    return `<path d="M${pts.join(' L')}" fill="none" stroke="${c}" stroke-width="1.15" stroke-opacity=".9" stroke-linecap="round"/>` + blobs.join('');
  },
  pencil: (w, h, r, c) => {
    let d = '';
    for (let x = 2; x < w - 16; x += 2.4 + r() * 1.4) d += `M${f(x + r() * 2)} ${f(h - 4 - r() * 3)} L${f(x + 14 + r() * 3)} ${f(4 + r() * 3)} `;
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.4" stroke-opacity=".8" stroke-linecap="round"/>`;
  }
};

/* ---------- small controls ---------- */
export function spiral(r) {
  const pts = [], turns = 2.2 + r() * .6, ph = r() * 6, T = turns * Math.PI * 2;
  for (let a = 0; a <= T; a += .35) { const k = 1 - a / T; pts.push([12 + Math.cos(a + ph) * (1 + 7 * k) + (r() - .5), 12 + Math.sin(a + ph) * (1 + 6.6 * k) + (r() - .5)]); }
  return curve(pts, true);
}
export function wobblyBox(r) {
  const c = [[4.5, 5], [19.6, 4.4], [20, 19.6], [4.4, 20]].map(p => jit(p, r, 1));
  return `M${f(c[0][0])} ${f(c[0][1])} C${f(c[0][0] + 5)} ${f(c[0][1] - .5)} ${f(c[1][0] - 5)} ${f(c[1][1] + .3)} ${f(c[1][0])} ${f(c[1][1])}`
    + ` C${f(c[1][0] + .4)} ${f(c[1][1] + 5)} ${f(c[2][0] - .3)} ${f(c[2][1] - 5)} ${f(c[2][0])} ${f(c[2][1])}`
    + ` C${f(c[2][0] - 5)} ${f(c[2][1] + .4)} ${f(c[3][0] + 5)} ${f(c[3][1] - .3)} ${f(c[3][0])} ${f(c[3][1])}`
    + ` C${f(c[3][0] + .3)} ${f(c[3][1] - 5)} ${f(c[0][0] - .2)} ${f(c[0][1] + 5)} ${f(c[0][0])} ${f(c[0][1] + .6)}`;
}
export function wobblyRing(r) {
  const pts = [], ph = r() * 6;
  for (let t = 0; t <= Math.PI * 2.08; t += .4) { const k = 8.4 + Math.sin(t * 2 + ph) * .5; pts.push([12 + Math.cos(t - 1.6) * k, 12 + Math.sin(t - 1.6) * k]); }
  return curve(pts, true);
}
export const TICK = 'M7 12.5 L10.6 16.8 L19.5 4.5';
export const DOT = 'M9.5 12 C 9.4 9.6, 14.6 9.4, 14.6 12 C 14.6 14.6, 9.6 14.8, 9.8 11.6 C 10 10.4, 13.4 10.6, 13.2 12.4';
