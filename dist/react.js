/*! papertooth v0.3.0 | (c) 2026 Thomas Budin | MIT License | github.com/tbudin/papertooth */
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
export {
  Anno,
  Btn,
  Check,
  Mark,
  Papertooth,
  Wobble,
  usePapertooth
};
