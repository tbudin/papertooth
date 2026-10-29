// Draws shapes at each element's real size, only when the element is near the screen,
// and only again when its size or style changes. Reads and writes are batched per frame.
import { enc, svgDoc, rng, seedOf, cssVar, f, hoverOf } from './core.js';
import { HIGHLIGHT, POOL_Y, HEAVY_START, secondPass, gradient, OUTLINE, RULE, ANNO, SWATCH, LINK, STRIKE, WAVE_W, waveD, progressSVG } from './shapes.js';
import { toolOf, toolKey, toolDefs, inkPath, passes } from './tools.js';

// set by the scheduler, so a painter can ask to be called again (for example when an image loads)
let repaint = () => {};

/* Diagrams and the image effects are a third of the script, so they are fetched the first time a page has one.
   Until then the element is measured as pending, and painted again once the code is in. */
const onDemand = load => {
  let mod = null, loading = null;
  return el => {
    if (mod) return mod;
    loading = loading || load().then(m => { mod = m; });
    loading.then(() => repaint(el, true));
    return null;
  };
};
const imagesFor = onDemand(() => import('./images.js'));
const diagramFor = onDemand(() => import('./diagram.js'));

// marks that follow the text line by line when the phrase wraps; the others go around the whole phrase
const LINE_MARKS = new Set(['strike', 'under', 'cross']);
const shiftPath = (d, dx, dy) => d.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, x, y) => `${f(+x + dx)} ${f(+y + dy)}`);

const SVGNS = 'http://www.w3.org/2000/svg';

/* ---------- what can be painted ---------- */
export const PAINTERS = [
  {
    // highlighter passes behind a button, plus the hover smear position
    sel: '.pt-btn',
    measure: (el, o) => {
      const label = el.querySelector('.pt-btn__label');
      return {
        w: el.offsetWidth + 11, h: el.offsetHeight - 10,
        style: HIGHLIGHT[el.dataset.hl] ? el.dataset.hl : o.highlight,
        lx: label ? label.offsetLeft : 0, ly: label ? label.offsetTop : 0,
        // the box of the pass drawn on hover (the second pass, or the only pass on an outlined button)
        pass: (() => { const ps = getComputedStyle(el, el.classList.contains('pt-btn--outline') ? '::before' : '::after'); return [parseFloat(ps.left) || 0, parseFloat(ps.width) || 0]; })()
      };
    },
    key: m => `${m.style}|${m.w}|${m.h}`,
    draw: (el, m) => {
      if (m.w < 12 || m.h < 12) return;
      const r = rng(seedOf(el)), heavy = HEAVY_START.has(m.style);
      el.style.setProperty('--pt-mask-a', enc(svgDoc(m.w, m.h, gradient(m.w, '#000', heavy) + HIGHLIGHT[m.style](m.w, m.h, r).join(''))));
      el.style.setProperty('--pt-mask-b', enc(svgDoc(m.w, m.h, gradient(m.w, '#000', heavy) + secondPass(m.style, m.w, m.h, r).join(''))));
      el.style.setProperty('--pt-pool-y', POOL_Y[m.style] || '50%');
      el.style.setProperty('--pt-pool-x', heavy ? '8px' : 'calc(100% - 8px)');
    },
    always: (el, m) => {
      const sm = el.querySelector('.pt-btn__smear');
      if (sm) {
        const [pl, pw] = m.pass;
        sm.style.left = pl + 'px'; sm.style.top = m.ly + 'px';
        sm.style.width = pw + 'px'; sm.style.paddingLeft = (m.lx - pl) + 'px';
      }
    }
  },
  {
    sel: '.pt-btn--outline',
    measure: (el, o) => ({
      w: el.offsetWidth, h: el.offsetHeight,
      style: OUTLINE[el.dataset.outline] ? el.dataset.outline : o.outline,
      t: toolOf(el)
    }),
    key: m => `${m.style}|${m.w}|${m.h}|${toolKey(m.t)}`,
    draw: (el, m) => {
      if (m.w < 12) return;
      el.style.setProperty('--pt-ol', enc(svgDoc(m.w, m.h, `<defs>${toolDefs(m.t)}</defs>` + OUTLINE[m.style](m.w, m.h, rng(seedOf(el) + 7), m.t))));
      el.style.setProperty('--pt-ol-size', '100% 100%');
      el.style.setProperty('--pt-ol-pos', '0 0');
    }
  },
  {
    // tape is torn off the roll by hand: each piece gets its own ragged ends
    sel: '.pt-tape',
    measure: el => ({ w: el.offsetWidth, h: el.offsetHeight }),
    key: m => `${m.w}|${m.h}`,
    draw: (el, m) => {
      if (m.w < 8 || m.h < 6) return;
      const r = rng(seedOf(el)), w = m.w, h = m.h, end = (x0, dir) => {
        const pts = [], slant = (r() - .5) * 3;
        for (let y = 0; y <= h; y += 1 + r() * 1.6) pts.push([x0 + dir * (2.5 + (r() - .5) * 1.8 + slant * (y / h - .5) + (r() < .12 ? r() * 1.2 : 0)), Math.min(y, h)]);
        if (pts[pts.length - 1][1] < h) pts.push([x0 + dir * (2 + r()), h]);
        return pts;
      };
      // clockwise: top edge, right end going down, bottom edge, left end going up
      const left = end(0, 1), right = end(w, -1);
      const edge = (y, x0, x1) => { const out = []; for (let x = x0 + 18; x < x1 - 9; x += 18) out.push([x, y + (r() - .5) * .5]); return out; };
      const pts = [...edge(0, left[0][0], right[0][0]), ...right, ...edge(h, left[left.length - 1][0], right[right.length - 1][0]).reverse(), ...left.reverse()];
      const d = 'M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join(' L') + 'Z';
      el.style.setProperty('--pt-tape-mask', enc(svgDoc(w, h, `<path d="${d}" fill="#000"/>`)));
    }
  },
  {
    // how a done item is crossed out: data-strike="none|line|double|scribble|under" on the item or the list,
    // and for "under" any link underline in data-ul
    sel: '.pt-check__text',
    measure: el => {
      const host = el.closest('.pt-check') || el, sk = el.closest('[data-strike]'), ul = el.closest('[data-ul]');
      return { strike: sk ? sk.dataset.strike : 'line', ul: ul ? ul.dataset.ul : 'wobble', t: toolOf(host) };
    },
    key: m => `${m.strike}|${m.ul}|${toolKey(m.t)}`,
    draw: (el, m) => {
      if (m.strike === 'none') { el.style.setProperty('--pt-strike', 'none'); return; }
      const r = rng(seedOf(el)), under = m.strike === 'under';
      const d = under ? (m.ul === 'wave' ? waveD(r) : (LINK[m.ul] || LINK.wobble)(r)) : (STRIKE[m.strike] || STRIKE.line)(r);
      const vb = under && m.ul === 'wave' ? `0 0 ${WAVE_W} 9` : '0 0 200 12';
      el.style.setProperty('--pt-strike', enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="none"><defs>${toolDefs(m.t)}</defs>${inkPath(d, m.t, { nonScaling: true, scale: under && m.ul === 'marker' ? 2 : 1 })}</svg>`));
      el.style.setProperty('--pt-strike-y', under ? '100%' : '55%');
      el.style.setProperty('--pt-strike-h', m.strike === 'scribble' ? '17px' : '10px');
    }
  },
  {
    sel: '.pt-btn:not(.pt-btn--outline, [data-hover]), .pt-btn[data-hover="circle"], .pt-btn[data-hover="underline"], .pt-link[data-hover="circle"], .pt-link[data-hover="underline"]',
    measure: el => {
      const svg = el.querySelector(':scope > .pt-hover-ink'), label = el.querySelector(':scope > .pt-btn__label') || el;
      const b = label.getBoundingClientRect(), o = el.getBoundingClientRect();
      return { svg, kind: hoverOf(el), w: Math.round(b.width), h: Math.round(b.height), x: Math.round(b.left - o.left), y: Math.round(b.top - o.top) };
    },
    key: m => `${m.kind}|${m.w}|${m.h}|${m.x}|${m.y}`,
    draw: (el, m) => {
      if (!m.svg || m.w < 4) return;
      const r = rng(seedOf(el) + 5), circle = m.kind === 'circle';
      const pw = circle ? 14 : 3, ph = circle ? 12 : 0, w = m.w + pw * 2, h = circle ? m.h + ph * 2 : 10;
      Object.assign(m.svg.style, { left: (m.x - pw) + 'px', top: (circle ? m.y - ph : m.y + m.h - 2) + 'px', width: w + 'px', height: h + 'px' });
      m.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      m.svg.firstChild.setAttribute('d', circle ? ANNO.circle(w, h, r) : `M2 ${f(4 + r() * 2)} C ${f(w * .3)} ${f(3 + r() * 2)}, ${f(w * .7)} ${f(6 + r() * 2)}, ${f(w - 2)} ${f(4 + r() * 2)}`);
    }
  },
  {
    sel: '.pt-rule',
    measure: el => ({ w: el.clientWidth, h: el.clientHeight, style: RULE[el.dataset.rule] ? el.dataset.rule : el.dataset.rule ? '' : 'wobble', t: toolOf(el) }),
    key: m => `${m.style}|${m.w}|${m.h}|${toolKey(m.t)}`,
    draw: (el, m) => {
      if (!m.style || m.w < 10) { el.style.removeProperty('--pt-gen'); return; }
      el.style.setProperty('--pt-gen', enc(svgDoc(m.w, m.h, `<defs>${toolDefs(m.t)}</defs>` + RULE[m.style](m.w, m.h, rng(seedOf(el)), m.t))));
      el.dataset.ptPainted = '';
    }
  },
  {
    // the underline is drawn on a 200 × 12 box that stretches to each line of the link
    sel: '.pt-link',
    measure: el => ({ style: el.dataset.ul || 'wobble', t: toolOf(el) }),
    key: m => `${m.style}|${toolKey(m.t)}`,
    draw: (el, m) => {
      if (m.style === 'hl') return;
      const r = rng(seedOf(el)), defs = `<defs>${toolDefs(m.t)}</defs>`;
      const box = inner => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 12" preserveAspectRatio="none">${defs}${inner}</svg>`;
      if (m.style === 'wave') {
        el.style.setProperty('--pt-u', enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${WAVE_W}" height="9" viewBox="0 0 ${WAVE_W} 9">${defs}${inkPath(waveD(r), m.t, { scale: .8 })}</svg>`));
        el.style.setProperty('--pt-u-size', `${WAVE_W}px 9px`);
      } else {
        const shape = LINK[m.style] || LINK.wobble;
        el.style.setProperty('--pt-u', enc(box(inkPath(shape(r), m.t, { nonScaling: true, scale: m.style === 'marker' ? 2 : 1 }))));
      }
      el.style.setProperty('--pt-u-second', enc(box(inkPath(LINK.second(r), m.t, { nonScaling: true, op: .8, scale: .8 }))));
    }
  },
  {
    sel: '.pt-progress',
    measure: el => {
      const raw = cssVar(el, '--pt-value'), now = el.getAttribute('aria-valuenow'), max = parseFloat(el.getAttribute('aria-valuemax')) || 100;
      const v = raw !== '' && Number.isFinite(parseFloat(raw)) ? parseFloat(raw) : now != null ? parseFloat(now) / max : 0;
      // data-shape is the form (bar, boxes, circles, ring, tally, sei), data-style the fill. Older markup put shapes in data-style.
      const LEGACY = { segments: 'boxes', dots: 'circles', ring: 'ring', tally: 'tally', sei: 'sei' };
      const st = el.dataset.style || 'highlight', shape = el.dataset.shape || LEGACY[st] || 'bar';
      return { w: el.clientWidth, h: el.clientHeight, v, shape, style: LEGACY[st] ? 'highlight' : st, t: toolOf(el), hl: cssVar(el, '--pt-hl') || '#fff04a',
        segments: parseInt(el.dataset.segments, 10) || 10, max: parseInt(el.dataset.max, 10) || 20 };
    },
    key: m => `${m.shape}|${m.style}|${m.w}|${m.h}|${m.v}|${m.hl}|${m.segments}|${m.max}|${toolKey(m.t)}`,
    draw: (el, m) => {
      if (m.shape === 'tally' || m.shape === 'sei') el.style.setProperty('--pt-groups', Math.ceil(m.max / 5));
      if (m.w < 8 || m.h < 8) return;
      el.dataset.ptPainted = '';
      el.style.setProperty('--pt-progress-img', enc(svgDoc(m.w, m.h, `<defs>${toolDefs(m.t)}</defs>` + progressSVG(m.shape, m.style, m.w, m.h, rng(seedOf(el)), m.t, m.v, m))));
    }
  },
  {
    sel: '.pt-anno',
    measure: el => {
      const svg = el.querySelector(':scope > .pt-anno__ink');
      const b = svg ? svg.getBoundingClientRect() : { width: 0, height: 0 };
      const m = { w: Math.round(b.width * 2) / 2, h: Math.round(b.height * 2) / 2, style: el.dataset.anno, svg, t: toolOf(el), lines: null };
      // a phrase allowed to wrap (data-wrap) gets a strike, underline or scribble on each of its lines
      if (svg && el.hasAttribute('data-wrap') && LINE_MARKS.has(m.style)) {
        const range = document.createRange();
        range.setStart(el, 0); range.setEndBefore(svg);
        const rows = [];
        for (const r of range.getClientRects()) {
          if (!r.width) continue;
          const row = rows.find(q => Math.abs(q.top - r.top) < r.height / 2);
          if (row) { row.left = Math.min(row.left, r.left); row.right = Math.max(row.right, r.right); row.bottom = Math.max(row.bottom, r.bottom); }
          else rows.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
        }
        const half = v => Math.round(v * 2) / 2;
        if (rows.length > 1) m.lines = rows.map(q => [half(q.left - b.left), half(q.top - b.top), half(q.right - q.left), half(q.bottom - q.top)]);
        m.ox = parseFloat(cssVar(el, '--pt-ox')) || 0; m.oy = parseFloat(cssVar(el, '--pt-oy')) || 0;
      }
      return m;
    },
    key: m => `${m.style}|${m.w}|${m.h}|${m.t.kind}|${m.t.w}|${m.lines ? m.lines.join(';') : ''}`,
    draw: (el, m) => {
      if (!m.svg || !ANNO[m.style] || m.w < 2) return;
      m.svg.setAttribute('viewBox', `0 0 ${m.w} ${m.h}`);
      const r = rng(seedOf(el));
      // the svg overflows, so the strokes for the other lines are drawn outside its box, where those lines are
      const d = m.lines
        ? m.lines.map(([x, y, w, h]) => m.style === 'under'
          ? shiftPath(ANNO.under(w + 4, 11, r), x - 2, y + h - 4)
          : shiftPath(ANNO[m.style](w + 2 * m.ox, h + 2 * m.oy, r), x - m.ox, y - m.oy)).join(' ')
        : ANNO[m.style](m.w, m.h, r);
      // one path per pass of the instrument; colour and weight stay in CSS so the draw-on animation still works
      const ps = m.style === 'hatch' ? [[0, 0, 1, 1]] : passes(m.t);
      while (m.svg.childNodes.length > ps.length) m.svg.lastChild.remove();
      while (m.svg.childNodes.length < ps.length) m.svg.appendChild(svgEl('path', { pathLength: '1' }));
      ps.forEach(([dx, dy, k, o], i) => {
        const p = m.svg.childNodes[i];
        p.setAttribute('d', d);
        p.setAttribute('style', `--pt-k:${k};--pt-o:${o}`);
        if (dx || dy) p.setAttribute('transform', `translate(${f(dx)} ${f(dy)})`); else p.removeAttribute('transform');
      });
    }
  },
  {
    sel: '.pt-mark',
    measure: (el, o) => ({ style: HIGHLIGHT[el.dataset.hl] ? el.dataset.hl : o.highlight, c: cssVar(el, '--pt-hl') || '#fff04a' }),
    key: m => `${m.style}|${m.c}`,
    draw: (el, m) => {
      const w = 200, h = 40, heavy = HEAVY_START.has(m.style), pool = m.style === 'dry' || m.style === 'scribble' ? '' :
        `<ellipse cx="${heavy ? 9 : w - 9}" cy="${h * .55}" rx="7" ry="${h * .32}" fill="#000" fill-opacity=".09"/>`;
      el.style.setProperty('--pt-mark', enc(svgDoc(w, h, gradient(w, m.c, heavy) + HIGHLIGHT[m.style](w, h, rng(seedOf(el))).join('') + pool)));
    }
  },
  {
    sel: '.pt-swatch',
    measure: el => {
      const box = el.querySelector('.pt-swatch__ink');
      return { box, w: box ? box.clientWidth : 0, h: box ? box.clientHeight : 0, tool: SWATCH[el.dataset.tool] ? el.dataset.tool : 'fountain', c: cssVar(el, '--pt-swatch') || '#213c6b' };
    },
    key: m => `${m.tool}|${m.w}|${m.h}|${m.c}`,
    draw: (el, m) => {
      if (!m.box || m.w < 20) return;
      m.box.style.backgroundImage = enc(svgDoc(m.w, m.h, SWATCH[m.tool](m.w, m.h, rng(seedOf(el)), m.c)));
    }
  }
];
PAINTERS.push(
  {
    sel: '.pt-litho',
    measure: el => { const I = imagesFor(el); return I ? { I, p: I.lithoParams(el) } : { pending: true }; },
    key: m => m.pending ? 'pending' : JSON.stringify(m.p),
    draw: (el, m) => { if (!m.pending) el.style.filter = `url(#${m.I.lithoFilterId(m.p)})`; }
  },
  {
    // the print replaces the picture's pixels; the original is kept in data-pt-src for reprints
    sel: 'img.pt-print',
    measure: el => {
      const I = imagesFor(el);
      if (!I) return { pending: true };
      if (!el.dataset.ptSrc) {
        if (!el.currentSrc && !el.getAttribute('src')) return { src: '' };
        el.dataset.ptSrc = el.currentSrc || el.src;
      }
      // a picture shown at its own size keeps that size once it is replaced by the smaller print
      if (!el.dataset.ptW && el.complete && el.naturalWidth && el.dataset.ptPrinted == null) {
        const w = el.getBoundingClientRect().width;
        el.dataset.ptW = Math.abs(w - el.naturalWidth) < 1 && !el.style.width && !el.getAttribute('width') ? String(Math.round(w)) : 'css';
      }
      const rec = I.sourceImage(el.dataset.ptSrc, () => repaint(el, true));
      return { I, src: el.dataset.ptSrc, rec, ready: rec.ready, failed: rec.failed, p: I.printParams(el) };
    },
    key: m => m.pending ? 'pending' : `${m.ready}|${m.failed}|${m.src}|${JSON.stringify(m.p)}`,
    draw: (el, m) => {
      if (m.pending) return;
      if (m.failed) el.dataset.ptBlocked = ''; else delete el.dataset.ptBlocked;
      if (!m.src || !m.ready) return;
      if (el.dataset.ptW && el.dataset.ptW !== 'css' && !el.style.width) el.style.width = el.dataset.ptW + 'px';
      m.I.renderPrint(el, m.rec.img, m.p);
    }
  },
  {
    sel: '.pt-diagram',
    measure: el => {
      const D = diagramFor(el);
      if (!D) return { pending: true };
      if (el.dataset.ptSrc == null) el.dataset.ptSrc = el.textContent.trim();
      const cs = getComputedStyle(el);
      return { D, src: el.dataset.ptSrc, w: Math.round(el.clientWidth), font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, lh: parseFloat(cs.lineHeight) || 24, fill: el.dataset.fill || 'none' };
    },
    key: m => m.pending ? 'pending' : `${m.w}|${m.font}|${m.fill}|${m.src}`,
    draw: (el, m) => {
      if (m.pending || !m.D.kindOf(m.src)) return;
      el.innerHTML = m.D.renderDiagram(m.src, { seed: seedOf(el), font: m.font, lineHeight: m.lh, fill: m.fill, width: m.w });
      el.dataset.ptPainted = '';
    }
  }
);
export const PAINT_SELECTOR = PAINTERS.map(p => p.sel).join(',');

/* ---------- scheduler ---------- */
export function createScheduler(opts) {
  const queue = new Set();
  const last = new WeakMap();          // element → { [painterIndex]: key }
  let frame = 0;

  function flush() {
    frame = 0;
    const jobs = [];
    // read everything first…
    for (const el of queue) {
      if (!el.isConnected) continue;
      PAINTERS.forEach((p, i) => { if (el.matches(p.sel)) jobs.push([el, p, i, p.measure(el, opts)]); });
    }
    queue.clear();
    // …then write, skipping anything whose size and style have not changed
    for (const [el, p, i, m] of jobs) {
      const k = p.key(m), seen = last.get(el) || {};
      if (seen[i] !== k) { p.draw(el, m); seen[i] = k; last.set(el, seen); }
      if (p.always) p.always(el, m);
    }
  }
  const request = el => { queue.add(el); if (!frame) frame = requestAnimationFrame(flush); };
  repaint = (el, fresh) => { if (fresh) last.delete(el); request(el); };
  const forget = el => last.delete(el);
  const now = () => { if (frame) cancelAnimationFrame(frame); flush(); };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; queue.clear(); };
  return { request, forget, now, stop };
}

/* ---------- observers: paint near the viewport, repaint on resize ---------- */
export function createWatchers(scheduler, opts) {
  const ro = 'ResizeObserver' in window ? new ResizeObserver(entries => { for (const e of entries) scheduler.request(e.target); }) : null;
  const io = opts.lazy && 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); start(e.target); }
  }, { rootMargin: opts.lazyMargin }) : null;
  const started = new WeakSet();
  function start(el) { started.add(el); scheduler.request(el); if (ro) ro.observe(el); }
  return {
    watch(el) { if (io) io.observe(el); else start(el); },
    isStarted: el => started.has(el),
    unwatch(el) { if (io) io.unobserve(el); if (ro) ro.unobserve(el); },
    disconnect() { if (io) io.disconnect(); if (ro) ro.disconnect(); }
  };
}

export const svgEl = (name, attrs = {}) => {
  const e = document.createElementNS(SVGNS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
};
