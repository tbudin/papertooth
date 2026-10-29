// Calendar helpers for the planner pieces. No DOM, so they run anywhere (a server, a worker, a native app).
// Names come from Intl in any locale; the week can start on any day (0 = Sunday … 6 = Saturday, as Date#getDay).

/** ISO 8601 week number: weeks start on Monday, and week 1 holds the year's first Thursday. */
export function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  return Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 864e5 + 1) / 7);
}

/**
 * The first day of the week where `locale` is used, when the runtime knows it (Intl.Locale week info);
 * Monday otherwise. Not every runtime reports it, so pass weekStart explicitly when the server and the
 * browser must agree.
 */
export function firstDayOf(locale) {
  try {
    const l = new Intl.Locale(locale || new Intl.DateTimeFormat().resolvedOptions().locale);
    const info = typeof l.getWeekInfo === 'function' ? l.getWeekInfo() : l.weekInfo;
    if (info && info.firstDay) return info.firstDay % 7;
  } catch { /* an unknown locale falls back to Monday */ }
  return 1;
}

/** The seven days of the week that contains `date`, starting on `weekStart`. */
export function weekDates(date = new Date(), weekStart = 1) {
  const back = (date.getDay() - weekStart + 7) % 7;
  return Array.from({ length: 7 }, (_, k) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - back + k));
}

export const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formats = new Map();
const fmt = (locale, opts) => {
  const key = locale + JSON.stringify(opts);
  if (!formats.has(key)) formats.set(key, new Intl.DateTimeFormat(locale, opts));
  return formats.get(key);
};

/** Everything a day heading shows: the date, month and year, weekday (long and short), its kanji and the ISO week. */
export function dayParts(date = new Date(), locale = 'en-GB') {
  return {
    day: date.getDate(),
    month: fmt(locale, { month: 'long', year: 'numeric' }).format(date),
    weekday: fmt(locale, { weekday: 'long' }).format(date),
    short: fmt(locale, { weekday: 'short' }).format(date),
    kanji: fmt('ja-JP', { weekday: 'narrow' }).format(date),
    week: isoWeek(date)
  };
}

const sign = n => (n < 0 ? 'past' : n > 0 ? 'future' : 'current');
const midnight = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * The cells of a date stamp, each { label, state, date } with state 'past', 'current' or 'future' relative to `date`,
 * and `date` the day it stands for (the 1st for a month, 1 January for a year):
 * unit 'week' (seven weekdays), 'month' (the twelve months), 'year' (a run of years) or 'day' (the days of the month).
 */
export function stampCells(unit = 'week', date = new Date(), { locale = 'en-GB', weekStart = firstDayOf(locale), years = 5, from } = {}) {
  if (unit === 'month') {
    const name = fmt(locale, { month: 'short' });
    return Array.from({ length: 12 }, (_, m) => ({ label: name.format(new Date(date.getFullYear(), m, 1)), state: sign(m - date.getMonth()), date: new Date(date.getFullYear(), m, 1) }));
  }
  if (unit === 'year') {
    const first = from == null ? date.getFullYear() - Math.floor((years - 1) / 2) : from;
    return Array.from({ length: years }, (_, k) => ({ label: String(first + k), state: sign(first + k - date.getFullYear()), date: new Date(first + k, 0, 1) }));
  }
  if (unit === 'day') {
    const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return Array.from({ length: days }, (_, k) => ({ label: String(k + 1), state: sign(k + 1 - date.getDate()), date: new Date(date.getFullYear(), date.getMonth(), k + 1) }));
  }
  const name = fmt(locale, { weekday: 'short' });
  return weekDates(date, weekStart).map(d => ({ label: name.format(d), state: sign(midnight(d) - midnight(date)), date: d }));
}

/**
 * What a date stamp says to a screen reader, read whole: what it marks. A week or day stamp, and a month calendar
 * with its day marked, say the date; a year of months with its month marked, and the month bar, say the month;
 * the year bar says the year. With nothing marked (mark 'none'), a calendar says the month or year it shows.
 */
export function stampLabel(unit, date = new Date(), locale = 'en-GB', { mark = 'circle', variant } = {}) {
  const marked = mark !== 'none', bar = variant === 'bar';
  const DATE = { dateStyle: 'full' }, MONTH = { month: 'long', year: 'numeric' }, YEAR = { year: 'numeric' };
  const opts = unit === 'month' ? (bar || !marked ? MONTH : DATE) : unit === 'year' ? (bar || !marked ? YEAR : MONTH) : DATE;
  return fmt(locale, opts).format(date);
}

/**
 * Everything a date stamp prints, with no DOM: { sections: [{ part, rows: [[{ label, state }]] }] }, state being
 * 'past', 'current', 'future' or '' (no date, such as a blank before the 1st).
 *   variant 'bar': one row (week days, the months, a run of years, or the days of the month);
 *   unit 'week': a weekday header over rows of empty cells to fill in (a title line on top with `title`);
 *   unit 'month': the twelve months over the month's calendar, the 1st on its weekday;
 *   unit 'month', variant 'wide': the whole month in one long row, each day under its weekday, with rows to fill in;
 *     its first column (cells with `side`) names the month and the year;
 *   unit 'year': the year over its twelve months.
 * `rows` is how many rows to fill in, or their labels (['Run', 'Read']), written in a first column. The cells of those
 * rows carry `row` (1, 2…) and the `date` of their column, so content can be placed in any of them.
 */
export function stampLayout(unit = 'week', date = new Date(), { variant, locale = 'en-GB', weekStart = firstDayOf(locale), years, from, rows = 1, title } = {}) {
  const opts = { locale, weekStart, years, from };
  const labels = Array.isArray(rows) ? rows.map(String) : null, count = labels ? labels.length : rows;
  if (variant === 'bar' || unit === 'day') return { sections: [{ part: 'bar', rows: unit === 'day' ? chunk(stampCells('day', date, opts), 16) : [stampCells(unit, date, opts)] }] };
  const narrow = fmt(locale, { weekday: 'narrow' });
  const weekdays = weekDates(date, weekStart).map(d => ({ label: narrow.format(d), state: sign(midnight(d) - midnight(date)), date: d }));
  const side = label => ({ label, state: '', side: true });
  const months = stampCells('month', date, opts);
  if (unit === 'month' && variant === 'wide') {
    const days = stampCells('day', date, opts);
    return { sections: [
      { part: 'head', rows: [[side(fmt(locale, { month: 'short' }).format(date)), ...days.map((_, k) => ({ label: narrow.format(new Date(date.getFullYear(), date.getMonth(), k + 1)), state: '' }))]] },
      { part: 'days', rows: [[side(String(date.getFullYear())), ...days]] },
      // rows to tick off day by day, so the days gone by are crossed out only on the dates
      { part: 'write', rows: Array.from({ length: count }, (_, r) => [side(labels ? labels[r] : ''), ...days.map(d => ({ label: '', state: '', date: d.date, row: r + 1 }))]) }
    ] };
  }
  if (unit === 'month') {
    const first = new Date(date.getFullYear(), date.getMonth(), 1), lead = (first.getDay() - weekStart + 7) % 7;
    const days = stampCells('day', date, opts), blank = { label: '', state: '' };
    const cells = [...Array(lead).fill(blank), ...days];
    while (cells.length % 7) cells.push(blank);
    return { sections: [
      { part: 'months', rows: chunk(months, 6) },
      { part: 'head', rows: [weekdays.map(d => ({ label: d.label, state: '' }))] },
      { part: 'days', rows: chunk(cells, 7) }
    ] };
  }
  if (unit === 'year') {
    return { sections: [{ part: 'title', rows: [[{ label: String(date.getFullYear()), state: '' }]] }, { part: 'year', rows: chunk(months, 4) }] };
  }
  // with labels, the week gets a first column for them too
  const lead = labels ? [side('')] : [];
  const sections = [{ part: 'head', rows: [[...lead, ...weekdays]] }, { part: 'write', rows: Array.from({ length: count }, (_, r) =>
    [...(labels ? [side(labels[r])] : []), ...weekdays.map(d => ({ label: '', state: d.state, date: d.date, row: r + 1 }))]) }];
  if (title != null) sections.unshift({ part: 'title', rows: [[{ label: title, state: '' }]] });
  return { sections };
}
const pad = n => String(n).padStart(2, '0');
/** What a stamp cell stands for, as a key that content can name: d:2026-10-03 for a day, m:2026-10 for a month, y:2026 for a year. */
export function cellKey(part, cell, unit) {
  if (!cell.date) return null;
  const d = cell.date, ym = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  if (part === 'months' || part === 'year' || (part === 'bar' && unit === 'month')) return `m:${ym}`;
  if (part === 'bar' && unit === 'year') return `y:${d.getFullYear()}`;
  return `d:${ym}-${pad(d.getDate())}`;
}
/** The cell some content names: { date: '2026-10-03' | '2026-10' | '2026' } or { day: 3 } or { month: 3 }, in the stamp's month and year. */
export function fillKey({ date, day, month }, stampDate) {
  if (date) { const [y, m, d] = String(date).split('-'); return d ? `d:${y}-${pad(m)}-${pad(d)}` : m ? `m:${y}-${pad(m)}` : `y:${y}`; }
  const ym = `${stampDate.getFullYear()}-${pad(stampDate.getMonth() + 1)}`;
  if (day != null) return `d:${ym}-${pad(day)}`;
  if (month != null) return `m:${stampDate.getFullYear()}-${pad(month)}`;
  return null;
}
const chunk = (list, n) => Array.from({ length: Math.ceil(list.length / n) }, (_, i) => list.slice(i * n, i * n + n));
