// Fill planner pieces with a real date. Add data-today to a .pt-dayhead or .pt-week to use today.
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const KANJI = '月火水木金土日';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const set = (el, sel, text) => { const n = el.querySelector(sel); if (n) n.textContent = text; };
const dayIndex = d => (d.getDay() + 6) % 7;

export function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  return Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 864e5 + 1) / 7);
}

export function dayHead(el, date = new Date()) {
  const i = dayIndex(date);
  set(el, '.pt-dayhead__num', date.getDate());
  set(el, '.pt-dayhead__month', MONTHS[date.getMonth()] + ' ' + date.getFullYear());
  set(el, '.pt-dayhead__weekday', DAYS[i]);
  set(el, '.pt-dayhead__kanji', KANJI[i]);
  set(el, '.pt-dayhead__weekno', 'Week ' + isoWeek(date));
}

/** Dates for the week containing `date`, Monday first. Today's date gets circled. */
export function week(el, date = new Date()) {
  const i = dayIndex(date), mon = new Date(date);
  mon.setDate(date.getDate() - i);
  el.querySelectorAll('.pt-week__day').forEach((d, k) => {
    const dt = new Date(mon); dt.setDate(mon.getDate() + k);
    const ds = d.querySelector('.pt-week__date');
    if (!ds) return;
    ds.textContent = dt.getDate();
    const today = k === i;
    ds.classList.toggle('pt-anno', today);
    if (today) { ds.dataset.anno = 'circle'; ds.style.cssText = '--pt-anno:var(--pt-ink-beni);--pt-ox:6px;--pt-oy:3px'; }
  });
}
