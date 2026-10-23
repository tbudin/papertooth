// Fill planner pieces with a real date. Add data-today to a .pt-dayhead or .pt-week to use today.
// The dates themselves come from dates.js; this file only writes them into the page.
import { isoWeek, firstDayOf, weekDates, sameDay, dayParts } from './dates.js';

export { isoWeek };

const set = (el, sel, text) => { const n = el.querySelector(sel); if (n) n.textContent = text; };

/** A day heading for `date`. Options: locale (default 'en-GB'). */
export function dayHead(el, date = new Date(), { locale = 'en-GB' } = {}) {
  const p = dayParts(date, locale);
  set(el, '.pt-dayhead__num', p.day);
  set(el, '.pt-dayhead__month', p.month);
  set(el, '.pt-dayhead__weekday', p.weekday);
  set(el, '.pt-dayhead__kanji', p.kanji);
  set(el, '.pt-dayhead__weekno', 'Week ' + p.week);
}

/** Dates for the week containing `date`, with `date` circled. Options: locale, weekStart (0 = Sunday … 6 = Saturday). */
export function week(el, date = new Date(), { locale = 'en-GB', weekStart = firstDayOf(locale) } = {}) {
  const dates = weekDates(date, weekStart);
  el.querySelectorAll('.pt-week__day').forEach((d, k) => {
    const dt = dates[k];
    if (!dt) return;
    d.dataset.day = dt.getDay();   // the weekend is coloured by day, wherever the week starts
    const ds = d.querySelector('.pt-week__date');
    if (!ds) return;
    ds.textContent = dt.getDate();
    const today = sameDay(dt, date);
    ds.classList.toggle('pt-anno', today);
    if (today) { ds.dataset.anno = 'circle'; ds.style.cssText = '--pt-anno:var(--pt-ink-beni);--pt-ox:6px;--pt-oy:3px'; }
  });
}
