// Writing instruments. Anything drawn can be drawn with any of them: the colour, weight and
// texture come from CSS (data-tool on the element), the character of the line from here.
import { f } from './core.js';

export const TOOLS = ['pen', 'ballpoint', 'brush', 'marker', 'graphite', 'pencil'];

/** Read the instrument an element is drawn with. `def` fills anything the CSS does not set. */
export function toolOf(el, def = {}) {
  const cs = getComputedStyle(el);
  const v = n => cs.getPropertyValue(n).trim();
  const kind = el.dataset.tool && TOOLS.includes(el.dataset.tool) ? el.dataset.tool : (v('--pt-t-kind') || def.kind || 'pen');
  return {
    kind,
    color: v('--pt-t-color') || def.color || '#24262c',
    w: parseFloat(v('--pt-t-w')) || def.w || 1.6,
    op: parseFloat(v('--pt-t-op')) || def.op || 1
  };
}
export const toolKey = t => `${t.kind}|${t.color}|${t.w}|${t.op}`;
const grainy = t => t.kind === 'graphite' || t.kind === 'pencil';

/** Filters a standalone SVG needs for this instrument. */
export function toolDefs(t, id = 'pg') {
  if (!grainy(t)) return '';
  // the paper's tooth only catches some of the lead
  return `<filter id="${id}" x="-10%" y="-30%" width="120%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="1.3 .9" numOctaves="2" seed="3" result="n"/>`
    + `<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -.55" result="a"/><feComposite in="SourceGraphic" in2="a" operator="in"/></filter>`;
}

/**
 * How each instrument lays its line, as passes of the same path: [dx, dy, width factor, opacity factor].
 * The fountain pen is a broad nib held at about 40 degrees: copies of the line along the nib's edge
 * make strokes across the nib thick and strokes along it thin, with ink gathering at both edges.
 */
export function passes(t, nonScaling) {
  const w = t.w;
  switch (t.kind) {
    case 'ballpoint': return [[0, 0, 1, .95]];
    case 'brush':     return [[0, 0, 1, .78], [.35, -.25, .5, 1]];
    case 'marker':    return [[0, 0, 1, .86]];
    case 'graphite':
    case 'pencil':    return [[0, 0, 1, .75], [.4, .3, .7, .55]];
    default: {
      const n = w * .34, cx = nonScaling ? 0 : Math.cos(.7) * n, cy = Math.sin(.7) * n;
      return [[0, 0, .82, .9], [-cx, cy, .42, .62], [cx, -cy, .42, .62]];
    }
  }
}

/* where each subpath starts and ends, for the ink a nib leaves when it lands and lifts */
function ends(d) {
  const out = [];
  for (const sub of d.split(/(?=M)/)) {
    const n = sub.match(/-?\d*\.?\d+/g);
    if (n && n.length >= 4) out.push([+n[0], +n[1]], [+n[n.length - 2], +n[n.length - 1]]);
  }
  return out;
}

/** Stroke a path with an instrument. `scale` widens it (e.g. a marker-style underline). */
export function inkPath(d, t, opts = {}) {
  const w = t.w * (opts.scale || 1), c = t.color, op = t.op * (opts.op || 1);
  const base = `fill="none" stroke="${c}" stroke-linecap="round" stroke-linejoin="round"${opts.nonScaling ? ' vector-effect="non-scaling-stroke"' : ''}`;
  const dash = t.kind === 'ballpoint' ? ` stroke-dasharray="${opts.dash || '38 1.1 61 .7 23 1.4'}"` : '';
  let out = passes({ ...t, w }, opts.nonScaling).map(([dx, dy, k, o]) =>
    `<path d="${d}" ${base} stroke-width="${f(w * k)}" stroke-opacity="${f(op * o * 100) / 100}"${dash}${dx || dy ? ` transform="translate(${f(dx)} ${f(dy)})"` : ''}/>`).join('');
  if (t.kind === 'marker') out = `<g style="mix-blend-mode:multiply">${out}</g>`;
  // a fountain pen leaves a little more ink where it lands and where it lifts off
  if (t.kind === 'pen' && !opts.nonScaling && op > .5) {
    out += ends(d).slice(0, 24).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(w * .55)}" fill="${c}" fill-opacity="${f(op * 55) / 100}"/>`).join('');
  }
  return grainy(t) && !opts.noFilter ? `<g filter="url(#${opts.filterId || 'pg'})">${out}</g>` : out;
}

/** A filled shape in the instrument's ink (used for pressure strokes). */
export function inkFill(d, t, opts = {}) {
  const fill = `<path d="${d}" fill="${t.color}" fill-opacity="${f(t.op * (t.kind === 'marker' ? .86 : 1) * 100) / 100}"/>`;
  return grainy(t) && !opts.noFilter ? `<g filter="url(#${opts.filterId || 'pg'})">${fill}</g>` : fill;
}
