/*! papertooth v0.3.1 | (c) 2026 Thomas Budin | MIT License | github.com/tbudin/papertooth */
"use client";

// src/react/index.js
import { createElement as h, forwardRef, useEffect, useId, useState } from "react";
import { init } from "papertooth";

// src/js/core.js
var f = (n) => String(Math.round(n * 10) / 10);
function rng(seed) {
  let s = seed | 0;
  return function() {
    s = s + 1831565813 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
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

// src/js/shapes.js
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
  } catch (e) {
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

// src/react/index.js
function usePapertooth(options) {
  const [kit, setKit] = useState(null);
  useEffect(() => {
    const k = init(options);
    setKit(k);
    return () => k.destroy();
  }, []);
  return kit;
}
function Papertooth(options) {
  usePapertooth(options);
  return null;
}
function useSeed(seed) {
  const id = useId();
  if (seed != null) return seed | 0;
  let x = 2166136261;
  for (let i = 0; i < id.length; i++) x = Math.imul(x ^ id.charCodeAt(i), 16777619);
  return x >>> 0;
}
var data = (attrs) => {
  const out = {};
  for (const k in attrs) if (attrs[k] != null && attrs[k] !== false) out["data-" + k] = String(attrs[k]);
  return out;
};
var cls = (...names) => names.filter(Boolean).join(" ");
var textOf = (node) => node == null || typeof node === "boolean" ? "" : typeof node === "string" || typeof node === "number" ? String(node) : Array.isArray(node) ? node.map(textOf).join("") : node.props ? textOf(node.props.children) : "";
var plainText = (children) => {
  const parts = [].concat(children).flat(Infinity);
  return parts.every((c) => typeof c === "string" || typeof c === "number") ? parts.join("") : null;
};
var named = (name, fn) => Object.assign(forwardRef(fn), { displayName: name });
var ink = (className) => h("svg", { className, "aria-hidden": "true", focusable: "false", preserveAspectRatio: "none" }, h("path", { pathLength: 1 }));
var Btn = named("Btn", ({ as, outline, hl, color, size, hover, tool, className, children, ...rest }, ref) => {
  const Tag = as || (rest.href != null ? "a" : "button");
  return h(
    Tag,
    {
      ...Tag === "button" && rest.type == null ? { type: "button" } : null,
      ...rest,
      ref,
      className: cls("pt-btn", outline && "pt-btn--outline", className),
      ...data({ outline: typeof outline === "string" ? outline : null, hl, color, size, hover, tool })
    },
    h("span", { className: "pt-btn__label" }, children),
    // text only: rendering children twice would duplicate ids and the state of anything stateful inside
    h("span", { className: "pt-btn__smear", "aria-hidden": "true" }, textOf(children)),
    hover === "circle" || hover === "underline" ? ink("pt-hover-ink") : null
  );
});
var Mark = named("Mark", ({ hl, color, size, className, children, ...rest }, ref) => h(
  "mark",
  { ...rest, ref, className: cls("pt-mark", className), ...data({ hl, color, size }) },
  h("span", { className: "pt-mark__ink" }, children)
));
var Anno = named("Anno", ({ anno = "circle", tool, className, children, ...rest }, ref) => (
  // the svg is left empty: the script draws one path in it per pass of the instrument
  h(
    "span",
    { ...rest, ref, className: cls("pt-anno", className), ...data({ anno, tool }) },
    children,
    h("svg", { className: "pt-anno__ink", "aria-hidden": "true", focusable: "false" })
  )
));
var Wobble = named("Wobble", ({ as = "span", seed, className, children, ...rest }, ref) => {
  const r = rng(useSeed(seed) + 11), text = plainText(children);
  const props = { ...rest, ref, className: cls("pt-wobble", className), "data-pt-wobbled": "1" };
  if (text == null) return h(as, props, children);
  const letters = text.split(/(\s+)/).filter(Boolean).map((part, i) => /^\s+$/.test(part) ? part : h("span", { key: i, style: { whiteSpace: "nowrap" } }, Array.from(part, (ch, j) => h("span", {
    key: j,
    className: "pt-c",
    style: { "--y": f((r() - 0.5) * 1.2), "--r": f((r() - 0.5) * 2), "--o": f(r() < 0.1 ? 0.74 + r() * 0.12 : 0.9 + r() * 0.1) }
  }, ch))));
  return h(as, props, h("span", { className: "pt-sr" }, text), h("span", { "aria-hidden": "true" }, letters));
});
var Check = named("Check", ({ type = "checkbox", tool, seed, className, style, children, ...input }, ref) => {
  const radio = type === "radio", r = rng(useSeed(seed));
  const box = radio ? wobblyRing(r) : wobblyBox(r);
  return h(
    "label",
    { className: cls(radio ? "pt-radio" : "pt-check", className), style, "data-pt-ready": "", ...data({ tool }) },
    h("input", { type, ...input, ref }),
    h(
      "svg",
      { width: 22, height: 22, viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" },
      h("path", { d: box }),
      h("path", { className: "pt-tick", pathLength: 1, d: radio ? DOT : TICK })
    ),
    radio ? children : h("span", { className: "pt-check__text" }, children)
  );
});
var DayHead = named("DayHead", ({ date = /* @__PURE__ */ new Date(), locale = "en-GB", weekLabel = (n) => `Week ${n}`, className, ...rest }, ref) => {
  const p = dayParts(date, locale);
  return h(
    "div",
    { ...rest, ref, className: cls("pt-dayhead", className) },
    h("span", { className: "pt-dayhead__num" }, p.day),
    h(
      "span",
      { className: "pt-dayhead__meta" },
      h("span", { className: "pt-dayhead__month" }, p.month),
      h("span", { className: "pt-dayhead__weekday" }, p.weekday)
    ),
    h("span", { className: "pt-stamp pt-stamp--round pt-dayhead__kanji", lang: "ja", "aria-hidden": "true" }, p.kanji),
    h("span", { className: "pt-dayhead__weekno" }, weekLabel(p.week))
  );
});
var Week = named("Week", ({ date = /* @__PURE__ */ new Date(), today = date, locale = "en-GB", weekStart, className, children, ...rest }, ref) => {
  const start = weekStart == null ? firstDayOf(locale) : weekStart;
  return h("div", { className: "pt-week-wrap" }, h(
    "div",
    { ...rest, ref, className: cls("pt-week", className) },
    weekDates(date, start).map((d, index) => {
      const p = dayParts(d, locale), isToday = sameDay(d, today);
      const num = isToday ? h(Anno, { className: "pt-week__date", style: { "--pt-anno": "var(--pt-ink-beni)", "--pt-ox": "6px", "--pt-oy": "3px" } }, p.day) : h("span", { className: "pt-week__date" }, p.day);
      return h(
        "div",
        { key: index, className: "pt-week__day", "data-day": d.getDay(), "aria-current": isToday ? "date" : void 0 },
        h("div", { className: "pt-week__head" }, h("span", null, p.short, " ", h("span", { className: "pt-jp", lang: "ja" }, p.kanji)), num),
        typeof children === "function" ? children({ date: d, index, today: isToday }) : null
      );
    })
  ));
});
var Habit = named("Habit", ({ seed, className, style, ...input }, ref) => h(
  "label",
  { className: cls("pt-habit", className), style, "data-pt-ready": "" },
  h("input", { type: "checkbox", ...input, ref }),
  h(
    "svg",
    { width: 20, height: 20, viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" },
    h("circle", { className: "pt-ring", cx: 12, cy: 12, r: 9 }),
    h("path", { className: "pt-fill", pathLength: 1, d: spiral(rng(useSeed(seed))) })
  )
));
var Habits = named("Habits", ({ days, head, habits, onToggle, title = "Habit", className, style, ...rest }, ref) => {
  const n = days || Math.max(0, ...habits.map((x) => x.done.length));
  const labels = head || Array.from({ length: n }, (_, d) => d + 1);
  const at = (ra, ca, rb, cb) => ({ "--pt-ra": ra, "--pt-ca": ca, "--pt-rb": rb, "--pt-cb": cb });
  const row = (r, c, key, name, cells, ink2) => h(
    "div",
    { key, className: cls("pt-habits__row", r === 1 && "pt-habits__head"), style: ink2 ? { "--pt-hb": /^[a-z]+(-[a-z0-9]+)+$/.test(ink2) ? `var(--pt-${ink2})` : ink2 } : void 0 },
    h("span", { className: "pt-habits__name", style: at(r, 1, 1, c) }, name),
    cells.map((cell, d) => cell(at(r, d + 2, d + 2, c), d))
  );
  return h("div", { className: "pt-habits-wrap" }, h(
    "div",
    { ...rest, ref, className: cls("pt-habits", className), "data-pt-ready": "", style: { "--pt-days": n, "--pt-habit-count": habits.length, ...style } },
    row(1, 1, "head", title, labels.slice(0, n).map((label) => (s, d) => h("span", { key: d, style: s }, label))),
    habits.map((x, i) => row(i + 2, i + 2, i, x.name, Array.from({ length: n }, () => (s, d) => h(Habit, {
      key: d,
      style: s,
      seed: (i + 1) * 101 + d,
      checked: !!x.done[d],
      "aria-label": `${x.name}, ${labels[d]}`,
      onChange: onToggle ? (e) => onToggle(i, d, e.target.checked) : void 0,
      readOnly: !onToggle
    })), x.ink))
  ));
});
export {
  Anno,
  Btn,
  Check,
  DayHead,
  Habit,
  Habits,
  Mark,
  Papertooth,
  Week,
  Wobble,
  usePapertooth
};
