// Fill planner pieces with a real date. Add data-today to a .pt-dayhead or .pt-week to use today.
// The dates themselves come from dates.js; this file only writes them into the page.
import { isoWeek, firstDayOf, weekDates, sameDay, dayParts, stampLayout, stampLabel } from './dates.js';

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

/* ---------- date stamps ---------- */
const span = (cls, text) => { const s = document.createElement('span'); s.className = cls; if (text != null) s.textContent = text; return s; };
const parseDate = v => {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(v || '');
  return m ? new Date(+m[1], +m[2] - 1, +(m[3] || 1)) : new Date();   // anything else, 'today' included, is today
};

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
 * gone by (x, strike, none), data-locale, data-week-start, data-rows (week, wide month) and data-title (week), data-years and data-from
 * (year bar), data-mark-tool, data-past-tool.
 * It is printed twice from the same cells: once in stamp ink, once on top with only the pencil marks, so the ink's
 * texture is one filter for the whole stamp and the marks keep their own.
 */
export function dateStamp(el, date = parseDate(el.dataset.date), opts = {}) {
  const d = el.dataset, unit = d.unit || 'week', mark = d.mark || 'circle', past = d.past || 'none';
  const locale = opts.locale || d.locale || (el.closest('[lang]') && el.closest('[lang]').lang) || 'en-GB';
  const { sections } = stampLayout(unit, date, {
    variant: d.variant, locale, weekStart: d.weekStart != null ? +d.weekStart : undefined, years: d.years ? +d.years : undefined,
    from: d.from ? +d.from : undefined, rows: d.rows ? +d.rows : 1, title: d.title, ...opts
  });
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
          if (m.cell) Object.assign(cell.dataset, { anno: m.cell, tool: d.pastTool || 'graphite' }), cell.classList.add('pt-anno');
          if (m.label === 'highlight') { const hl = document.createElement('mark'); hl.className = 'pt-mark'; hl.append(label); cell.append(hl); continue; }
          if (m.label) Object.assign(label.dataset, { anno: m.label, tool: d.markTool || 'pencil' }), label.classList.add('pt-anno');
          cell.append(label);
        }
      }
    }
    return out;
  };
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', stampLabel(unit, date, locale, { mark, variant: d.variant }));
  if (/^ja\b/.test(locale)) el.lang = 'ja';
  el.replaceChildren(layer(false), layer(true));
  el.dataset.ptReady = '';
}
const div = cls => { const e = document.createElement('div'); e.className = cls; return e; };
