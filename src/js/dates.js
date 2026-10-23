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
  } catch (e) { /* an unknown locale falls back to Monday */ }
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
