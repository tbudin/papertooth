# Installation

*papertooth · Getting started*

Install the package, or load two files from a CDN.

npm

```
npm install papertooth
```

```
import 'papertooth/css';
import { init } from 'papertooth';

const kit = init({ pen: 'ink-ai', motion: 'scroll' });
```

CDN, no build step

```
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/papertooth@0.5/dist/papertooth.min.css">
<script src="https://cdn.jsdelivr.net/npm/papertooth@0.5/dist/papertooth.min.js" defer data-pt-auto></script>
```

`data-pt-auto` starts the script on load. Pass options as JSON: `data-pt-auto='{"seed": 7}'`. The running instance is `window.Papertooth.kit`.

## Fonts

Fonts are not bundled. The defaults are Courier Prime, Special Elite and Caveat, plus Shippori Mincho B1 and Zen Maru Gothic for Japanese stamps. Swap any of them in [Theming](https://tbudin.github.io/papertooth/theming/).

```
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Courier+Prime:wght@400;700&family=Special+Elite&display=swap">
```

## A first page

```
<body class="pt-desk">
  <main class="pt-sheet" data-paper="dot">
    <h1 class="pt-wobble">A typed heading</h1>
    <p>Some text with a <mark class="pt-mark">highlight</mark> and a <a class="pt-link" href="#">link</a>.</p>
    <a class="pt-btn" href="#">Hire me</a>
  </main>
</body>
```

## Without the script

Everything still renders, with a fixed version of each drawn shape. For the textures, paste `dist/papertooth-filters.svg` into the page and add `class="pt-filters"` to `<html>`. Lithograph, printer and diagrams need the script.

---
https://tbudin.github.io/papertooth/install/ · papertooth 0.5.2 · MIT
