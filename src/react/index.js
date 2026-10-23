// papertooth for React. The script adds markup to some elements (a label inside a button, letters in a
// heading, the svg a circle is drawn in); React owns those elements and wipes that markup when it re-renders.
// These components render the same markup themselves, so the script finds it in place and only paints it.
// Written without JSX, so this file works as published source too.
import { createElement as h, useEffect, useId, useState } from 'react';
import { init } from '../js/index.js';
import { rng, f } from '../js/core.js';
import { wobblyBox, wobblyRing, TICK, DOT } from '../js/shapes.js';

/** Start papertooth when the component mounts and stop it when it unmounts. Returns the kit once running. */
export function usePapertooth(options) {
  const [kit, setKit] = useState(null);
  useEffect(() => {
    const k = init(options);
    setKit(k);
    return () => k.destroy();
    // options are read once, when the page mounts, like init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return kit;
}

/** Drop-in for a layout: <Papertooth seed={7} /> starts the script for the whole page. */
export function Papertooth(options) {
  usePapertooth(options);
  return null;
}

/* useId is the same on the server and in the browser, so a seed taken from it keeps hydration exact */
function useSeed(seed) {
  const id = useId();
  if (seed != null) return seed | 0;
  let x = 2166136261;
  for (let i = 0; i < id.length; i++) x = Math.imul(x ^ id.charCodeAt(i), 16777619);
  return x >>> 0;
}

const data = (attrs) => {
  const out = {};
  for (const k in attrs) if (attrs[k] != null && attrs[k] !== false) out['data-' + k] = String(attrs[k]);
  return out;
};
const cls = (...names) => names.filter(Boolean).join(' ');
const ink = (className) => h('svg', { className, 'aria-hidden': 'true', focusable: 'false', preserveAspectRatio: 'none' }, h('path', { pathLength: 1 }));

/** A highlighter button, or an outlined one with `outline`. Renders an <a> with href, otherwise a <button>. */
export function Btn({ as, outline, hl, color, size, hover, tool, className, children, ...rest }) {
  const Tag = as || (rest.href != null ? 'a' : 'button');
  return h(Tag, {
    ...(Tag === 'button' && rest.type == null ? { type: 'button' } : null),
    ...rest,
    className: cls('pt-btn', outline && 'pt-btn--outline', className),
    ...data({ outline: typeof outline === 'string' ? outline : null, hl, color, size, hover, tool })
  },
  h('span', { className: 'pt-btn__label' }, children),
  h('span', { className: 'pt-btn__smear', 'aria-hidden': 'true' }, children),
  hover === 'circle' || hover === 'underline' ? ink('pt-hover-ink') : null);
}

/** A highlighted phrase. */
export function Mark({ hl, color, size, className, children, ...rest }) {
  return h('mark', { ...rest, className: cls('pt-mark', className), ...data({ hl, color, size }) },
    h('span', { className: 'pt-mark__ink' }, children));
}

/** A mark drawn on text: circle, box, strike, cross, under, hatch or hanamaru. */
export function Anno({ anno = 'circle', tool, className, children, ...rest }) {
  // the svg is left empty: the script draws one path in it per pass of the instrument
  return h('span', { ...rest, className: cls('pt-anno', className), ...data({ anno, tool }) },
    children, h('svg', { className: 'pt-anno__ink', 'aria-hidden': 'true', focusable: 'false' }));
}

/** Typed text whose letters sit a little unevenly. Takes plain text; anything else is passed through. */
export function Wobble({ as = 'span', seed, className, children, ...rest }) {
  const r = rng(useSeed(seed) + 11);
  const text = typeof children === 'string' || typeof children === 'number' ? String(children) : null;
  const body = text == null ? children : text.split(/(\s+)/).filter(Boolean).map((part, i) => /^\s+$/.test(part) ? part
    : h('span', { key: i, style: { whiteSpace: 'nowrap' } }, Array.from(part, (ch, j) => h('span', {
      key: j, className: 'pt-c',
      style: { '--y': f((r() - .5) * 1.2), '--r': f((r() - .5) * 2), '--o': f(r() < .1 ? .74 + r() * .12 : .9 + r() * .1) }
    }, ch))));
  // some screen readers spell out letters in separate spans, so the text is also given whole
  return h(as, {
    'aria-label': text == null ? undefined : text.replace(/\s+/g, ' ').trim(),
    ...rest, className: cls('pt-wobble', className), 'data-pt-wobbled': '1'
  }, body);
}

/** A hand-drawn checkbox, or a radio with type="radio". Input props (checked, onChange, name…) go to the input. */
export function Check({ type = 'checkbox', tool, seed, className, style, children, ...input }) {
  const radio = type === 'radio', r = rng(useSeed(seed));
  const box = radio ? wobblyRing(r) : wobblyBox(r);
  return h('label', { className: cls(radio ? 'pt-radio' : 'pt-check', 'is-ready', className), style, ...data({ tool }) },
    h('input', { type, ...input }),
    h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' },
      h('path', { d: box }), h('path', { className: 'pt-tick', pathLength: 1, d: radio ? DOT : TICK })),
    radio ? children : h('span', { className: 'pt-check__text' }, children));
}
