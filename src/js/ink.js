// Changing pens, pencils and ribbons. Drawn assets in the CSS are images, so their colour is
// rewritten here; everything else follows the custom properties.
import { cssVar, toHex } from './core.js';
import { injectFilters } from './filters.js';

const PEN_ASSETS = ['--pt-u-wobble', '--pt-u-slant', '--pt-u-double', '--pt-u-swash', '--pt-u-marker', '--pt-u-wave', '--pt-u-second'];
const RIBBON_ASSETS = ['--pt-r-wobble', '--pt-r-double', '--pt-r-dashes', '--pt-box', '--pt-strike'];
const PEN_DEFAULT = '%23213c6b', RIBBON_DEFAULT = '%2324262c';

// the assets as the stylesheet ships them, read once before anything is recoloured
let templates = null;
function readTemplates() {
  if (templates) return templates;
  const html = document.documentElement;
  templates = {};
  for (const v of [...PEN_ASSETS, ...RIBBON_ASSETS]) templates[v] = cssVar(html, v);
  return templates;
}
/** Accept a colour or a token name such as "ink-beni" or "--pt-ink-beni". */
export function resolve(colour, el = document.documentElement) {
  if (!colour) return '';
  if (colour.startsWith('--')) return cssVar(el, colour);
  if (/^[a-z]+(-[a-z0-9]+)+$/.test(colour)) return cssVar(el, '--pt-' + colour) || colour;
  return colour;
}

function recolour(target, list, from, hex) {
  const t = readTemplates(), to = '%23' + hex.slice(1);
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
