# Script API

*papertooth · Reference*

Options for init(), and the methods on the returned kit.

```
const kit = Papertooth.init({
  root: document.body,   // where to look
  seed: null,            // a number makes every drawing repeatable
  filters: true,         // inject the texture filters
  filterParams: {        // tune any texture
    text: { density: .7 }, head: { rough: 1, density: .8 },
    graphite: { tooth: 2.4, rough: .9 },
    stamp: { wear: .55, rough: 1.3, edge: .5, mottle: .5 },
    smudge: { drag: 4.2, blur: 3.4, strength: .78 },
    smear: { drag: 7, blur: 4.5, strength: .7 },
    typewriter: { spread: .6, rough: 1.2, uneven: .7, speckle: .5 }
  },
  snap: true,            // put text on the grid
  lazy: true,            // draw shapes only near the screen
  motion: 'scroll',      // 'scroll', 'load' or 'none'
  stagger: .12,          // seconds between marks drawing on in one block
  highlight: 'swipe',    // default highlighter
  outline: 'sketch',     // default outline
  observe: true,         // enhance elements added later
  today: true,           // fill planner pieces marked data-today
  pen: null, pencil: null, ribbon: null, highlighter: null
});

kit.setPen('ink-beni');        // a token name or any colour
kit.setPencil('pencil-2b');
kit.setRibbon('ribbon-blue');
kit.setHighlighter('#ffc06a');
kit.setFilters({ stamp: { wear: .8 } });
kit.setTypewriter({ spread: .8 });
kit.refresh();                 // after changing writing mode or layout
kit.replay();                  // draw everything on again
kit.destroy();

Papertooth.renderDiagram(source, { font, seed, fill });   // SVG string
Papertooth.filtersMarkup(params);                         // the filters as SVG markup
```

## Performance

- Shapes are drawn only when they come near the screen, and redrawn only when their size or style changes.

- Each frame measures everything first and writes everything after, so the page lays out once.

- Snapping uses `translate`, which moves text without a new layout.

- The script ignores its own changes to the page and goes idle after loading.

- Animations are CSS only and stop for people who prefer reduced motion.

- Textures are SVG filters on text only. On long pages, use `.pt-texture-light`, or `.pt-lazy` on sections so the browser can skip them off screen.

---
https://tbudin.github.io/papertooth/api/ · papertooth 0.5.2 · MIT
