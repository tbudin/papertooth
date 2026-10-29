// Checks the sizes the README states against what dist actually weighs.
//
// The README quotes a figure in five places and a table of ten parts, and
// nothing checked any of them. By 0.5.0 every headline number understated the
// package — the CSS by 40%, the module by 29% — and the intro and the loading
// section disagreed with each other about the same file. Numbers nobody
// measures are a promise the build never keeps.
//
// Everything here is measured from dist/, which CI already proves matches src/.
import { gzipSync } from "node:zlib";
import { readFile, readdir } from "node:fs/promises";

const root = new URL("..", import.meta.url).pathname;
const gz = async (file) => gzipSync(await readFile(`${root}${file}`)).length / 1000;

// "about N KB" is rounded prose, so it gets a wider tolerance than the table,
// which quotes one decimal and should track the file closely.
const ABOUT = 1.0;
const EXACT = 0.25;

const readme = await readFile(`${root}README.md`, "utf8");
const failures = [];

/** Pulls the number out of a phrase that must appear exactly once. */
function claimed(pattern, what) {
  const found = [...readme.matchAll(pattern)];
  if (found.length !== 1) {
    failures.push(`README should say "${what}" exactly once, found ${found.length}`);
    return null;
  }
  return Number.parseFloat(found[0][1]);
}

function compare(label, claim, measured, tolerance) {
  if (claim === null) return;
  if (Math.abs(claim - measured) > tolerance) {
    failures.push(`${label}: README says ${claim} KB, dist is ${measured.toFixed(1)} KB`);
  }
}

// The module's real cost is its entry plus the chunks it imports statically.
// Diagrams and image effects are loaded on demand and are not part of it.
const entry = await readFile(`${root}dist/papertooth.js`, "utf8");
const eager = [...entry.matchAll(/from "\.\/(chunks\/[^"]+)"/g)].map((m) => m[1]);
const eagerBytes = Buffer.concat([
  Buffer.from(entry),
  ...(await Promise.all(eager.map((file) => readFile(`${root}dist/${file}`)))),
]);

const css = await gz("dist/papertooth.min.css");

compare("the CSS", claimed(/The CSS \(about ([\d.]+) KB gzipped\)/g, "The CSS (about N KB gzipped)"), css, ABOUT);
compare("papertooth/css", claimed(/`papertooth\/css` is everything \(about ([\d.]+) KB gzipped\)/g, "`papertooth/css` is everything"), css, ABOUT);
compare("the browser script", claimed(/An optional script \(about ([\d.]+) KB gzipped\)/g, "An optional script"), await gz("dist/papertooth.min.js"), ABOUT);
compare("the module", claimed(/about ([\d.]+) KB gzipped\); the code for diagrams/g, "the module's size"), gzipSync(eagerBytes).length / 1000, ABOUT);
compare("css/base", claimed(/`papertooth\/css\/base` \(([\d.]+) KB:/g, "`papertooth/css/base` (N KB:"), await gz("dist/css/base.css"), EXACT);

// Every part in dist/css must appear in the table with the weight it has, and
// the table must not promise a part that no longer ships.
const parts = (await readdir(`${root}dist/css`)).filter((f) => f.endsWith(".css")).map((f) => f.slice(0, -4));
const rows = new Map([...readme.matchAll(/^\| `([a-z]+)` \|.*\| ([\d.]+) KB \|$/gm)].map((m) => [m[1], Number.parseFloat(m[2])]));

for (const part of parts) {
  if (part === "base") continue; // quoted in the prose above, not the table
  if (!rows.has(part)) {
    failures.push(`dist/css/${part}.css ships but the table has no row for it`);
    continue;
  }
  compare(`the ${part} row`, rows.get(part), await gz(`dist/css/${part}.css`), EXACT);
}
for (const part of rows.keys()) {
  if (!parts.includes(part)) failures.push(`the table has a row for \`${part}\` but dist/css/${part}.css does not exist`);
}

if (failures.length) {
  console.error("README sizes are out of date:");
  for (const failure of failures) console.error(`  ${failure}`);
  console.error("\nRun this after a build and update README.md to match.");
  process.exit(1);
}

console.log(`  README sizes — CSS ${css.toFixed(1)} kB, ${rows.size} parts, all within tolerance`);
