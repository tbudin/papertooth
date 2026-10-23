// Browser tests: the scenarios from the planner-app review of 0.3.0, the React layer, and a smoke test of the docs page.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const out = file => new URL(`./.out/${file}`, import.meta.url).href;

/** Open a scenario page and return what it wrote into <body data-result>. */
async function scenario(page, name, file = 'page.html') {
  await page.goto(`${out(file)}?s=${name}`);
  await page.waitForFunction(() => document.body.hasAttribute('data-result'), null, { timeout: 15000 });
  const result = JSON.parse(await page.locator('body').getAttribute('data-result'));
  expect(result.fatal, result.fatal).toBeUndefined();
  expect(result.errors, 'console errors').toEqual([]);
  return result;
}

test('a React className change keeps a block drawn', async ({ page }) => {
  const r = await scenario(page, 'className');
  expect(r).toMatchObject({ className: 'is-on', drawn: true, stampOpacity: '0.86' });
});

test('init() after destroy() still draws what is below the fold', async ({ page }) => {
  const r = await scenario(page, 'remount');
  expect(r).toMatchObject({ drawn: true, stampOpacity: '0.86' });
});

test('content added on screen draws on, unless drawInserted is false or it is settled', async ({ page }) => {
  const r = await scenario(page, 'inserted');
  expect(r.default).toEqual({ draw: '', animation: 'pt-thunk' });
  expect(r.drawInsertedFalse).toEqual({ draw: 'off', animation: 'none' });
  expect(r.settle).toEqual({ draw: 'off', animation: 'none' });
});

test('Wobble splits mixed text, Btn repeats text only, refs reach the element', async ({ page }) => {
  const r = await scenario(page, 'components');
  expect(r).toMatchObject({
    letters: 8, srText: 'Hello Tom', copied: 'Hello Tom', lettersHidden: true, numbers: '5 tasks',
    smear: '★ Save', icons: 1, btnRef: 'A', checkRef: 'checkbox'
  });
});

test('re-rendering keeps the markup the components render', async ({ page }) => {
  const r = await scenario(page, 'rerender');
  expect(r).toEqual({
    heading: 'Goodbye', letters: 7, label: 'Saved', smear: 'Saved', hoverInk: true, btnUnderline: true, markInk: 'second',
    annoPaths: 2, checks: ['Beta+box'], errors: []
  });
});

test('the server-rendered planner hydrates without warnings and works', async ({ page }) => {
  const r = await scenario(page, 'hydrate', 'hydrate.html');
  expect(r.gb).toBe('21October 2026Wednesday水Week 43');   // textContent: no spaces between the parts
  expect(r.fr).toBe('21octobre 2026mercredi水Semaine 43');
  expect(r.gbDays).toBe('1234560');
  expect(r.usDays).toBe('0123456');
  expect(r.todayCircled).toBe(true);
  expect(r.todayContent).toBe('Print proofs');
  expect(r.sundayHead).toBe('rgb(200, 67, 47)');
  expect(r.toggled).toEqual([1, 1, true]);
  expect(r.cellPlace).toBe('--pt-ra:2;--pt-ca:2;--pt-rb:2;--pt-cb:2');
  expect(r.dateStamp).toBe('- - circle - - - - x x - - - - -');   // header, then the row to fill in
  expect(r.dateStampInk).toBe('blue');
});

test('date stamps print a week strip, a month calendar, a year and bars, with the marks laid exactly on top', async ({ page }) => {
  const r = await scenario(page, 'datestamp');
  expect(r.layersAlign).toBe(true);
  expect(r.weekParts).toBe('title:1 head:1 write:2');
  expect(r.weekHead).toBe('M T W T F S S');
  expect(r.weekHeadMarks).toBe('- - circle - - - -');                         // today circled in the header
  expect(r.weekWriteMarks).toBe('x x - - - - - x x - - - - -');               // the days gone by crossed in each row
  expect(r.weekLabel).toMatch(/^Wednesday,? 21 October 2026$/);
  expect(r.circleDrawn).toBe(true);
  expect(r.monthLabel).toMatch(/^Wednesday,? 21 October 2026$/);             // a calendar says the day it marks
  expect(r.wideLabel).toMatch(/^Wednesday,? 21 October 2026$/);
  expect(r.yearLabel).toBe('October 2026');                                    // a year of months says the month
  expect(r.barLabel).toMatch(/^Wednesday,? 21 October 2026$/);
  expect(r.monthSelector).toBe('Jan Feb Mar Apr May Jun Jul Aug Sept Oct Nov Dec');
  expect(r.monthSelectorMarks).toBe('- - - - - - - - - circle - -');          // only circled, never crossed
  expect(r.monthHead).toBe('M T W T F S S');
  expect(r.monthDays.startsWith('· · · 1 2 3 4 5')).toBe(true);              // October 2026 starts on a Thursday
  expect(r.monthDayMarks.split(' ').filter(m => m === 'x')).toHaveLength(20);
  expect(r.monthDayMarks.split(' ')[23]).toBe('circle');                       // the 21st
  expect(r.jaHead).toBe('日 月 火 水 木 金 土');                                // Sunday first in Japanese
  expect(r.jaSelectorMarks.split(' ')[9]).toBe('hl');
  expect(r.jaLang).toBe('ja');
  expect(r.year).toBe('2026 | Jan Feb Mar Apr May Jun Jul Aug Sept Oct Nov Dec');
  expect(r.yearMarks).toBe('x x x x x x x x x circle - -');
  expect(r.bar).toBe('Mon Tue Wed Thu Fri Sat Sun');
  expect(r.barMarks).toBe('x x circle - - - -');
  expect(r.wideHead.startsWith('Oct T F S S M T W')).toBe(true);              // each day under its weekday
  expect(r.wideDays).toBe('2026 ' + Array.from({ length: 31 }, (_, k) => k + 1).join(' '));
  expect(r.wideDayMarks.split(' ').filter(m => m === 'x')).toHaveLength(20);
  expect(r.wideDayMarks.split(' ')[21]).toBe('circle');
  expect(r.wideWrite).toBe(64);                                                 // two rows of a side cell and 31 days
  expect(r.wideSides).toBe(4);
  expect(r.wideFits).toBe(true);
  expect(r.days).toBe(28);
  expect(r.dayMarked).toBe(10);
});

test('wrapped to-dos grow by whole lines and are struck line by line; marks and sticky notes wrap and stay put', async ({ page }) => {
  const r = await scenario(page, 'wrapping');
  expect(r.taskLines).toBeGreaterThan(1);
  expect(r.liHeights).toEqual([r.taskLines, 1]);
  expect(r.strikeClone).toBe('clone');
  expect(r.strikeLines).toBeGreaterThan(1);
  expect(r.strikeStrokes).toBe(r.strikeLines);   // one stroke per line
  expect(r.circleShapes).toBe(1);                // one circle around the whole phrase
  expect(r.sticky).toBe(true);
});

test('ruled lists snap as one block, white paper is white, and page margins keep a cell', async ({ page }) => {
  const r = await scenario(page, 'snapping');
  expect(r.itemsMoved).toBe(0);
  expect(r.todoOnGrid).toBe(true);
  expect(r.ruledOnGrid).toBe(true);
  expect(r.white).toBe('rgb(254, 254, 254)');
  expect(r.cream).toBe('rgb(248, 241, 223)');
  await page.setViewportSize({ width: 375, height: 700 });
  expect((await scenario(page, 'page')).padding).toBe('24px');
});

test('every picture stamp has its drawing in the stylesheet', async ({ page }) => {
  const { PICTURES } = await import('../dist/shapes.js');
  await page.goto(out('page.html') + '?s=none');
  const missing = await page.evaluate(names => {
    const host = document.createElement('main'); host.className = 'pt-sheet'; document.body.append(host);
    return names.filter(n => {
      const s = document.createElement('span'); s.className = 'pt-stamp'; s.dataset.pic = n; host.append(s);
      return !/svg/.test(getComputedStyle(s, '::before').maskImage || getComputedStyle(s, '::before').webkitMaskImage);
    });
  }, Object.keys(PICTURES));
  expect(Object.keys(PICTURES)).toHaveLength(18);
  expect(missing).toEqual([]);
});

test('papertooth/shapes and papertooth/tokens run without a DOM', async () => {
  // this test runs in Node, where there is no document
  const S = await import('../dist/shapes.js'), { TOKENS } = await import('../dist/tokens.js');
  expect(typeof document).toBe('undefined');
  expect(S.ANNO.x(60, 24, S.rng(7))).toMatch(/^M[\d.]+ [\d.]+ Q/);
  expect(S.OUTLINE.sketch(120, 48, S.rng(3), { kind: 'pen', color: TOKENS['ink-ai'], w: 1.6, op: 1 })).toContain('stroke="#213c6b"');
  expect(S.pictureSVG('tanuki')).toMatch(/^<svg [^>]*aria-label="Tanuki"/);
  expect(Object.keys(TOKENS).length).toBeGreaterThan(50);
});

test('the docs page runs without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(new URL('../docs/index.html#intro', import.meta.url).href);
  await expect(page.locator('#version')).toHaveText(`v${version}`);
  await expect(page.locator('html')).toHaveAttribute('data-pt-filters', '');
  await expect(page.locator('.pt-btn--outline').first()).toHaveAttribute('style', /--pt-ol/);
  expect(errors).toEqual([]);
});

test('as modules, diagrams and image effects are fetched only when a page has one', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:4317/tests/fixtures/module.html');
  await page.waitForFunction(() => document.body.hasAttribute('data-result'), null, { timeout: 15000 });
  const r = JSON.parse(await page.locator('body').getAttribute('data-result'));
  expect(r).toEqual({
    mainHasRenderDiagram: false, loadedBeforeInit: [], loadedAfter: ['diagram', 'images'],
    anno: true, diagram: true, litho: true, frog: true, ownDiagram: true
  });
  expect(errors).toEqual([]);
});

test('buttons and links draw their hover mark in every state that calls for it, and never when disabled', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });   // no transition, so the end state reads at once
  await page.goto('http://localhost:4317/tests/fixtures/states.html');
  await page.waitForFunction(() => document.querySelector('#btn > .pt-hover-ink path')?.getAttribute('d'));
  const ids = ['btn', 'pressed', 'disabled', 'ariaDisabled', 'outline', 'link', 'current', 'linkButton', 'summary'];
  const wipe = () => page.evaluate(ids => Object.fromEntries(ids.map(i => [i, +getComputedStyle(document.getElementById(i)).getPropertyValue('--pt-wipe')])), ids);
  expect(await wipe()).toEqual({ btn: 0, pressed: 1, disabled: 0, ariaDisabled: 0, outline: 0, link: 0, current: 1, linkButton: 0, summary: 1 });
  for (const [id, drawn] of [['btn', 1], ['disabled', 0], ['ariaDisabled', 0], ['outline', 1], ['link', 1], ['linkButton', 1]]) {
    await page.hover('#' + id, { force: true });
    expect((await wipe())[id], `hovering #${id}`).toBe(drawn);
  }
  await page.hover('#btn');
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#btn > .pt-hover-ink path')).opacity)).toBe('1');
  await page.mouse.move(0, 0);
  await page.keyboard.press('Tab');                        // keyboard focus on the first button
  expect((await wipe()).btn).toBe(1);
  const look = await page.evaluate(() => {
    const s = id => getComputedStyle(document.getElementById(id));
    return { disabledOpacity: s('disabled').opacity, linkButtonBorder: s('linkButton').borderTopStyle, linkButtonBg: s('linkButton').backgroundColor, secondPass: getComputedStyle(document.getElementById('btn'), '::after').display };
  });
  expect(look).toEqual({ disabledOpacity: '0.5', linkButtonBorder: 'none', linkButtonBg: 'rgba(0, 0, 0, 0)', secondPass: 'none' });
  expect(errors).toEqual([]);
});

test('a brush mark has the texture of brush ink, a pen mark none', async ({ page }) => {
  await page.goto('http://localhost:4317/tests/fixtures/states.html');
  await page.waitForFunction(() => document.querySelector('#brushMark .pt-anno__ink path')?.getAttribute('d'));
  const r = await page.evaluate(() => ({
    brush: getComputedStyle(document.querySelector('#brushMark .pt-anno__ink')).filter,
    pen: getComputedStyle(document.querySelector('#penMark .pt-anno__ink')).filter,
    defined: !!document.querySelector('#pt-filters filter#pt-brush')
  }));
  expect(r).toEqual({ brush: 'url("#pt-brush")', pen: 'none', defined: true });
});

test('snapping again puts buttons exactly where they were', async ({ page }) => {
  await page.goto('http://localhost:4317/tests/fixtures/states.html');
  await page.waitForFunction(() => document.querySelector('#btn > .pt-hover-ink path')?.getAttribute('d'));
  // with transitions on, as on a real page: an animated translate would be measured mid-way and the snap would swing
  const offsets = await page.evaluate(async () => {
    const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const read = () => [...document.querySelectorAll('.pt-btn')].map(b => b.style.translate || '0').join(' | ');
    await frame();
    const runs = [read()];
    for (let i = 0; i < 3; i++) { window.kit.snap(); await frame(); runs.push(read()); }
    return runs;
  });
  expect(new Set(offsets).size, offsets.join('\n')).toBe(1);
});

test('a section on a sheet keeps the rhythm of a document but not over an app layout', async ({ page }) => {
  await page.goto('http://localhost:4317/tests/fixtures/layout.html');
  const r = await page.evaluate(() => {
    const s = id => getComputedStyle(document.getElementById(id)), w = id => Math.round(document.getElementById(id).getBoundingClientRect().width);
    return {
      sectionDisplay: s('pane').display, docP: s('docP').marginTop, docList: s('docList').marginTop,
      bar: w('bar'), barMax: Math.min(600, w('pane')), after: s('after').marginTop,
      titleSize: s('title').fontSize, titleMargin: s('title').marginBottom
    };
  });
  expect(r).toEqual({
    sectionDisplay: 'block', docP: '24px', docList: '24px',     // text blocks keep a grid line between them
    bar: r.barMax, barMax: r.barMax, after: '0px',              // a centred bar keeps its width, an app's div no extra space
    titleSize: '13px', titleMargin: '8px'                       // an app's class wins over the sheet's headings
  });
});

test('a page sheet adds no space between the parts of an app, only between blocks of text', async ({ page }) => {
  await page.goto('http://localhost:4317/tests/fixtures/page-layout.html');
  const r = await page.evaluate(() => {
    const box = id => document.getElementById(id).getBoundingClientRect();
    return {
      display: getComputedStyle(document.querySelector('.pt-sheet--page')).display,
      headerToTabs: Math.round(box('tabs').top - box('header').bottom), tabsToView: Math.round(box('view').top - box('tabs').bottom),
      betweenParagraphs: Math.round(box('second').top - box('first').bottom)
    };
  });
  expect(r).toEqual({ display: 'block', headerToTabs: 0, tabsToView: 0, betweenParagraphs: 24 });
});

test('every part has its stylesheet, and every picture its own file', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const { PICTURES } = await import('../dist/shapes.js');
  const css = readdirSync(new URL('../dist/css/', import.meta.url)).sort();
  expect(css).toEqual(['base', 'diagram', 'extras', 'forms', 'goods', 'highlight', 'images', 'lines', 'marks', 'pictures', 'planner'].map(p => p + '.css'));
  for (const name of Object.keys(PICTURES)) {
    const svg = readFileSync(new URL(`../dist/stamps/${name}.svg`, import.meta.url), 'utf8');
    expect(svg).toContain(`<mask id="pt-${name}"`);   // unique, so several can be inlined in one page
    expect(svg).toContain('fill="currentColor"');
  }
});
