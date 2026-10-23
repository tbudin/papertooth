// Build: readable and minified CSS, an ES module, a browser script, and the filters as a static file.
import { build } from 'esbuild';
import { writeFileSync, mkdirSync, readFileSync, copyFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { filtersMarkup } from '../src/js/filters.js';

mkdirSync('dist', { recursive: true });
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
// the source is published too, so VERSION is written in it rather than injected; keep the two in step
if (!readFileSync('src/js/index.js', 'utf8').includes(`VERSION = '${version}'`)) {
  throw new Error(`src/js/index.js VERSION does not match package.json (${version})`);
}
// MIT asks for the copyright line to travel with every copy, and the CDN files travel without LICENSE.
// "/*!" keeps the comment through a user's own minifier.
const notice = `/*! papertooth v${version} | (c) 2026 Thomas Budin | MIT License | github.com/tbudin/papertooth */`;
const banner = { css: notice, js: notice };

// papertooth/react takes the kit from the main entry ("papertooth"), so a page never runs two copies of it;
// the small pure helpers it draws with (seeded randomness, checkbox shapes) are bundled in
const useMainEntry = {
  name: 'use-main-entry',
  setup(b) { b.onResolve({ filter: /\/js\/index\.js$/ }, () => ({ path: 'papertooth', external: true })); }
};

await Promise.all([
  build({ entryPoints: ['src/css/index.css'], bundle: true, outfile: 'dist/papertooth.css', banner, logLevel: 'warning', charset: 'ascii' }),
  build({ entryPoints: ['src/css/index.css'], bundle: true, minify: true, outfile: 'dist/papertooth.min.css', banner, logLevel: 'warning', charset: 'ascii' }),
  // the same CSS inside @layer papertooth, for sites that order their CSS in cascade layers (Tailwind v4)
  build({ entryPoints: ['src/css/layer.css'], bundle: true, minify: true, outfile: 'dist/papertooth.layer.css', banner, logLevel: 'warning', charset: 'ascii' }),
  build({ entryPoints: ['src/js/index.js'], bundle: true, format: 'esm', target: 'es2020', outfile: 'dist/papertooth.js', banner, logLevel: 'warning', charset: 'ascii' }),
  build({ entryPoints: ['src/js/index.js'], bundle: true, format: 'esm', target: 'es2020', minify: true, outfile: 'dist/papertooth.min.mjs', banner, logLevel: 'warning', charset: 'ascii' }),
  build({ entryPoints: ['src/js/auto.js'], bundle: true, format: 'iife', target: 'es2020', minify: true, outfile: 'dist/papertooth.min.js', banner, logLevel: 'warning', charset: 'ascii' }),
  // "use client" lets Next.js server components import it; a directive may follow a comment but nothing else
  build({ entryPoints: ['src/react/index.js'], bundle: true, format: 'esm', target: 'es2020', external: ['react'], plugins: [useMainEntry],
    outfile: 'dist/react.js', banner: { js: notice + '\n"use client";' }, logLevel: 'warning', charset: 'ascii' })
]);
writeFileSync('dist/papertooth-filters.svg', filtersMarkup() + '\n');

// the docs page loads the built files from its own folder
for (const f of ['papertooth.min.css', 'papertooth.min.js']) copyFileSync('dist/' + f, 'docs/' + f);

const kb = n => (n / 1024).toFixed(1) + ' KB';
for (const f of ['papertooth.min.css', 'papertooth.min.js', 'papertooth.min.mjs', 'papertooth-filters.svg']) {
  const b = readFileSync('dist/' + f);
  console.log(f.padEnd(24), kb(b.length).padStart(9), ' gzip', kb(gzipSync(b).length).padStart(8));
}
