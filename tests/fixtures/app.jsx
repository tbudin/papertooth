// Test pages, one per scenario (?s=name). Each runs, then writes what it saw into <body data-result> for the spec.
import { useState, useRef } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import * as PT from 'papertooth';
import { Btn, Wobble, Check, DateStamp } from 'papertooth/react';
import { Notes, Started, HydrateApp } from './components.jsx';

const wait = ms => new Promise(r => setTimeout(r, ms));
// wait for a condition, not a fixed time: under a busy test runner the observers fire late
const until = async (check, ms = 8000) => { for (const end = Date.now() + ms; !check() && Date.now() < end;) await wait(25); };
const finished = () => Promise.all(document.getAnimations().map(a => a.finished));
const q = s => document.querySelector(s);
const text = el => el.textContent.replace(/\s+/g, ' ').trim();
const errors = [];
const consoleError = console.error;
console.error = (...a) => { errors.push(a.map(String).join(' | ').slice(0, 400)); consoleError(...a); };
const tall = <div style={{ height: '2400px' }} />;
const mount = el => createRoot(q('#root')).render(el);

const scenarios = {
  // the script's own state must survive React changing an element's className
  async className() {
    let setOn;
    function App() {
      const [on, set] = useState(false); setOn = set;
      return <Started><main className="pt-sheet">{tall}<section id="blk" className={on ? 'is-on' : 'is-off'}><span className="pt-stamp pt-stamp--round">済</span></section>{tall}</main></Started>;
    }
    mount(<App />);
    await wait(300);
    q('#blk').scrollIntoView({ block: 'center' });
    await until(() => q('#blk').dataset.ptDrawn != null);
    await finished();
    flushSync(() => setOn(true));
    await wait(300);
    await finished();
    return { className: q('#blk').className, drawn: q('#blk').dataset.ptDrawn != null, stampOpacity: getComputedStyle(q('#blk .pt-stamp')).opacity };
  },
  // init() after destroy() (a remount) must still draw what is below the fold
  async remount() {
    q('#root').innerHTML = `<main class="pt-sheet">${'<p>line</p>'.repeat(120)}<section id="blk"><span class="pt-stamp pt-stamp--round">済</span></section></main>`;
    PT.init({ seed: 7 }).destroy();
    PT.init({ seed: 7 });
    await wait(200);
    q('#blk').scrollIntoView({ block: 'center' });
    await until(() => q('#blk').dataset.ptDrawn != null);
    await finished();
    return { drawn: q('#blk').dataset.ptDrawn != null, stampOpacity: getComputedStyle(q('#blk .pt-stamp')).opacity };
  },
  // content added on screen after start: drawn on by default, shown drawn with drawInserted: false or settle()
  async inserted() {
    const add = () => { const s = document.createElement('section'); s.innerHTML = '<span class="pt-stamp pt-stamp--round">新</span>'; q('#sheet').append(s); return s; };
    const out = {};
    for (const drawInserted of [true, false]) {
      q('#root').innerHTML = '<main class="pt-sheet" id="sheet"><p>start</p></main>';
      const kit = PT.init({ seed: 7, drawInserted });
      await wait(200);
      const sec = add();
      // drawn on: wait until it is marked drawn and read the animation while it plays; shown drawn: it is marked off
      await until(() => sec.dataset.ptDrawn != null || sec.getAttribute('data-pt-draw') === 'off');
      out[drawInserted ? 'default' : 'drawInsertedFalse'] = { draw: sec.getAttribute('data-pt-draw'), animation: getComputedStyle(sec.querySelector('.pt-stamp')).animationName };
      kit.destroy();
    }
    q('#root').innerHTML = '<main class="pt-sheet" id="sheet"><p>start</p></main>';
    const kit = PT.init({ seed: 7 });
    await wait(200);
    const sec = add();
    kit.settle(sec);
    await wait(150);
    out.settle = { draw: sec.getAttribute('data-pt-draw'), animation: getComputedStyle(sec.querySelector('.pt-stamp')).animationName };
    return out;
  },
  // Wobble with mixed text, Btn with an element inside, refs
  async components() {
    const refs = {};
    function App() {
      refs.btn = useRef(null); refs.check = useRef(null); refs.habit = useRef(null);
      return <main className="pt-sheet">
        <Wobble as="h1" id="w">Hello {'Tom'}</Wobble>
        <Wobble id="n">{5} tasks</Wobble>
        <Btn ref={refs.btn} href="#"><b id="icon">★</b> Save</Btn>
        <Check ref={refs.check} defaultChecked>Ref check</Check>
      </main>;
    }
    mount(<App />);
    await wait(300);
    const w = q('#w'), range = document.createRange();
    range.selectNodeContents(w); getSelection().removeAllRanges(); getSelection().addRange(range);
    const copied = getSelection().toString(); getSelection().removeAllRanges();
    return {
      letters: w.querySelectorAll('.pt-c').length, srText: w.querySelector('.pt-sr').textContent, copied,
      lettersHidden: w.querySelector('.pt-c').closest('[aria-hidden="true"]') != null, numbers: q('#n .pt-sr').textContent,
      smear: q('.pt-btn__smear').innerHTML, icons: document.querySelectorAll('#icon').length,
      btnRef: refs.btn.current.tagName, checkRef: refs.check.current.type
    };
  },
  // re-rendering keeps every piece of markup the components render
  async rerender() {
    let setStep;
    function App() { const [step, set] = useState(0); setStep = set; return <Started options={{ lazy: false, motion: 'none' }}><Notes step={step} /></Started>; }
    mount(<App />);
    await wait(400);
    flushSync(() => setStep(1));
    await wait(400);
    return {
      heading: text(q('h1 .pt-sr')), letters: document.querySelectorAll('h1 .pt-c').length,
      label: q('a.pt-btn > .pt-btn__label').textContent, smear: q('a.pt-btn > .pt-btn__smear').textContent,
      hoverInk: !!q('.pt-btn--outline > .pt-hover-ink path'), btnUnderline: !!q('a.pt-btn > .pt-hover-ink path')?.getAttribute('d'), markInk: q('.pt-mark > .pt-mark__ink').textContent,
      annoPaths: document.querySelectorAll('.pt-anno > .pt-anno__ink path').length,
      checks: [...document.querySelectorAll('.pt-check')].map(l => text(l.querySelector('.pt-check__text')) + (l.querySelector('svg') ? '+box' : ''))
    };
  },
  // date stamps and picture stamps with the plain script
  async datestamp() {
    q('#root').innerHTML = `<main class="pt-sheet" lang="en-GB">
      <div id="week" class="pt-datestamp" data-unit="week" data-date="2026-10-21" data-past="x" data-rows="2" data-title=""></div>
      <div id="month" class="pt-datestamp" data-unit="month" data-date="2026-10-21" data-past="x"></div>
      <div id="monthJa" class="pt-datestamp" data-unit="month" data-date="2026-10-21" data-locale="ja-JP" data-mark="highlight" data-past="strike"></div>
      <div id="year" class="pt-datestamp" data-unit="year" data-date="2026-10-21" data-past="x"></div>
      <div id="bar" class="pt-datestamp" data-unit="week" data-variant="bar" data-date="2026-10-21" data-past="x"></div>
      <div id="days" class="pt-datestamp" data-unit="day" data-date="2026-02-10" data-mark="box"></div>
      <div id="wide" class="pt-datestamp" data-unit="month" data-variant="wide" data-date="2026-10-21" data-past="x" data-rows="2"></div>
      <div id="habits" class="pt-datestamp" data-unit="month" data-variant="wide" data-rows="Run, Read" data-date="2026-10-21">
        <span data-day="3" data-row="1" class="pt-stamp" data-pic="tick" data-ink="green" id="tick3"></span>
        <span data-day="5" data-row="2" id="five">5k</span>
        <span data-date="2026-10-10" id="star">★</span>
      </div>
      <div id="weekLabels" class="pt-datestamp" data-unit="week" data-rows="Run, Read" data-date="2026-10-21"><b data-day="20" data-row="2" id="wk">✓</b></div></main>`;
    PT.init({ seed: 3, motion: 'none', lazy: false });
    await until(() => q('#week .pt-datestamp__marks .pt-anno__ink path'));
    // the printed layer has the labels; the marks layer on top has the same cells with the pencil marks
    const part = (id, name, layer = 'print') => [...document.querySelectorAll(`#${id} .pt-datestamp__${layer} [data-part="${name}"] .pt-datestamp__cell`)];
    const labels = (id, name) => part(id, name).map(c => c.textContent || '·').join(' ');
    const marks = (id, name) => part(id, name, 'marks').map(c => c.dataset.anno || c.querySelector('.pt-anno')?.dataset.anno || (c.querySelector('.pt-mark') ? 'hl' : '-')).join(' ');
    const box = el => { const r = el.getBoundingClientRect(); return [r.width, r.height].map(Math.round).join('x'); };
    return {
      layersAlign: [...document.querySelectorAll('.pt-datestamp')].every(d => box(d.querySelector('.pt-datestamp__print')) === box(d.querySelector('.pt-datestamp__marks'))),
      weekParts: [...document.querySelectorAll('#week .pt-datestamp__print > .pt-datestamp__section')].map(s => s.dataset.part + ':' + s.children.length).join(' '),
      weekHead: labels('week', 'head'), weekHeadMarks: marks('week', 'head'), weekWriteMarks: marks('week', 'write'),
      weekLabel: q('#week').getAttribute('aria-label'), circleDrawn: q('#week .pt-datestamp__marks [data-part="head"] .pt-anno__ink path') != null,
      monthLabel: q('#month').getAttribute('aria-label'), wideLabel: q('#wide').getAttribute('aria-label'),
      yearLabel: q('#year').getAttribute('aria-label'), barLabel: q('#bar').getAttribute('aria-label'),
      monthSelector: labels('month', 'months'), monthSelectorMarks: marks('month', 'months'),
      monthHead: labels('month', 'head'), monthDays: labels('month', 'days'), monthDayMarks: marks('month', 'days'),
      jaHead: labels('monthJa', 'head'), jaSelectorMarks: marks('monthJa', 'months'), jaLang: q('#monthJa').lang,
      year: labels('year', 'title') + ' | ' + labels('year', 'year'), yearMarks: marks('year', 'year'),
      bar: labels('bar', 'bar'), barMarks: marks('bar', 'bar'),
      wideHead: labels('wide', 'head'), wideDays: labels('wide', 'days'), wideDayMarks: marks('wide', 'days'),
      wideWrite: part('wide', 'write').length, wideSides: document.querySelectorAll('#wide .pt-datestamp__print [data-side]').length,
      wideFits: q('#wide').getBoundingClientRect().width <= q('#wide').parentElement.clientWidth,
      habitLabels: labels('habits', 'write').split(' ').filter(l => l !== '·').join(' '),
      // where each piece of content landed: its row in its part, and its column (the label column is 0)
      placed: ['tick3', 'five', 'star', 'wk'].map(id => { const cell = q('#' + id).closest('.pt-datestamp__cell'), row = cell.parentElement;
        return `${id}:${row.parentElement.dataset.part}${[...row.parentElement.children].indexOf(row) + 1}@${[...row.children].indexOf(cell)}`; }).join(' '),
      inMarks: !!q('#tick3').closest('.pt-datestamp__marks'),
      weekWider: q('#weekLabels').offsetWidth > q('#week').offsetWidth,
      refilled: (() => { q('#habits').dataset.date = '2026-10-22'; PT.dateStamp(q('#habits')); const c = q('#tick3') && q('#tick3').closest('.pt-datestamp__cell');
        return !!c && [...c.parentElement.children].indexOf(c) === 3; })(),
      days: part('days', 'bar').length, dayMarked: part('days', 'bar', 'marks').findIndex(c => c.querySelector('.pt-anno')?.dataset.anno === 'box') + 1
    };
  },
  // things that wrap: to-dos, marks on text; and a sticky note in a row that stretches its items
  async wrapping() {
    q('#root').innerHTML = `<main class="pt-sheet" style="--pt-sheet-width: 420px">
      <ul class="pt-todo"><li><label class="pt-check"><input type="checkbox" checked> Write the announcement for the launch and send it to the whole team</label></li>
        <li><label class="pt-check"><input type="checkbox"> Short task</label></li></ul>
      <p>Here <span id="strike" class="pt-anno" data-anno="strike" data-wrap>a phrase struck through across more than one line of this column</span> ok.</p>
      <p>A <span id="circle" class="pt-anno" data-anno="circle" data-wrap>big task that wraps onto two lines in the column</span></p>
      <div style="display: flex"><div class="pt-sticky" id="sticky"><div class="pt-sticky__paper"><p>Note</p></div></div><div style="height: 400px; width: 40px"></div></div>
    </main>`;
    PT.init({ seed: 3, motion: 'none', lazy: false });
    await until(() => q('#strike .pt-anno__ink path') && q('#circle .pt-anno__ink path'));
    await wait(100);
    // lines of text, not counting the svg a mark is drawn in
    const grid = 24, rows = el => { const r = document.createRange(); r.selectNodeContents(el); const svg = el.querySelector(':scope > svg'); if (svg) r.setEndBefore(svg); return new Set([...r.getClientRects()].filter(x => x.width).map(x => Math.round(x.top))).size; };
    const ink = q('.pt-check__ink'), lis = [...document.querySelectorAll('.pt-todo li')];
    return {
      liHeights: lis.map(l => l.getBoundingClientRect().height / grid), taskLines: rows(ink),
      strikeClone: getComputedStyle(ink).boxDecorationBreak || getComputedStyle(ink).webkitBoxDecorationBreak,
      strikeLines: rows(q('#strike')), strikeStrokes: (q('#strike .pt-anno__ink path').getAttribute('d').match(/M/g) || []).length,
      circleShapes: (q('#circle .pt-anno__ink path').getAttribute('d').match(/M/g) || []).length,
      sticky: Math.round(q('#sticky').getBoundingClientRect().height) === Math.round(q('#sticky .pt-sticky__paper').getBoundingClientRect().height)
    };
  },
  // lists that keep their own rhythm snap as one block; white paper is white; page margins never vanish
  async snapping() {
    q('#root').innerHTML = `<main class="pt-sheet" id="sheet" style="--pt-sheet-pad: 37px">
      <p>A paragraph to push things off the grid a little.</p>
      <ul class="pt-todo" id="todo"><li><label class="pt-check"><input type="checkbox"> One</label></li><li><label class="pt-check"><input type="checkbox"> Two</label></li></ul>
      <ul id="ruled" data-pt-ruled style="list-style: none; padding: 0"><li style="height: 24px; border-bottom: 1px solid #999">Row one</li><li style="height: 24px; border-bottom: 1px solid #999">Row two</li></ul>
    </main><main class="pt-sheet" id="cream" data-paper="cream"></main>`;
    PT.init({ seed: 3, motion: 'none', lazy: false });
    await until(() => q('#todo').style.translate !== '' || q('#ruled').style.translate !== '');
    await wait(200);
    const grid = 24, top = q('#sheet').getBoundingClientRect().top + q('#sheet').clientTop;
    // the first line of a block sits on a dot row: probe its baseline the way the script does
    const baseline = el => { const p = document.createElement('span'); p.style.cssText = 'display:inline-block;width:0;height:0'; el.prepend(p); const y = p.getBoundingClientRect().top - top; p.remove(); return y; };
    return {
      itemsMoved: [...document.querySelectorAll('#todo li, #ruled li')].filter(li => li.style.translate).length,
      todoOnGrid: Math.abs(baseline(q('#todo .pt-check__ink')) % grid) < 1 || Math.abs(baseline(q('#todo .pt-check__ink')) % grid - grid) < 1,
      ruledOnGrid: Math.abs(baseline(q('#ruled li')) % grid) < 1 || Math.abs(baseline(q('#ruled li')) % grid - grid) < 1,
      white: getComputedStyle(q('#sheet')).backgroundColor, cream: getComputedStyle(q('#cream')).backgroundColor
    };
  },
  async page() {
    document.body.className = '';
    q('#root').innerHTML = `<main class="pt-sheet pt-sheet--page" id="page" style="--pt-sheet-pad: 16px"><p>On a phone</p></main>`;
    await wait(50);
    return { padding: getComputedStyle(q('#page')).paddingLeft };
  },
  // hydrate the server-rendered planner, then click a habit
  // a day heading and a week, filled from their attributes: a date, the page's language, a label, a mark
  async plannerAttrs() {
    const days = Array.from({ length: 7 }, () => '<div class="pt-week__day"><div class="pt-week__head"><span class="pt-week__date" style="color: rgb(1, 2, 3)"></span></div></div>').join('');
    q('#root').innerHTML = `<main class="pt-sheet" lang="fr">
      <div class="pt-dayhead" id="dh" data-date="2026-10-21" data-week-label="Semaine {n}"><span class="pt-dayhead__num"></span><span class="pt-dayhead__month"></span><span class="pt-dayhead__weekday"></span><span class="pt-dayhead__weekno"></span></div>
      <div class="pt-week" id="wk" data-date="2026-10-21" data-mark="box">${days}</div></main>`;
    PT.init({ seed: 3, motion: 'none', lazy: false });
    await until(() => q('#wk [aria-current="date"] .pt-anno__ink path'));
    const today = () => q('#wk [aria-current="date"] .pt-week__date');
    const first = { date: today().textContent, anno: today().dataset.anno, kept: today().style.color, marked: document.querySelectorAll('#wk .pt-week__date.pt-anno').length };
    PT.week(q('#wk'), new Date(2026, 9, 23));
    return {
      head: ['num', 'month', 'weekday', 'weekno'].map(k => q('#dh .pt-dayhead__' + k).textContent).join(' | '),
      dates: [...document.querySelectorAll('#wk .pt-week__date')].map(d => d.textContent.trim()).join(' '),
      first, moved: today().textContent.trim(), stillMarked: document.querySelectorAll('#wk .pt-week__date.pt-anno').length,
      current: document.querySelectorAll('#wk [aria-current]').length
    };
  },
  async datestampCell() {
    mount(<Started options={{ lazy: false, motion: 'none' }}><main className="pt-sheet">
      <DateStamp unit="week" date={new Date(2026, 9, 21)} rows={['Run', 'Read']}
        cell={({ row, date }) => row === 1 && date.getDate() === 21 ? <span id="rx">✓</span> : null} />
    </main></Started>);
    await until(() => q('#rx'));
    const cell = q('#rx').closest('.pt-datestamp__cell'), row = cell.parentElement;
    return {
      part: row.parentElement.dataset.part, column: [...row.children].indexOf(cell),
      labels: [...document.querySelectorAll('.pt-datestamp__print [data-part="write"] [data-side]')].map(c => c.textContent).join(' '),
      inMarks: !!cell.closest('.pt-datestamp__marks'), fills: document.querySelectorAll('.pt-datestamp__fill').length
    };
  },
  async hydrate() {
    let toggled = null;
    hydrateRoot(q('#root'), <HydrateApp onToggle={(i, d, c) => { toggled = [i, d, c]; }} />);
    await wait(800);
    q('#h input[aria-label="Run, T"]').click();
    await wait(100);
    return {
      gb: text(q('#gb')), fr: text(q('#fr')),
      gbDays: [...document.querySelectorAll('#w-gb .pt-week__day')].map(d => d.dataset.day).join(''),
      usDays: [...document.querySelectorAll('#w-us .pt-week__day')].map(d => d.dataset.day).join(''),
      todayCircled: !!q('#w-gb [aria-current="date"] .pt-anno__ink path'), todayContent: text(q('#w-gb [aria-current="date"] p')),
      sundayHead: getComputedStyle(q('#w-us .pt-week__day[data-day="0"] .pt-week__head')).color,
      toggled, cellPlace: q('#h .pt-habit').getAttribute('style'),
      weekBox: q('#w-box [aria-current="date"] .pt-week__date')?.dataset.anno, ownCell: text(q('#hc .pt-habits__own')), ownCellBoxes: document.querySelectorAll('#hc .pt-habit').length,
      dateStamp: [...document.querySelectorAll('#ds .pt-datestamp__marks .pt-datestamp__cell')].map(c => c.dataset.anno || c.querySelector('.pt-anno')?.dataset.anno || '-').join(' '), dateStampInk: q('#ds').dataset.ink
    };
  }
};

(async () => {
  const name = new URLSearchParams(location.search).get('s');
  let result;
  if (!scenarios[name]) return;
  try { result = await scenarios[name](); } catch (e) { result = { fatal: String(e && e.stack || e) }; }
  document.body.setAttribute('data-result', JSON.stringify({ ...result, errors }));
})();
