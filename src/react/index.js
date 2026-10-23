// papertooth for React. The script adds markup to some elements (a label inside a button, letters in a
// heading, the svg a circle is drawn in); React owns those elements and wipes that markup when it re-renders.
// These components render the same markup themselves, so the script finds it in place and only paints it.
// Written without JSX, so this file works as published source too.
import { createElement as h, forwardRef, useEffect, useId, useState } from 'react';
import { init } from '../js/index.js';
import { rng, f } from '../js/core.js';
import { wobblyBox, wobblyRing, spiral, TICK, DOT } from '../js/shapes.js';
import { firstDayOf, weekDates, sameDay, dayParts } from '../js/dates.js';

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
/* the plain text inside children, for the button's smear (which repeats the label as ink, not as elements) */
const textOf = (node) => node == null || typeof node === 'boolean' ? ''
  : typeof node === 'string' || typeof node === 'number' ? String(node)
  : Array.isArray(node) ? node.map(textOf).join('')
  : node.props ? textOf(node.props.children) : '';
/* children as one string when they are all text ('Hello ', name), otherwise null */
const plainText = (children) => {
  const parts = [].concat(children).flat(Infinity);
  return parts.every(c => typeof c === 'string' || typeof c === 'number') ? parts.join('') : null;
};
const named = (name, fn) => Object.assign(forwardRef(fn), { displayName: name });
const ink = (className) => h('svg', { className, 'aria-hidden': 'true', focusable: 'false', preserveAspectRatio: 'none' }, h('path', { pathLength: 1 }));

/** A highlighter button, or an outlined one with `outline`. Renders an <a> with href, otherwise a <button>. */
export const Btn = named('Btn', ({ as, outline, hl, color, size, hover, tool, className, children, ...rest }, ref) => {
  const Tag = as || (rest.href != null ? 'a' : 'button');
  return h(Tag, {
    ...(Tag === 'button' && rest.type == null ? { type: 'button' } : null),
    ...rest, ref,
    className: cls('pt-btn', outline && 'pt-btn--outline', className),
    ...data({ outline: typeof outline === 'string' ? outline : null, hl, color, size, hover, tool })
  },
  h('span', { className: 'pt-btn__label' }, children),
  // text only: rendering children twice would duplicate ids and the state of anything stateful inside
  h('span', { className: 'pt-btn__smear', 'aria-hidden': 'true' }, textOf(children)),
  hover === 'circle' || hover === 'underline' ? ink('pt-hover-ink') : null);
});

/** A highlighted phrase. */
export const Mark = named('Mark', ({ hl, color, size, className, children, ...rest }, ref) =>
  h('mark', { ...rest, ref, className: cls('pt-mark', className), ...data({ hl, color, size }) },
    h('span', { className: 'pt-mark__ink' }, children)));

/** A mark drawn on text: circle, box, strike, cross, under, hatch or hanamaru. */
export const Anno = named('Anno', ({ anno = 'circle', tool, className, children, ...rest }, ref) =>
  // the svg is left empty: the script draws one path in it per pass of the instrument
  h('span', { ...rest, ref, className: cls('pt-anno', className), ...data({ anno, tool }) },
    children, h('svg', { className: 'pt-anno__ink', 'aria-hidden': 'true', focusable: 'false' })));

/** Typed text whose letters sit a little unevenly. Takes text (including 'Hello ' + name); anything else is passed through. */
export const Wobble = named('Wobble', ({ as = 'span', seed, className, children, ...rest }, ref) => {
  const r = rng(useSeed(seed) + 11), text = plainText(children);
  const props = { ...rest, ref, className: cls('pt-wobble', className), 'data-pt-wobbled': '1' };
  if (text == null) return h(as, props, children);
  const letters = text.split(/(\s+)/).filter(Boolean).map((part, i) => /^\s+$/.test(part) ? part
    : h('span', { key: i, style: { whiteSpace: 'nowrap' } }, Array.from(part, (ch, j) => h('span', {
      key: j, className: 'pt-c',
      style: { '--y': f((r() - .5) * 1.2), '--r': f((r() - .5) * 2), '--o': f(r() < .1 ? .74 + r() * .12 : .9 + r() * .1) }
    }, ch))));
  // screen readers get the text whole (some spell out letters in separate spans); the letters are for the eye
  return h(as, props, h('span', { className: 'pt-sr' }, text), h('span', { 'aria-hidden': 'true' }, letters));
});

/** A hand-drawn checkbox, or a radio with type="radio". Input props (checked, onChange, name…) and the ref go to the input. */
export const Check = named('Check', ({ type = 'checkbox', tool, seed, className, style, children, ...input }, ref) => {
  const radio = type === 'radio', r = rng(useSeed(seed));
  const box = radio ? wobblyRing(r) : wobblyBox(r);
  // data-pt-ready tells the script the drawn box is already here
  return h('label', { className: cls(radio ? 'pt-radio' : 'pt-check', className), style, 'data-pt-ready': '', ...data({ tool }) },
    h('input', { type, ...input, ref }),
    h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' },
      h('path', { d: box }), h('path', { className: 'pt-tick', pathLength: 1, d: radio ? DOT : TICK })),
    radio ? children : h('span', { className: 'pt-check__text' }, children));
});

/* ---------- planner ----------
   Dates are worked out during render, so nothing is written into the page afterwards. The defaults (English,
   Monday first) are the same on the server and in every browser; pass locale and weekStart for others, and pass
   the date (and today) from the server if it renders in another time zone. */

/** A day heading: the date large, month and weekday, the weekday's kanji as a stamp, and the ISO week. */
export const DayHead = named('DayHead', ({ date = new Date(), locale = 'en-GB', weekLabel = n => `Week ${n}`, className, ...rest }, ref) => {
  const p = dayParts(date, locale);
  return h('div', { ...rest, ref, className: cls('pt-dayhead', className) },
    h('span', { className: 'pt-dayhead__num' }, p.day),
    h('span', { className: 'pt-dayhead__meta' },
      h('span', { className: 'pt-dayhead__month' }, p.month), h('span', { className: 'pt-dayhead__weekday' }, p.weekday)),
    h('span', { className: 'pt-stamp pt-stamp--round pt-dayhead__kanji', lang: 'ja', 'aria-hidden': 'true' }, p.kanji),
    h('span', { className: 'pt-dayhead__weekno' }, weekLabel(p.week)));
});

/** Seven days from weekStart around `date`, today circled. children(day) fills a day: { date, index, today }. */
export const Week = named('Week', ({ date = new Date(), today = date, locale = 'en-GB', weekStart, className, children, ...rest }, ref) => {
  const start = weekStart == null ? firstDayOf(locale) : weekStart;
  return h('div', { className: 'pt-week-wrap' }, h('div', { ...rest, ref, className: cls('pt-week', className) },
    weekDates(date, start).map((d, index) => {
      const p = dayParts(d, locale), isToday = sameDay(d, today);
      const num = isToday
        ? h(Anno, { className: 'pt-week__date', style: { '--pt-anno': 'var(--pt-ink-beni)', '--pt-ox': '6px', '--pt-oy': '3px' } }, p.day)
        : h('span', { className: 'pt-week__date' }, p.day);
      return h('div', { key: index, className: 'pt-week__day', 'data-day': d.getDay(), 'aria-current': isToday ? 'date' : undefined },
        h('div', { className: 'pt-week__head' }, h('span', null, p.short, ' ', h('span', { className: 'pt-jp', lang: 'ja' }, p.kanji)), num),
        typeof children === 'function' ? children({ date: d, index, today: isToday }) : null);
    })));
});

/** One habit-tracker cell: a ring, coloured in with a spiral when checked. Input props and the ref go to the input. */
export const Habit = named('Habit', ({ seed, className, style, ...input }, ref) =>
  h('label', { className: cls('pt-habit', className), style, 'data-pt-ready': '' },
    h('input', { type: 'checkbox', ...input, ref }),
    h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' },
      h('circle', { className: 'pt-ring', cx: 12, cy: 12, r: 9 }),
      h('path', { className: 'pt-fill', pathLength: 1, d: spiral(rng(useSeed(seed))) }))));

/**
 * A habit tracker: one row per habit, one column per day (rows and columns swap on narrow screens).
 * habits: [{ name, ink?, done: boolean[] }]; onToggle(habitIndex, day, checked) is called when a cell changes.
 */
export const Habits = named('Habits', ({ days, head, habits, onToggle, title = 'Habit', className, style, ...rest }, ref) => {
  const n = days || Math.max(0, ...habits.map(x => x.done.length));
  const labels = head || Array.from({ length: n }, (_, d) => d + 1);
  // each cell is placed twice over, as rows-as-habits (wide) and rows-as-days (narrow)
  const at = (ra, ca, rb, cb) => ({ '--pt-ra': ra, '--pt-ca': ca, '--pt-rb': rb, '--pt-cb': cb });
  const row = (r, c, key, name, cells, ink) => h('div', { key, className: cls('pt-habits__row', r === 1 && 'pt-habits__head'), style: ink ? { '--pt-hb': /^[a-z]+(-[a-z0-9]+)+$/.test(ink) ? `var(--pt-${ink})` : ink } : undefined },
    h('span', { className: 'pt-habits__name', style: at(r, 1, 1, c) }, name),
    cells.map((cell, d) => cell(at(r, d + 2, d + 2, c), d)));
  return h('div', { className: 'pt-habits-wrap' }, h('div', { ...rest, ref, className: cls('pt-habits', className), 'data-pt-ready': '', style: { '--pt-days': n, '--pt-habit-count': habits.length, ...style } },
    row(1, 1, 'head', title, labels.slice(0, n).map(label => (s, d) => h('span', { key: d, style: s }, label))),
    habits.map((x, i) => row(i + 2, i + 2, i, x.name, Array.from({ length: n }, () => (s, d) => h(Habit, {
      key: d, style: s, seed: (i + 1) * 101 + d, checked: !!x.done[d], 'aria-label': `${x.name}, ${labels[d]}`,
      onChange: onToggle ? e => onToggle(i, d, e.target.checked) : undefined, readOnly: !onToggle
    })), x.ink))));
});
