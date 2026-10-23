// papertooth: hand-drawn stationery for the web. MIT licence.
// The CSS works on its own. This script adds what CSS cannot do: textures as SVG filters,
// shapes drawn at each element's real size, baseline snapping, letter wobble and draw-on timing.
import { setSeed } from './core.js';
import { injectFilters, filtersMarkup, typewriterFilter, smearColour, DEFAULTS as FILTER_DEFAULTS } from './filters.js';
import { PAINT_SELECTOR, createScheduler, createWatchers } from './painter.js';
import { DECORATORS, wobble } from './decorate.js';
import { snapSheet } from './baseline.js';
import { setPen, setPencil, setRibbon, setHighlighter } from './ink.js';
import { dayHead, week, isoWeek } from './planner.js';

export const VERSION = '0.3.1';

export const DEFAULTS = {
  root: null,              // element to enhance; defaults to document.body
  seed: null,              // a number makes every drawing repeatable
  filters: true,           // inject the SVG filters (false if you paste dist/papertooth-filters.svg yourself)
  filterParams: {},        // see FILTER_DEFAULTS: text, head, graphite, stamp, smudge, smear, typewriter
  snap: true,              // put text on the grid inside .pt-sheet
  lazy: true,              // draw shapes only when they come near the screen
  lazyMargin: '600px',
  motion: 'scroll',        // 'scroll' | 'load' | 'none'
  drawSelector: '[data-pt-draw]',
  drawAll: true,           // draw every mark as it comes into view, not only inside [data-pt-draw] blocks
  drawOnLoad: false,       // also draw on what is already on screen when the page opens (costs more on slow phones)
  drawInserted: true,      // content added later draws on even when it lands on screen; false shows it drawn, like the first screen
  stagger: .12,            // seconds between items drawing on inside one block
  highlight: 'swipe',      // default highlighter style for .pt-btn and .pt-mark
  outline: 'sketch',       // default outline for .pt-btn--outline
  wobbleMax: 400,          // letters split per .pt-wobble element
  observe: true,           // enhance elements added to the page later
  today: true,             // fill .pt-dayhead[data-today] and .pt-week[data-today] with today
  pen: null, pencil: null, ribbon: null, highlighter: null
};

const DECORATE_SELECTOR = DECORATORS.map(d => d[0]).join(',');

export function init(options = {}) {
  const o = { ...DEFAULTS, ...options };
  const root = o.root || document.body;
  const html = document.documentElement;
  if (o.seed != null) setSeed(o.seed);

  const scheduler = createScheduler(o);
  const watchers = createWatchers(scheduler, o);
  const seen = new WeakSet();

  if (o.filters) injectFilters(o.filterParams);
  if (o.pen) setPen(o.pen);
  if (o.pencil) setPencil(o.pencil);
  if (o.ribbon) setRibbon(o.ribbon);
  if (o.highlighter) setHighlighter(o.highlighter);

  // The ink filters would also run over the selection colour and turn it muddy, so text that is
  // being selected drops its filter until the selection goes away.
  const SEL_TEXT = '.pt-sheet :is(p, li, h1, h2, h3, h4, blockquote), .pt-btn__label, .pt-mark__ink';
  let selFrame = 0, selected = [];
  const onSelection = () => {
    if (selFrame) return;
    selFrame = requestAnimationFrame(() => {
      selFrame = 0;
      const sel = document.getSelection(), now = [];
      if (sel && !sel.isCollapsed && sel.rangeCount) {
        const range = sel.getRangeAt(0), base = range.commonAncestorContainer;
        const scope = base.nodeType === 1 ? base : base.parentElement;
        const cands = new Set([...(scope ? scope.querySelectorAll(SEL_TEXT) : [])]);
        for (let n = scope; n && n !== document.body; n = n.parentElement) if (n.matches(SEL_TEXT)) cands.add(n);
        cands.forEach(el => { if (sel.containsNode(el, true)) now.push(el); });
      }
      selected.forEach(el => { if (!now.includes(el)) delete el.dataset.ptSelecting; });
      now.forEach(el => { el.dataset.ptSelecting = ''; });
      selected = now;
    });
  };
  document.addEventListener('selectionchange', onSelection);

  // our own DOM changes (probes, wrappers, letters) must not wake the mutation observer
  let mo = null;
  const quiet = () => { if (mo) mo.takeRecords(); };

  /* ---------- enhance a subtree ---------- */
  function scan(scope) {
    if (scope.nodeType !== 1 || !scope.isConnected) return;
    const has = sel => (scope.matches(sel) ? [scope] : []).concat(Array.from(scope.querySelectorAll(sel)));
    // letters first, so later measurements see the final text
    has('.pt-wobble, .pt-label--emboss').forEach(el => wobble(el, o.wobbleMax));   // embossed letters are punched one by one
    if (o.today) {
      has('.pt-dayhead[data-today]').forEach(el => dayHead(el));
      has('.pt-week[data-today]').forEach(el => week(el));
    }
    for (const [sel, fn] of DECORATORS) has(sel).forEach((el, i) => fn(el, o, i));
    has('.pt-sheet').forEach(watchSheet);
    has(PAINT_SELECTOR).forEach(el => { if (!seen.has(el)) { seen.add(el); watchers.watch(el); } });
    if (o.motion !== 'none') {
      has(o.drawSelector).forEach(b => { if (b.dataset.ptDraw !== 'off') prepareDraw(b); });
      // everything else drawn: the block it sits in (a child of its sheet, or itself) draws when it comes into view
      if (o.drawAll) {
        const blocks = new Set();
        has(DRAWABLE).forEach(el => {
          if (el.closest('[data-pt-draw]')) return;
          const block = el.closest('.pt-sheet > *') || el;
          if (!block.closest('[data-pt-draw="off"]')) blocks.add(block);
        });
        // what is already on screen when the page opens (and, with drawInserted: false, what is added on screen
        // later) is simply there; only what scrolls into view draws on. One layout read for all of them.
        const settleOnScreen = booting ? !o.drawOnLoad : !o.drawInserted;
        const still = settleOnScreen && drawIO
          ? new Set([...blocks].filter(b => { const r = b.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; })) : new Set();
        blocks.forEach(block => {
          if (still.has(block)) { block.setAttribute('data-pt-draw', 'off'); return; }
          block.setAttribute('data-pt-draw', '');
          prepareDraw(block);
        });
      }
    }
    quiet();
  }

  /* ---------- draw-on timing ----------
     State lives in data attributes, not classes: a framework that re-renders an element's className
     (React, Vue) leaves attributes it does not own alone. */
  const DRAWABLE = '.pt-anno, .pt-btn, .pt-rule, .pt-link, .pt-mark, .pt-stamp, .pt-tape, .pt-sticky, .pt-flag, .pt-torn, .pt-ticket, .pt-photo, .pt-postage, .pt-label, .pt-progress, .pt-diagram, .pt-draw-path';
  let drawIO = null;
  if (o.motion !== 'none' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    html.dataset.ptMotion = '';
    if (o.motion === 'scroll' && 'IntersectionObserver' in window) {
      drawIO = new IntersectionObserver(entries => {
        for (const e of entries) if (e.isIntersecting) { e.target.dataset.ptDrawn = ''; drawIO.unobserve(e.target); }
      }, { threshold: .2 });
    }
  }
  // kept per kit, so a kit started after another one was destroyed (a remount) prepares the blocks again
  const prepared = new WeakSet();
  function prepareDraw(block) {
    if (prepared.has(block)) return;
    prepared.add(block);
    const items = block.matches(DRAWABLE) ? [block] : [];
    items.push(...block.querySelectorAll(DRAWABLE));
    items.forEach((it, i) => it.style.setProperty('--pt-delay', Math.min(i * o.stagger, 1.4).toFixed(2) + 's'));
    if (drawIO) drawIO.observe(block); else block.dataset.ptDrawn = '';
  }
  function replay(scope = root) {
    const blocks = (scope.matches && scope.matches(o.drawSelector) ? [scope] : []).concat(Array.from(scope.querySelectorAll(o.drawSelector)))
      .filter(b => b.dataset.ptDraw !== 'off');
    blocks.forEach(b => { delete b.dataset.ptDrawn; });
    void document.body.offsetWidth;
    blocks.forEach(b => {
      const r = b.getBoundingClientRect();
      if (!drawIO || (r.bottom > 0 && r.top < innerHeight)) b.dataset.ptDrawn = ''; else drawIO.observe(b);
    });
  }
  /** Show everything in scope as drawn, without drawing it on: for content swapped in by a route or tab change. */
  function settle(scope = root) {
    scan(scope);   // the observer may not have reached content added a moment ago
    const sel = `${o.drawSelector}, [data-pt-draw]`;
    (scope.matches && scope.matches(sel) ? [scope] : []).concat(Array.from(scope.querySelectorAll(sel))).forEach(b => {
      if (drawIO) drawIO.unobserve(b);
      b.setAttribute('data-pt-draw', 'off');
    });
    quiet();
  }

  /* ---------- baseline snapping ---------- */
  const sheets = () => Array.from((root.matches && root.matches('.pt-sheet') ? [root] : []).concat(Array.from(root.querySelectorAll('.pt-sheet'))));
  let snapFrame = 0;
  function snap() {
    if (!o.snap) return;
    cancelAnimationFrame(snapFrame);
    snapFrame = requestAnimationFrame(() => { sheets().forEach(s => snapSheet(s)); quiet(); });
  }
  const widths = new WeakMap();
  const sheetRO = 'ResizeObserver' in window ? new ResizeObserver(entries => {
    let changed = false;
    for (const e of entries) {
      const w = Math.round(e.contentRect.width);
      if (widths.get(e.target) !== w) { widths.set(e.target, w); changed = true; }
    }
    if (changed) snap();
  }) : null;
  // blocks skipped by content-visibility get snapped when they are first shown
  const onVisibility = e => { if (!e.skipped) snap(); };
  // sheets added after init are watched too, so they resnap when they change width
  const watched = new Set();
  function watchSheet(s) {
    if (watched.has(s)) return;
    watched.add(s);
    if (sheetRO) sheetRO.observe(s);
    s.addEventListener('contentvisibilityautostatechange', onVisibility, true);
  }

  /* ---------- start ---------- */
  let booting = true, destroyed = false;
  scan(root);
  booting = false;
  // web fonts change every measurement, so draw again once they are in
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!destroyed) refresh(); });
  // drawn shapes bake their ink in, and the desk changes inks between day and night
  const scheme = matchMedia('(prefers-color-scheme: dark)');
  const onScheme = () => refresh();
  scheme.addEventListener('change', onScheme);
  snap();

  if (o.observe && 'MutationObserver' in window) {
    let pending = new Set(), queued = false;
    mo = new MutationObserver(list => {
      for (const m of list) m.addedNodes.forEach(n => { if (n.nodeType === 1 && !n.closest('#pt-filters')) pending.add(n); });
      if (pending.size && !queued) {
        queued = true;
        queueMicrotask(() => { queued = false; const nodes = pending; pending = new Set(); nodes.forEach(scan); snap(); });
      }
    });
    mo.observe(root, { childList: true, subtree: true });
  }

  /** Redraw everything near the screen, for example after switching writing mode or pen. */
  function refresh(scope = root) {
    const els = (scope.matches && scope.matches(PAINT_SELECTOR) ? [scope] : []).concat(Array.from(scope.querySelectorAll(PAINT_SELECTOR)));
    els.forEach(el => { scheduler.forget(el); if (watchers.isStarted(el)) scheduler.request(el); });
    snap();
  }
  const after = fn => (...a) => { const v = fn(...a); refresh(); return v; };

  return {
    options: o,
    refresh, replay, settle, snap, scan,
    // shapes drawn into images bake their ink in, so every change of instrument redraws them
    setPen: after(setPen), setPencil: after(setPencil), setRibbon: after(setRibbon), setHighlighter: after(setHighlighter),
    setFilters: params => injectFilters(params),
    setTypewriter: params => injectFilters({ typewriter: params }),
    planner: { dayHead, week, isoWeek },
    destroy() {
      destroyed = true;
      document.removeEventListener('selectionchange', onSelection);
      scheme.removeEventListener('change', onScheme);
      cancelAnimationFrame(selFrame); cancelAnimationFrame(snapFrame); scheduler.stop();
      watchers.disconnect(); if (drawIO) drawIO.disconnect(); if (sheetRO) sheetRO.disconnect(); if (mo) mo.disconnect();
      watched.forEach(s => s.removeEventListener('contentvisibilityautostatechange', onVisibility, true));
      watched.clear();
      selected.forEach(el => { delete el.dataset.ptSelecting; });
      delete html.dataset.ptMotion;
    }
  };
}

export { renderDiagram } from './diagram.js';
export { PALETTE } from './palette.js';
export { lithoFilter } from './filters.js';
export { weekDates, firstDayOf, dayParts, sameDay } from './dates.js';
export { filtersMarkup, typewriterFilter, smearColour, FILTER_DEFAULTS, setPen, setPencil, setRibbon, setHighlighter, dayHead, week, isoWeek };
