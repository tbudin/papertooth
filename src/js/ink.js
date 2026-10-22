// Changing pens, pencils and ribbons. Drawn assets in the CSS are images, so their colour is
// rewritten here; everything else follows the custom properties.
import { cssVar } from './core.js';
import { injectFilters } from './filters.js';

const PEN_ASSETS = ['--pt-u-wobble', '--pt-u-slant', '--pt-u-double', '--pt-u-swash', '--pt-u-marker', '--pt-u-wave', '--pt-u-second'];
const RIBBON_ASSETS = ['--pt-r-wobble', '--pt-r-double', '--pt-r-dashes', '--pt-box', '--pt-strike'];
const PEN_DEFAULT = '%23213c6b', RIBBON_DEFAULT = '%2324262c';

let templates = null;
function readTemplates(root) {
  if (templates) return templates;
  const html = document.documentElement;
  templates = {};
  for (const v of [...PEN_ASSETS, ...RIBBON_ASSETS]) templates[v] = cssVar(html, v);
  return templates;
}
/** Accept a colour or a token name such as "ink-beni" or "--pt-ink-beni". */
export function resolve(colour, el = document.documentElement) {
  if (!colour) return '';
  if (/^--/.test(colour)) return cssVar(el, colour);
  if (/^[a-z]+(-[a-z0-9]+)+$/.test(colour) && !/^(rgb|hsl)/.test(colour)) return cssVar(el, '--pt-' + colour) || colour;
  return colour;
}
const toHex = c => {
  if (c.startsWith('#')) return c.length === 4 ? '#' + [...c.slice(1)].map(x => x + x).join('') : c.slice(0, 7);
  const m = c.match(/[\d.]+/g); if (!m) return c;
  return '#' + m.slice(0, 3).map(v => (+v | 0).toString(16).padStart(2, '0')).join('');
};

function recolour(target, list, from, hex) {
  const t = readTemplates(target), to = '%23' + hex.slice(1);
  for (const v of list) if (t[v]) target.style.setProperty(v, t[v].split(from).join(to));
}

export function setPen(colour, target = document.documentElement) {
  const hex = toHex(resolve(colour, target));
  target.style.setProperty('--pt-pen', hex);
  recolour(target, PEN_ASSETS, PEN_DEFAULT, hex);
  if (document.getElementById('pt-filters')) injectFilters({ colors: { pen: hex } });
  return hex;
}
export function setRibbon(colour, target = document.documentElement) {
  const hex = toHex(resolve(colour, target));
  target.style.setProperty('--pt-ribbon', hex);
  recolour(target, RIBBON_ASSETS, RIBBON_DEFAULT, hex);
  if (document.getElementById('pt-filters')) injectFilters({ colors: { ribbon: hex } });
  return hex;
}
export function setPencil(colour, target = document.documentElement) {
  const hex = toHex(resolve(colour, target));
  target.style.setProperty('--pt-pencil', hex);
  return hex;
}
export function setHighlighter(colour, target = document.documentElement) {
  const hex = toHex(resolve(colour, target));
  target.style.setProperty('--pt-hl', hex);
  if (document.getElementById('pt-filters')) injectFilters({ colors: { highlighter: hex } });
  return hex;
}
