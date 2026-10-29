// Browser build: exposes window.Papertooth. Add data-pt-auto to the script tag to start on load,
// optionally with JSON options: <script src="papertooth.min.js" data-pt-auto='{"seed": 7}'></script>
import * as Papertooth from './index.js';
// the browser build is one file with everything in it, renderDiagram included
import { renderDiagram } from './diagram.js';

const script = document.currentScript;
const api = { ...Papertooth, renderDiagram, kit: null };
window.Papertooth = api;

if (script && script.hasAttribute('data-pt-auto')) {
  let opts = {};
  try { opts = JSON.parse(script.getAttribute('data-pt-auto') || '{}'); } catch { console.warn('papertooth: data-pt-auto is not valid JSON'); }
  const go = () => { api.kit = Papertooth.init(opts); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go, { once: true }); else go();
}
