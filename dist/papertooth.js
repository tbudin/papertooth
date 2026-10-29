/*! papertooth v0.5.0 | (c) 2026 Thomas Budin | MIT License | github.com/tbudin/papertooth */
import {
  ANNO,
  DOT,
  HEAVY_START,
  HIGHLIGHT,
  LINK,
  OUTLINE,
  POOL_Y,
  RULE,
  STRIKE,
  SWATCH,
  TICK,
  WAVE_W,
  gradient,
  inkPath,
  passes,
  progressSVG,
  secondPass,
  spiral,
  toolDefs,
  toolKey,
  toolOf,
  waveD,
  wobblyBox,
  wobblyRing
} from "./chunks/chunk-QYNW53EL.js";
import {
  DEFAULTS,
  cssVar,
  enc,
  f,
  filtersMarkup,
  hoverOf,
  injectFilters,
  lithoFilter,
  rng,
  seedOf,
  setSeed,
  smearColour,
  svgDoc,
  toHex,
  typewriterFilter
} from "./chunks/chunk-G2ASMPT7.js";

// src/js/painter.js
var repaint = () => {
};
var onDemand = (load) => {
  let mod = null, loading = null;
  return (el) => {
    if (mod) return mod;
    loading = loading || load().then((m) => {
      mod = m;
    });
    loading.then(() => repaint(el, true));
    return null;
  };
};
var imagesFor = onDemand(() => import("./chunks/images-SEQUITVK.js"));
var diagramFor = onDemand(() => import("./chunks/diagram-TRBSRCI2.js"));
var LINE_MARKS = /* @__PURE__ */ new Set(["strike", "under", "cross"]);
var shiftPath = (d, dx, dy) => d.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, x, y) => `${f(+x + dx)} ${f(+y + dy)}`);
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
    sel: '.pt-btn:not(.pt-btn--outline, [data-hover]), .pt-btn[data-hover="circle"], .pt-btn[data-hover="underline"], .pt-link[data-hover="circle"], .pt-link[data-hover="underline"]',
    measure: (el) => {
      const svg = el.querySelector(":scope > .pt-hover-ink"), label = el.querySelector(":scope > .pt-btn__label") || el;
      const b = label.getBoundingClientRect(), o = el.getBoundingClientRect();
      return { svg, kind: hoverOf(el), w: Math.round(b.width), h: Math.round(b.height), x: Math.round(b.left - o.left), y: Math.round(b.top - o.top) };
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
      el.dataset.ptPainted = "";
    }
  },
  {
    // the underline is drawn on a 200 × 12 box that stretches to each line of the link
    sel: ".pt-link",
    measure: (el) => ({ style: el.dataset.ul || "wobble", t: toolOf(el) }),
    key: (m) => `${m.style}|${toolKey(m.t)}`,
    draw: (el, m) => {
      if (m.style === "hl") return;
      const r = rng(seedOf(el)), defs = `<defs>${toolDefs(m.t)}</defs>`;
      const box = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 12" preserveAspectRatio="none">${defs}${inner}</svg>`;
      if (m.style === "wave") {
        el.style.setProperty("--pt-u", enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${WAVE_W}" height="9" viewBox="0 0 ${WAVE_W} 9">${defs}${inkPath(waveD(r), m.t, { scale: 0.8 })}</svg>`));
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
      el.dataset.ptPainted = "";
      el.style.setProperty("--pt-progress-img", enc(svgDoc(m.w, m.h, `<defs>${toolDefs(m.t)}</defs>` + progressSVG(m.shape, m.style, m.w, m.h, rng(seedOf(el)), m.t, m.v, m))));
    }
  },
  {
    sel: ".pt-anno",
    measure: (el) => {
      const svg = el.querySelector(":scope > .pt-anno__ink");
      const b = svg ? svg.getBoundingClientRect() : { width: 0, height: 0 };
      const m = { w: Math.round(b.width * 2) / 2, h: Math.round(b.height * 2) / 2, style: el.dataset.anno, svg, t: toolOf(el), lines: null };
      if (svg && el.hasAttribute("data-wrap") && LINE_MARKS.has(m.style)) {
        const range = document.createRange();
        range.setStart(el, 0);
        range.setEndBefore(svg);
        const rows = [];
        for (const r of range.getClientRects()) {
          if (!r.width) continue;
          const row = rows.find((q) => Math.abs(q.top - r.top) < r.height / 2);
          if (row) {
            row.left = Math.min(row.left, r.left);
            row.right = Math.max(row.right, r.right);
            row.bottom = Math.max(row.bottom, r.bottom);
          } else rows.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
        }
        const half = (v) => Math.round(v * 2) / 2;
        if (rows.length > 1) m.lines = rows.map((q) => [half(q.left - b.left), half(q.top - b.top), half(q.right - q.left), half(q.bottom - q.top)]);
        m.ox = parseFloat(cssVar(el, "--pt-ox")) || 0;
        m.oy = parseFloat(cssVar(el, "--pt-oy")) || 0;
      }
      return m;
    },
    key: (m) => `${m.style}|${m.w}|${m.h}|${m.t.kind}|${m.t.w}|${m.lines ? m.lines.join(";") : ""}`,
    draw: (el, m) => {
      if (!m.svg || !ANNO[m.style] || m.w < 2) return;
      m.svg.setAttribute("viewBox", `0 0 ${m.w} ${m.h}`);
      const r = rng(seedOf(el));
      const d = m.lines ? m.lines.map(([x, y, w, h]) => m.style === "under" ? shiftPath(ANNO.under(w + 4, 11, r), x - 2, y + h - 4) : shiftPath(ANNO[m.style](w + 2 * m.ox, h + 2 * m.oy, r), x - m.ox, y - m.oy)).join(" ") : ANNO[m.style](m.w, m.h, r);
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
    measure: (el) => {
      const I = imagesFor(el);
      return I ? { I, p: I.lithoParams(el) } : { pending: true };
    },
    key: (m) => m.pending ? "pending" : JSON.stringify(m.p),
    draw: (el, m) => {
      if (!m.pending) el.style.filter = `url(#${m.I.lithoFilterId(m.p)})`;
    }
  },
  {
    // the print replaces the picture's pixels; the original is kept in data-pt-src for reprints
    sel: "img.pt-print",
    measure: (el) => {
      const I = imagesFor(el);
      if (!I) return { pending: true };
      if (!el.dataset.ptSrc) {
        if (!el.currentSrc && !el.getAttribute("src")) return { src: "" };
        el.dataset.ptSrc = el.currentSrc || el.src;
      }
      if (!el.dataset.ptW && el.complete && el.naturalWidth && el.dataset.ptPrinted == null) {
        const w = el.getBoundingClientRect().width;
        el.dataset.ptW = Math.abs(w - el.naturalWidth) < 1 && !el.style.width && !el.getAttribute("width") ? String(Math.round(w)) : "css";
      }
      const rec = I.sourceImage(el.dataset.ptSrc, () => repaint(el, true));
      return { I, src: el.dataset.ptSrc, rec, ready: rec.ready, failed: rec.failed, p: I.printParams(el) };
    },
    key: (m) => m.pending ? "pending" : `${m.ready}|${m.failed}|${m.src}|${JSON.stringify(m.p)}`,
    draw: (el, m) => {
      if (m.pending) return;
      if (m.failed) el.dataset.ptBlocked = "";
      else delete el.dataset.ptBlocked;
      if (!m.src || !m.ready) return;
      if (el.dataset.ptW && el.dataset.ptW !== "css" && !el.style.width) el.style.width = el.dataset.ptW + "px";
      m.I.renderPrint(el, m.rec.img, m.p);
    }
  },
  {
    sel: ".pt-diagram",
    measure: (el) => {
      const D = diagramFor(el);
      if (!D) return { pending: true };
      if (el.dataset.ptSrc == null) el.dataset.ptSrc = el.textContent.trim();
      const cs = getComputedStyle(el);
      return { D, src: el.dataset.ptSrc, w: Math.round(el.clientWidth), font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, lh: parseFloat(cs.lineHeight) || 24, fill: el.dataset.fill || "none" };
    },
    key: (m) => m.pending ? "pending" : `${m.w}|${m.font}|${m.fill}|${m.src}`,
    draw: (el, m) => {
      if (m.pending || !m.D.kindOf(m.src)) return;
      el.innerHTML = m.D.renderDiagram(m.src, { seed: seedOf(el), font: m.font, lineHeight: m.lh, fill: m.fill, width: m.w });
      el.dataset.ptPainted = "";
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

// src/js/dates.js
function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  return Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 864e5 + 1) / 7);
}
function firstDayOf(locale) {
  try {
    const l = new Intl.Locale(locale || new Intl.DateTimeFormat().resolvedOptions().locale);
    const info = typeof l.getWeekInfo === "function" ? l.getWeekInfo() : l.weekInfo;
    if (info && info.firstDay) return info.firstDay % 7;
  } catch {
  }
  return 1;
}
function weekDates(date = /* @__PURE__ */ new Date(), weekStart = 1) {
  const back = (date.getDay() - weekStart + 7) % 7;
  return Array.from({ length: 7 }, (_, k) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - back + k));
}
var sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
var formats = /* @__PURE__ */ new Map();
var fmt = (locale, opts) => {
  const key = locale + JSON.stringify(opts);
  if (!formats.has(key)) formats.set(key, new Intl.DateTimeFormat(locale, opts));
  return formats.get(key);
};
function dayParts(date = /* @__PURE__ */ new Date(), locale = "en-GB") {
  return {
    day: date.getDate(),
    month: fmt(locale, { month: "long", year: "numeric" }).format(date),
    weekday: fmt(locale, { weekday: "long" }).format(date),
    short: fmt(locale, { weekday: "short" }).format(date),
    kanji: fmt("ja-JP", { weekday: "narrow" }).format(date),
    week: isoWeek(date)
  };
}
var sign = (n) => n < 0 ? "past" : n > 0 ? "future" : "current";
var midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
function stampCells(unit = "week", date = /* @__PURE__ */ new Date(), { locale = "en-GB", weekStart = firstDayOf(locale), years = 5, from } = {}) {
  if (unit === "month") {
    const name2 = fmt(locale, { month: "short" });
    return Array.from({ length: 12 }, (_, m) => ({ label: name2.format(new Date(date.getFullYear(), m, 1)), state: sign(m - date.getMonth()), date: new Date(date.getFullYear(), m, 1) }));
  }
  if (unit === "year") {
    const first = from == null ? date.getFullYear() - Math.floor((years - 1) / 2) : from;
    return Array.from({ length: years }, (_, k) => ({ label: String(first + k), state: sign(first + k - date.getFullYear()), date: new Date(first + k, 0, 1) }));
  }
  if (unit === "day") {
    const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return Array.from({ length: days }, (_, k) => ({ label: String(k + 1), state: sign(k + 1 - date.getDate()), date: new Date(date.getFullYear(), date.getMonth(), k + 1) }));
  }
  const name = fmt(locale, { weekday: "short" });
  return weekDates(date, weekStart).map((d) => ({ label: name.format(d), state: sign(midnight(d) - midnight(date)), date: d }));
}
function stampLabel(unit, date = /* @__PURE__ */ new Date(), locale = "en-GB", { mark = "circle", variant } = {}) {
  const marked = mark !== "none", bar = variant === "bar";
  const DATE = { dateStyle: "full" }, MONTH = { month: "long", year: "numeric" }, YEAR = { year: "numeric" };
  const opts = unit === "month" ? bar || !marked ? MONTH : DATE : unit === "year" ? bar || !marked ? YEAR : MONTH : DATE;
  return fmt(locale, opts).format(date);
}
function stampLayout(unit = "week", date = /* @__PURE__ */ new Date(), { variant, locale = "en-GB", weekStart = firstDayOf(locale), years, from, rows = 1, title } = {}) {
  const opts = { locale, weekStart, years, from };
  const labels = Array.isArray(rows) ? rows.map(String) : null, count = labels ? labels.length : rows;
  if (variant === "bar" || unit === "day") return { sections: [{ part: "bar", rows: unit === "day" ? chunk(stampCells("day", date, opts), 16) : [stampCells(unit, date, opts)] }] };
  const narrow = fmt(locale, { weekday: "narrow" });
  const weekdays = weekDates(date, weekStart).map((d) => ({ label: narrow.format(d), state: sign(midnight(d) - midnight(date)), date: d }));
  const side = (label) => ({ label, state: "", side: true });
  const months = stampCells("month", date, opts);
  if (unit === "month" && variant === "wide") {
    const days = stampCells("day", date, opts);
    return { sections: [
      { part: "head", rows: [[side(fmt(locale, { month: "short" }).format(date)), ...days.map((_, k) => ({ label: narrow.format(new Date(date.getFullYear(), date.getMonth(), k + 1)), state: "" }))]] },
      { part: "days", rows: [[side(String(date.getFullYear())), ...days]] },
      // rows to tick off day by day, so the days gone by are crossed out only on the dates
      { part: "write", rows: Array.from({ length: count }, (_, r) => [side(labels ? labels[r] : ""), ...days.map((d) => ({ label: "", state: "", date: d.date, row: r + 1 }))]) }
    ] };
  }
  if (unit === "month") {
    const first = new Date(date.getFullYear(), date.getMonth(), 1), lead2 = (first.getDay() - weekStart + 7) % 7;
    const days = stampCells("day", date, opts), blank = { label: "", state: "" };
    const cells = [...Array(lead2).fill(blank), ...days];
    while (cells.length % 7) cells.push(blank);
    return { sections: [
      { part: "months", rows: chunk(months, 6) },
      { part: "head", rows: [weekdays.map((d) => ({ label: d.label, state: "" }))] },
      { part: "days", rows: chunk(cells, 7) }
    ] };
  }
  if (unit === "year") {
    return { sections: [{ part: "title", rows: [[{ label: String(date.getFullYear()), state: "" }]] }, { part: "year", rows: chunk(months, 4) }] };
  }
  const lead = labels ? [side("")] : [];
  const sections = [{ part: "head", rows: [[...lead, ...weekdays]] }, { part: "write", rows: Array.from({ length: count }, (_, r) => [...labels ? [side(labels[r])] : [], ...weekdays.map((d) => ({ label: "", state: d.state, date: d.date, row: r + 1 }))]) }];
  if (title != null) sections.unshift({ part: "title", rows: [[{ label: title, state: "" }]] });
  return { sections };
}
var pad = (n) => String(n).padStart(2, "0");
function cellKey(part, cell, unit) {
  if (!cell.date) return null;
  const d = cell.date, ym = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  if (part === "months" || part === "year" || part === "bar" && unit === "month") return `m:${ym}`;
  if (part === "bar" && unit === "year") return `y:${d.getFullYear()}`;
  return `d:${ym}-${pad(d.getDate())}`;
}
function fillKey({ date, day, month }, stampDate) {
  if (date) {
    const [y, m, d] = String(date).split("-");
    return d ? `d:${y}-${pad(m)}-${pad(d)}` : m ? `m:${y}-${pad(m)}` : `y:${y}`;
  }
  const ym = `${stampDate.getFullYear()}-${pad(stampDate.getMonth() + 1)}`;
  if (day != null) return `d:${ym}-${pad(day)}`;
  if (month != null) return `m:${stampDate.getFullYear()}-${pad(month)}`;
  return null;
}
var chunk = (list, n) => Array.from({ length: Math.ceil(list.length / n) }, (_, i) => list.slice(i * n, i * n + n));

// src/js/planner.js
var set = (el, sel, text) => {
  const n = el.querySelector(sel);
  if (n) n.textContent = text;
};
var parseDate = (v) => {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(v || "");
  return m ? new Date(+m[1], +m[2] - 1, +(m[3] || 1)) : /* @__PURE__ */ new Date();
};
var dateOf = (el) => parseDate(el.dataset.date);
var localeOf = (el) => el.dataset.locale || el.closest("[lang]") && el.closest("[lang]").lang || "en-GB";
var weekText = (label, n) => typeof label === "function" ? label(n) : String(label).replace("{n}", n);
function dayHead(el, date = dateOf(el), { locale = localeOf(el), weekLabel = el.dataset.weekLabel || "Week {n}" } = {}) {
  const p = dayParts(date, locale);
  set(el, ".pt-dayhead__num", p.day);
  set(el, ".pt-dayhead__month", p.month);
  set(el, ".pt-dayhead__weekday", p.weekday);
  set(el, ".pt-dayhead__kanji", p.kanji);
  set(el, ".pt-dayhead__weekno", weekText(weekLabel, p.week));
}
function week(el, date = dateOf(el), { locale = localeOf(el), weekStart = el.dataset.weekStart != null ? +el.dataset.weekStart : firstDayOf(locale), mark = el.dataset.mark || "circle" } = {}) {
  const dates = weekDates(date, weekStart);
  el.querySelectorAll(".pt-week__day").forEach((d, k) => {
    const dt = dates[k];
    if (!dt) return;
    d.dataset.day = dt.getDay();
    const today = sameDay(dt, date);
    d.toggleAttribute("aria-current", today);
    if (today) d.setAttribute("aria-current", "date");
    const ds = d.querySelector(".pt-week__date");
    if (!ds) return;
    ds.textContent = dt.getDate();
    ds.classList.remove("pt-anno", "pt-mark");
    delete ds.dataset.anno;
    delete ds.dataset.ptPainted;
    if (today && mark === "highlight") ds.classList.add("pt-mark");
    else if (today && mark !== "none") {
      ds.classList.add("pt-anno");
      ds.dataset.anno = mark;
    }
  });
}
var span = (cls, text) => {
  const s = document.createElement("span");
  s.className = cls;
  if (text != null) s.textContent = text;
  return s;
};
function stampMark(part, state, mark = "circle", past = "none") {
  return {
    label: state === "current" && part !== "write" && part !== "title" && mark !== "none" ? mark : null,
    // the month selector above a calendar is only circled: crossing out its past months reads as clutter
    cell: state === "past" && part !== "head" && part !== "months" && (past === "x" || past === "strike") ? past : null
  };
}
function dateStamp(el, date = parseDate(el.dataset.date), opts = {}) {
  const d = el.dataset, unit = d.unit || "week", mark = d.mark || "circle", past = d.past || "none";
  const locale = opts.locale || localeOf(el);
  const rows = !d.rows ? 1 : /^\s*\d+\s*$/.test(d.rows) ? +d.rows : d.rows.split(",").map((s) => s.trim()).filter(Boolean);
  const { sections } = stampLayout(unit, date, {
    variant: d.variant,
    locale,
    weekStart: d.weekStart != null ? +d.weekStart : void 0,
    years: d.years ? +d.years : void 0,
    from: d.from ? +d.from : void 0,
    rows,
    title: d.title,
    ...opts
  });
  const fills = Array.from(el.querySelectorAll(":scope > :is([data-day], [data-date], [data-month]), .pt-datestamp__fill > *"), (n) => ({
    n,
    key: fillKey({ date: n.dataset.date, day: n.dataset.day, month: n.dataset.month }, date),
    row: n.dataset.row ? +n.dataset.row : 0
  }));
  const layer = (marks) => {
    const out = div(marks ? "pt-datestamp__marks" : "pt-datestamp__print");
    if (marks) out.setAttribute("aria-hidden", "true");
    for (const s of sections) {
      const sec = out.appendChild(div("pt-datestamp__section"));
      sec.dataset.part = s.part;
      for (const row of s.rows) {
        const r = sec.appendChild(div("pt-datestamp__row"));
        for (const c of row) {
          const cell = r.appendChild(span("pt-datestamp__cell")), label = span("pt-datestamp__label", c.label);
          cell.dataset.state = c.state;
          if (c.side) cell.dataset.side = "";
          const m = marks ? stampMark(s.part, c.state, mark, past) : {};
          if (m.cell) {
            Object.assign(cell.dataset, { anno: m.cell, tool: d.pastTool || "graphite" });
            cell.classList.add("pt-anno");
          }
          if (m.label === "highlight") {
            const hl = document.createElement("mark");
            hl.className = "pt-mark";
            hl.append(label);
            cell.append(hl);
          } else {
            if (m.label) {
              Object.assign(label.dataset, { anno: m.label, tool: d.markTool || "pencil" });
              label.classList.add("pt-anno");
            }
            cell.append(label);
          }
          const key = marks && cellKey(s.part, c, unit), here = key ? fills.filter((f2) => f2.key === key && f2.row === (c.row || 0)) : [];
          if (here.length) {
            const box = cell.appendChild(span("pt-datestamp__fill"));
            box.append(...here.map((f2) => f2.n));
          }
        }
      }
    }
    return out;
  };
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", stampLabel(unit, date, locale, { mark, variant: d.variant }));
  if (/^ja\b/.test(locale)) el.lang = "ja";
  el.replaceChildren(layer(false), layer(true));
  el.dataset.ptReady = "";
}
var div = (cls) => {
  const e = document.createElement("div");
  e.className = cls;
  return e;
};

// src/js/decorate.js
var UL_MIX = ["wobble", "slant", "swash"];
var DECORATORS = [
  // first, so the marks it asks for (annotations, highlights) are decorated in the same pass
  [".pt-datestamp", (el) => {
    if (el.dataset.ptReady == null) dateStamp(el);
  }],
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
  [".pt-btn, .pt-link[data-hover]", (el) => {
    if (!["circle", "underline"].includes(hoverOf(el)) || el.querySelector(":scope > .pt-hover-ink")) return;
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
    if (el.dataset.ptReady != null) return;
    const input = el.querySelector("input");
    if (!input) return;
    const r = rng(seedOf(el)), radio = el.classList.contains("pt-radio");
    const svg = svgEl("svg", { width: "22", height: "22", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" });
    svg.appendChild(svgEl("path", { d: radio ? wobblyRing(r) : wobblyBox(r) }));
    svg.appendChild(svgEl("path", { class: "pt-tick", pathLength: "1", d: radio ? DOT : TICK }));
    input.after(svg);
    if (!radio) {
      let t = el.querySelector(".pt-check__text");
      if (!t) {
        t = document.createElement("span");
        t.className = "pt-check__text";
        let n = svg.nextSibling;
        while (n) {
          const next = n.nextSibling;
          t.appendChild(n);
          n = next;
        }
        el.appendChild(t);
      }
      if (!t.querySelector(":scope > .pt-check__ink")) {
        const ink = document.createElement("span");
        ink.className = "pt-check__ink";
        while (t.firstChild) ink.appendChild(t.firstChild);
        t.appendChild(ink);
      }
    }
    el.dataset.ptReady = "";
  }],
  [".pt-habits", (el) => {
    if (el.dataset.ptReady != null) return;
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
    if (el.dataset.ptReady != null) return;
    const input = el.querySelector("input");
    if (!input) return;
    const svg = svgEl("svg", { width: "20", height: "20", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" });
    svg.appendChild(svgEl("circle", { class: "pt-ring", cx: "12", cy: "12", r: "9" }));
    svg.appendChild(svgEl("path", { class: "pt-fill", pathLength: "1", d: spiral(rng(seedOf(el))) }));
    input.after(svg);
    el.dataset.ptReady = "";
  }],
  [".pt-links-mix .pt-link:not([data-ul])", (el, o, i) => {
    el.dataset.ul = UL_MIX[(i + (rng(seedOf(el))() * 3 | 0)) % 3];
  }]
];
function wobble(el, max) {
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
var SNAP_SELECTOR = ":is(h1, h2, h3, h4, p, li, .pt-btn, .pt-snap, .pt-todo, .pt-bujo, [data-pt-ruled]):not(.pt-nosnap)";
var LISTS = ".pt-todo, .pt-bujo, [data-pt-ruled]";
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
    const host = el.querySelector(".pt-btn__label") || el.matches(LISTS) && el.querySelector(".pt-check__ink, li, p, h1, h2, h3, h4") || el;
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
  if (colour.startsWith("--")) return cssVar(el, colour);
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
    ["white", "White", "", "", "#fefefe"],
    ["cream", "Cream", "", "", "#f8f1df"],
    ["washi", "Washi", "\u548C\u7D19", "Japanese paper", "#f6f2e6"],
    ["kraft", "Kraft", "", "", "#c9a67a"],
    ["recycled", "Recycled", "", "", "#e9e8e2"],
    ["tracing", "Tracing", "", "", "#f4f6f6"]
  ]
};

// src/js/index.js
var VERSION = "0.5.0";
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
  drawInserted: true,
  // content added later draws on even when it lands on screen; false shows it drawn, like the first screen
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
  // fill .pt-dayhead and .pt-week marked data-today (or data-date) with their date
  pen: null,
  pencil: null,
  ribbon: null,
  highlighter: null
};
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
        const range = sel.getRangeAt(0), base = range.commonAncestorContainer;
        const scope = base.nodeType === 1 ? base : base.parentElement;
        const cands = new Set(scope ? scope.querySelectorAll(SEL_TEXT) : []);
        for (let n = scope; n && n !== document.body; n = n.parentElement) if (n.matches(SEL_TEXT)) cands.add(n);
        cands.forEach((el) => {
          if (sel.containsNode(el, true)) now.push(el);
        });
      }
      selected.forEach((el) => {
        if (!now.includes(el)) delete el.dataset.ptSelecting;
      });
      now.forEach((el) => {
        el.dataset.ptSelecting = "";
      });
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
    has(".pt-wobble, .pt-label--emboss").forEach((el) => wobble(el, o.wobbleMax));
    if (o.today) {
      has(".pt-dayhead:is([data-today], [data-date])").forEach((el) => dayHead(el));
      has(".pt-week:is([data-today], [data-date])").forEach((el) => week(el));
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
        const settleOnScreen = booting ? !o.drawOnLoad : !o.drawInserted;
        const still = settleOnScreen && drawIO ? new Set([...blocks].filter((b) => {
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
    html.dataset.ptMotion = "";
    if (o.motion === "scroll" && "IntersectionObserver" in window) {
      drawIO = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) {
          e.target.dataset.ptDrawn = "";
          drawIO.unobserve(e.target);
        }
      }, { threshold: 0.2 });
    }
  }
  const prepared = /* @__PURE__ */ new WeakSet();
  function prepareDraw(block) {
    if (prepared.has(block)) return;
    prepared.add(block);
    const items = block.matches(DRAWABLE) ? [block] : [];
    items.push(...block.querySelectorAll(DRAWABLE));
    items.forEach((it, i) => it.style.setProperty("--pt-delay", Math.min(i * o.stagger, 1.4).toFixed(2) + "s"));
    if (drawIO) drawIO.observe(block);
    else block.dataset.ptDrawn = "";
  }
  function replay(scope = root) {
    const blocks = (scope.matches && scope.matches(o.drawSelector) ? [scope] : []).concat(Array.from(scope.querySelectorAll(o.drawSelector))).filter((b) => b.dataset.ptDraw !== "off");
    blocks.forEach((b) => {
      delete b.dataset.ptDrawn;
    });
    void document.body.offsetWidth;
    blocks.forEach((b) => {
      const r = b.getBoundingClientRect();
      if (!drawIO || r.bottom > 0 && r.top < innerHeight) b.dataset.ptDrawn = "";
      else drawIO.observe(b);
    });
  }
  function settle(scope = root) {
    scan(scope);
    const sel = `${o.drawSelector}, [data-pt-draw]`;
    (scope.matches && scope.matches(sel) ? [scope] : []).concat(Array.from(scope.querySelectorAll(sel))).forEach((b) => {
      if (drawIO) drawIO.unobserve(b);
      b.setAttribute("data-pt-draw", "off");
    });
    quiet();
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
    settle,
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
      selected.forEach((el) => {
        delete el.dataset.ptSelecting;
      });
      delete html.dataset.ptMotion;
    }
  };
}
export {
  DEFAULTS2 as DEFAULTS,
  DEFAULTS as FILTER_DEFAULTS,
  PALETTE,
  VERSION,
  dateStamp,
  dayHead,
  dayParts,
  filtersMarkup,
  firstDayOf,
  init,
  isoWeek,
  lithoFilter,
  sameDay,
  setHighlighter,
  setPen,
  setPencil,
  setRibbon,
  smearColour,
  stampCells,
  stampLabel,
  stampLayout,
  typewriterFilter,
  week,
  weekDates
};
