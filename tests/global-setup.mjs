// Bundles the test pages with esbuild and renders the hydration page on the server, into tests/.out.
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const page = body => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="stylesheet" href="../../dist/papertooth.min.css"></head>
<body class="pt-desk pt-day"><div id="root">${body}</div><script src="app.js"></script></body></html>\n`;

export default async function setup() {
  mkdirSync(`${root}tests/.out`, { recursive: true });
  const common = { absWorkingDir: root, bundle: true, jsx: 'automatic', logLevel: 'warning' };
  await Promise.all([
    // React's development build, so hydration mismatches and other warnings reach console.error
    build({ ...common, entryPoints: ['tests/fixtures/app.jsx'], format: 'iife', define: { 'process.env.NODE_ENV': '"development"' }, outfile: 'tests/.out/app.js' }),
    build({ ...common, entryPoints: ['tests/fixtures/ssr.jsx'], platform: 'node', format: 'esm', packages: 'external', outfile: 'tests/.out/ssr.mjs' })
  ]);
  const { html } = await import(pathToFileURL(`${root}tests/.out/ssr.mjs`).href);
  writeFileSync(`${root}tests/.out/page.html`, page(''));
  writeFileSync(`${root}tests/.out/hydrate.html`, page(html));
}
