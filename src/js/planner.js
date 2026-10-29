// Fill planner pieces with a real date: data-today for today, or data-date="2026-10-21" for another day, written in the
// language of data-locale or the page. The dates themselves come from dates.js; this file only writes them into the page.
import { isoWeek, firstDayOf, weekDates, sameDay, dayParts, stampLayout, stampLabel, cellKey, fillKey } from './dates.js';

export { isoWeek };

const set = (el, sel, text) => { const n = el.querySelector(sel); if (n) n.textContent = text; };
const parseDate = v => {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(v || '');
  return m ? new Date(+m[1], +m[2] - 1, +(m[3] || 1)) : new Date();   // anything else, 'today' included, is today
};
/** The day a planner piece is for: its data-date (2026-10-21), or today. */
export const dateOf = el => parseDate(el.dataset.date);
/** The language it is written in: its data-locale, else the page's lang, else British English. */
export const localeOf = el => el.dataset.locale || (el.closest('[lang]') && el.closest('[lang]').lang) || 'en-GB';
/** "Week {n}", or a function of n. */
export const weekText = (label, n) => typeof label === 'function' ? label(n) : String(label).replace('{n}', n);

/** A day heading for `date`. Options: locale, weekLabel ('Week {n}', 'Semaine {n}', or a function of n). */
export function dayHead(el, date = dateOf(el), { locale = localeOf(el), weekLabel = el.dataset.weekLabel || 'Week {n}' } = {}) {
  const p = dayParts(date, locale);
  set(el, '.pt-dayhead__num', p.day);
  set(el, '.pt-dayhead__month', p.month);
  set(el, '.pt-dayhead__weekday', p.weekday);
  set(el, '.pt-dayhead__kanji', p.kanji);
  set(el, '.pt-dayhead__weekno', weekText(weekLabel, p.week));
}

/**
 * Dates for the week containing `date`, with `date` marked. Options: locale, weekStart (0 = Sunday … 6 = Saturday),
 * mark (circle, box, highlight, none; data-mark). Filling it again for another date moves the mark.
 */
export function week(el, date = dateOf(el), { locale = localeOf(el), weekStart = el.dataset.weekStart != null ? +el.dataset.weekStart : firstDayOf(locale), mark = el.dataset.mark || 'circle' } = {}) {
  const dates = weekDates(date, weekStart);
  el.querySelectorAll('.pt-week__day').forEach((d, k) => {
    const dt = dates[k];
    if (!dt) return;
    d.dataset.day = dt.getDay();   // the weekend is coloured by day, wherever the week starts
    const today = sameDay(dt, date);
    d.toggleAttribute('aria-current', today);
    if (today) d.setAttribute('aria-current', 'date');
    const ds = d.querySelector('.pt-week__date');
    if (!ds) return;
    // the date is written afresh, without the last mark; its look comes from the stylesheet, so its own style stays
    ds.textContent = dt.getDate();
    ds.classList.remove('pt-anno', 'pt-mark');
    delete ds.dataset.anno; delete ds.dataset.ptPainted;
    if (today && mark === 'highlight') ds.classList.add('pt-mark');
    else if (today && mark !== 'none') { ds.classList.add('pt-anno'); ds.dataset.anno = mark; }
  });
}

/* ---------- date stamps ---------- */
const span = (cls, text) => { const s = document.createElement('span'); s.className = cls; if (text != null) s.textContent = text; return s; };
/** The pencil marks a date stamp cell gets: around its label (circle, box, highlight) and over the cell (x, strike). */
export function stampMark(part, state, mark = 'circle', past = 'none') {
  return {
    label: state === 'current' && part !== 'write' && part !== 'title' && mark !== 'none' ? mark : null,
    // the month selector above a calendar is only circled: crossing out its past months reads as clutter
    cell: state === 'past' && part !== 'head' && part !== 'months' && (past === 'x' || past === 'strike') ? past : null
  };
}

/**
 * Fill a .pt-datestamp from its data attributes: data-unit (week, month, year, day), data-variant (bar for one row, wide for
 * a month in one long row),
 * data-date (today or 2026-10-21), data-mark for the current one (circle, box, highlight, none), data-past for the ones
 * gone by (x, strike, none), data-locale, data-week-start, data-rows (week, wide month: a number, or labels "Run, Read") and
 * data-title (week), data-years and data-from (year bar), data-mark-tool, data-past-tool.
 * Anything inside the stamp with data-day, data-date or data-month (and data-row for a row to fill in) is placed in that cell:
 * a stamp picture, a letter, a mark. It sits with the pencil marks, on top of the printed stamp.
 * It is printed twice from the same cells: once in stamp ink, once on top with only the pencil marks, so the ink's
 * texture is one filter for the whole stamp and the marks keep their own.
 */
export function dateStamp(el, date = parseDate(el.dataset.date), opts = {}) {
  const d = el.dataset, unit = d.unit || 'week', mark = d.mark || 'circle', past = d.past || 'none';
  const locale = opts.locale || localeOf(el);
  const rows = !d.rows ? 1 : /^\s*\d+\s*$/.test(d.rows) ? +d.rows : d.rows.split(',').map(s => s.trim()).filter(Boolean);
  const { sections } = stampLayout(unit, date, {
    variant: d.variant, locale, weekStart: d.weekStart != null ? +d.weekStart : undefined, years: d.years ? +d.years : undefined,
    from: d.from ? +d.from : undefined, rows, title: d.title, ...opts
  });
  // the author's content, and any placed on an earlier fill, so it survives the stamp being filled again
  const fills = Array.from(el.querySelectorAll(':scope > :is([data-day], [data-date], [data-month]), .pt-datestamp__fill > *'), n => ({
    n, key: fillKey({ date: n.dataset.date, day: n.dataset.day, month: n.dataset.month }, date), row: n.dataset.row ? +n.dataset.row : 0
  }));
  const layer = marks => {
    const out = div(marks ? 'pt-datestamp__marks' : 'pt-datestamp__print');
    if (marks) out.setAttribute('aria-hidden', 'true');
    for (const s of sections) {
      const sec = out.appendChild(div('pt-datestamp__section'));
      sec.dataset.part = s.part;
      for (const row of s.rows) {
        const r = sec.appendChild(div('pt-datestamp__row'));
        for (const c of row) {
          const cell = r.appendChild(span('pt-datestamp__cell')), label = span('pt-datestamp__label', c.label);
          cell.dataset.state = c.state;
          if (c.side) cell.dataset.side = '';
          const m = marks ? stampMark(s.part, c.state, mark, past) : {};
          if (m.cell) { Object.assign(cell.dataset, { anno: m.cell, tool: d.pastTool || 'graphite' }); cell.classList.add('pt-anno'); }
          if (m.label === 'highlight') { const hl = document.createElement('mark'); hl.className = 'pt-mark'; hl.append(label); cell.append(hl); }
          else {
            if (m.label) { Object.assign(label.dataset, { anno: m.label, tool: d.markTool || 'pencil' }); label.classList.add('pt-anno'); }
            cell.append(label);
          }
          const key = marks && cellKey(s.part, c, unit), here = key ? fills.filter(f => f.key === key && f.row === (c.row || 0)) : [];
          if (here.length) { const box = cell.appendChild(span('pt-datestamp__fill')); box.append(...here.map(f => f.n)); }
        }
      }
    }
    return out;
  };
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', stampLabel(unit, date, locale, { mark, variant: d.variant }));
  if (/^ja\b/.test(locale)) el.lang = 'ja';
  else if (el.lang === 'ja') el.removeAttribute('lang');
  el.replaceChildren(layer(false), layer(true));
  el.dataset.ptReady = '';
}
const div = cls => { const e = document.createElement('div'); e.className = cls; return e; };
