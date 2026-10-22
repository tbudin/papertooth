// Build: readable and minified CSS, an ES module, a browser script, and the filters as a static file.
import { build } from 'esbuild';
import { writeFileSync, mkdirSync, readFileSync, copyFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { filtersMarkup } from '../src/js/filters.js';

mkdirSync('dist', { recursive: true });
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const banner = { css: `/* papertooth v${version} | MIT */`, js: `/* papertooth v${version} | MIT */` };

await Promise.all([
  build({ entryPoints: ['src/css/index.css'], bundle: true, outfile: 'dist/papertooth.css', banner, logLevel: 'warning', charset: 'ascii' }),
  build({ entryPoints: ['src/css/index.css'], bundle: true, minify: true, outfile: 'dist/papertooth.min.css', banner, logLevel: 'warning', charset: 'ascii' }),
  build({ entryPoints: ['src/js/index.js'], bundle: true, format: 'esm', target: 'es2020', outfile: 'dist/papertooth.js', banner, logLevel: 'warning', charset: 'ascii' }),
  build({ entryPoints: ['src/js/index.js'], bundle: true, format: 'esm', target: 'es2020', minify: true, outfile: 'dist/papertooth.min.mjs', banner, logLevel: 'warning', charset: 'ascii' }),
  build({ entryPoints: ['src/js/auto.js'], bundle: true, format: 'iife', target: 'es2020', minify: true, outfile: 'dist/papertooth.min.js', banner, logLevel: 'warning', charset: 'ascii' })
]);
writeFileSync('dist/papertooth-filters.svg', filtersMarkup() + '\n');

// the docs page loads the built files from its own folder
for (const f of ['papertooth.min.css', 'papertooth.min.js']) copyFileSync('dist/' + f, 'docs/' + f);

const kb = n => (n / 1024).toFixed(1) + ' KB';
for (const f of ['papertooth.min.css', 'papertooth.min.js', 'papertooth.min.mjs', 'papertooth-filters.svg']) {
  const b = readFileSync('dist/' + f);
  console.log(f.padEnd(24), kb(b.length).padStart(9), ' gzip', kb(gzipSync(b).length).padStart(8));
}
