// One-off markup each component needs: wrappers, inline SVG for things that draw on, letter spans.
import { rng, seedOf, f } from './core.js';
import { spiral, wobblyBox, wobblyRing, TICK, DOT } from './shapes.js';
import { svgEl } from './painter.js';

const UL_MIX = ['wobble', 'slant', 'swash'];

export const DECORATORS = [
  ['.pt-btn', el => {
    if (!el.querySelector(':scope > .pt-btn__label')) {
      const label = document.createElement('span');
      label.className = 'pt-btn__label';
      while (el.firstChild) label.appendChild(el.firstChild);
      el.appendChild(label);
    }
    if (!el.querySelector(':scope > .pt-btn__smear')) {
      const sm = document.createElement('span');
      sm.className = 'pt-btn__smear'; sm.setAttribute('aria-hidden', 'true');
      sm.textContent = el.querySelector('.pt-btn__label').textContent;
      el.appendChild(sm);
    }
  }],
  ['.pt-btn[data-hover], .pt-link[data-hover]', el => {
    // a mark drawn on hover: circled or underlined, in the element's writing instrument
    if (!['circle', 'underline'].includes(el.dataset.hover) || el.querySelector(':scope > .pt-hover-ink')) return;
    const svg = svgEl('svg', { class: 'pt-hover-ink', 'aria-hidden': 'true', focusable: 'false', preserveAspectRatio: 'none' });
    svg.appendChild(svgEl('path', { pathLength: '1' }));
    el.appendChild(svg);
  }],
  ['.pt-mark', el => {
    if (el.querySelector(':scope > .pt-mark__ink')) return;
    const s = document.createElement('span'); s.className = 'pt-mark__ink';
    while (el.firstChild) s.appendChild(el.firstChild);
    el.appendChild(s);
  }],
  ['.pt-anno', el => {
    if (el.querySelector(':scope > .pt-anno__ink')) return;
    const svg = svgEl('svg', { class: 'pt-anno__ink', 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(svgEl('path', { pathLength: '1' }));
    el.appendChild(svg);
  }],
  ['.pt-check, .pt-radio', el => {
    if (el.classList.contains('is-ready')) return;
    const input = el.querySelector('input'); if (!input) return;
    const r = rng(seedOf(el)), radio = el.classList.contains('pt-radio');
    const svg = svgEl('svg', { width: '22', height: '22', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(svgEl('path', { d: radio ? wobblyRing(r) : wobblyBox(r) }));
    svg.appendChild(svgEl('path', { class: 'pt-tick', pathLength: '1', d: radio ? DOT : TICK }));
    input.after(svg);
    // wrap loose text so a ticked item can be struck through
    if (!radio && !el.querySelector('.pt-check__text')) {
      const t = document.createElement('span'); t.className = 'pt-check__text';
      let n = svg.nextSibling;
      while (n) { const next = n.nextSibling; t.appendChild(n); n = next; }
      el.appendChild(t);
    }
    el.classList.add('is-ready');
  }],
  ['.pt-habits', el => {
    // place every cell twice over: rows-as-habits (wide) and rows-as-days (narrow)
    let habit = 0, days = 0;
    el.querySelectorAll(':scope > .pt-habits__row').forEach(row => {
      const head = row.classList.contains('pt-habits__head');
      if (!head) habit++;
      const name = row.querySelector(':scope > .pt-habits__name');
      const cells = Array.from(row.children).filter(c => c !== name);
      days = Math.max(days, cells.length);
      const at = (c, ra, ca, rb, cb) => { c.style.setProperty('--pt-ra', ra); c.style.setProperty('--pt-ca', ca); c.style.setProperty('--pt-rb', rb); c.style.setProperty('--pt-cb', cb); };
      const r = head ? 1 : habit + 1;
      if (name) at(name, r, 1, 1, head ? 1 : habit + 1);
      cells.forEach((c, d) => at(c, r, d + 2, d + 2, head ? 1 : habit + 1));
    });
    el.style.setProperty('--pt-habit-count', habit);
    if (!el.style.getPropertyValue('--pt-days')) el.style.setProperty('--pt-days', days);
  }],
  ['.pt-habit', el => {
    if (el.classList.contains('is-ready')) return;
    const input = el.querySelector('input'); if (!input) return;
    const svg = svgEl('svg', { width: '20', height: '20', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(svgEl('circle', { class: 'pt-ring', cx: '12', cy: '12', r: '9' }));
    svg.appendChild(svgEl('path', { class: 'pt-fill', pathLength: '1', d: spiral(rng(seedOf(el))) }));
    input.after(svg);
    el.classList.add('is-ready');
  }],
  ['.pt-links-mix .pt-link:not([data-ul])', (el, o, i) => {
    el.dataset.ul = UL_MIX[(i + (rng(seedOf(el))() * 3 | 0)) % 3];
  }]
];

/** Split each letter of .pt-wobble into its own span with a small random offset. */
export function wobble(el, max) {
  if (el.dataset.ptWobbled) return;
  const r = rng(seedOf(el) + 11);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = []; let count = 0;
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (count > max) break;
    const frag = document.createDocumentFragment();
    for (const part of node.textContent.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
      const word = document.createElement('span'); word.style.whiteSpace = 'nowrap';
      for (const ch of part) {
        const s = document.createElement('span');
        s.className = 'pt-c'; s.textContent = ch; count++;
        s.style.cssText = `--y:${f((r() - .5) * 1.2)};--r:${f((r() - .5) * 2)};--o:${f(r() < .1 ? .74 + r() * .12 : .9 + r() * .1)}`;
        word.appendChild(s);
      }
      frag.appendChild(word);
    }
    node.replaceWith(frag);
  }
  el.dataset.ptWobbled = '1';
  // some screen readers spell out letters split into spans; headings can carry their text as a label
  if (!el.getAttribute('aria-label') && el.matches('h1,h2,h3,h4,h5,h6,.pt-label--emboss')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
}
