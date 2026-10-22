// Snap text onto the grid: each block is nudged (with `translate`, which never triggers layout)
// so its first baseline sits exactly on a dot row. All reads happen in one pass, then all writes.
export const SNAP_SELECTOR = ':is(h1, h2, h3, h4, p, li, .pt-btn, .pt-snap):not(.pt-nosnap)';
// components that keep their own ruling
const SKIP = '.pt-sticky, .pt-card, .pt-torn, .pt-ticket, .pt-week, .pt-approval, .pt-nosnap, .pt-tabs, .pt-habits, .pt-photo, .pt-postage, .pt-diagram';

export function snapSheet(sheet, scope = sheet) {
  const grid = parseFloat(getComputedStyle(sheet).getPropertyValue('--pt-grid')) || 24;
  const all = Array.from(scope.querySelectorAll(SNAP_SELECTOR));
  // keep the outermost block only, and leave self-ruled components alone
  const els = all.filter(el => {
    if (el.closest(SKIP)) return false;
    const up = el.parentElement && el.parentElement.closest(SNAP_SELECTOR);
    return !up || !sheet.contains(up) || up === sheet;
  });
  if (!els.length) return;
  for (const el of els) el.style.translate = '';
  const probes = els.map(el => {
    const host = el.querySelector('.pt-btn__label') || el;
    const p = document.createElement('span');
    p.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    host.insertBefore(p, host.firstChild);
    return p;
  });
  const top = sheet.getBoundingClientRect().top + sheet.clientTop;
  const ys = probes.map(p => p.getBoundingClientRect().top - top);   // one layout for all of them
  probes.forEach(p => p.remove());
  els.forEach((el, i) => {
    // whole pixels only: a fractional offset makes Safari move the text by half a pixel when a layer changes
    const d = Math.round(Math.round(ys[i] / grid) * grid - ys[i]);
    if (d) el.style.translate = `0 ${d}px`;
  });
}
