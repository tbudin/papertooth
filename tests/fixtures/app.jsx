// Test pages, one per scenario (?s=name). Each runs, then writes what it saw into <body data-result> for the spec.
import { useState, useRef } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import * as PT from 'papertooth';
import { Btn, Wobble, Check } from 'papertooth/react';
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
      hoverInk: !!q('.pt-btn--outline > .pt-hover-ink path'), markInk: q('.pt-mark > .pt-mark__ink').textContent,
      annoPaths: document.querySelectorAll('.pt-anno > .pt-anno__ink path').length,
      checks: [...document.querySelectorAll('.pt-check')].map(l => text(l.querySelector('.pt-check__text')) + (l.querySelector('svg') ? '+box' : ''))
    };
  },
  // hydrate the server-rendered planner, then click a habit
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
      toggled, cellPlace: q('#h .pt-habit').getAttribute('style')
    };
  }
};

(async () => {
  const name = new URLSearchParams(location.search).get('s');
  let result;
  try { result = await scenarios[name](); } catch (e) { result = { fatal: String(e && e.stack || e) }; }
  document.body.setAttribute('data-result', JSON.stringify({ ...result, errors }));
})();
