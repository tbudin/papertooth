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
    heading: 'Goodbye', letters: 7, label: 'Saved', smear: 'Saved', hoverInk: true, markInk: 'second',
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
