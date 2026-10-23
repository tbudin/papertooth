# Papertooth

The feel of paper, for the web. Paper-makers call the fine grain on a sheet its *tooth*: it is what grips the pencil and what you feel under your fingers.

Papertooth is hand-drawn stationery for the web, inspired by Japanese stationery (文房具, bunbougu). Dotted and grid paper, typewriter and fountain-pen text that sits on the grid, highlighters that start light and pool at the end, hand-drawn underlines and outlines, pencil marks, hanko stamps, washi tape, sticky notes and planner pieces.

The CSS (about 14 KB gzipped) works on its own. An optional script (about 28 KB gzipped) adds the ink textures, draws every shape at its element's real size, snaps text to the grid and times the draw-on animations.

## Install

```sh
npm install papertooth
```

```js
import 'papertooth/css';
import { init } from 'papertooth';

const kit = init({ pen: 'ink-ai', motion: 'scroll' });
```

Or from a CDN, with no build step:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/papertooth@0.3/dist/papertooth.min.css">
<script src="https://cdn.jsdelivr.net/npm/papertooth@0.3/dist/papertooth.min.js" defer data-pt-auto></script>
```

`data-pt-auto` starts the script on load. It accepts options as JSON: `data-pt-auto='{"seed": 7}'`. The running instance is `window.Papertooth.kit`.

The module does nothing when it is imported, so it is safe to import during server rendering; call `init()` in the browser. With React or Next.js, use [`papertooth/react`](#react-and-nextjs). TypeScript types are included.

With Tailwind v4 or anything else that orders CSS in cascade layers, import `papertooth/layer.css` instead of `papertooth/css`: it is the same stylesheet inside `@layer papertooth`. Declare the order once, before both, so utilities such as `p-4` win over papertooth and papertooth wins over the base reset:

```css
@layer theme, base, papertooth, components, utilities;
```

Fonts are not bundled. The defaults are Courier Prime, Special Elite and Caveat from Google Fonts, plus Shippori Mincho B1 and Zen Maru Gothic for Japanese stamps. Change them with the `--pt-font-*` settings.

## Use

```html
<body class="pt-desk">
  <main class="pt-sheet" data-paper="cream" data-ruling="dot">
    <h1 class="pt-wobble">A typed heading</h1>
    <p>Text with a <mark class="pt-mark">highlight</mark> and a <a class="pt-link" href="#">link</a>.</p>
    <a class="pt-btn" href="#">Hire me</a>
    <button class="pt-btn pt-btn--outline" data-outline="circled">Read more</button>
    <div class="pt-rule" role="separator" data-rule="brush"></div>
  </main>
</body>
```

| Component | Markup | Options |
| --- | --- | --- |
| Sheet | `.pt-sheet` | `data-paper` (the stock): white, cream, washi, kraft, recycled, tracing; `data-ruling` (what is printed on it): dot, grid, graph, lined, blank |
| Highlighter button | `.pt-btn` | `data-hover`: pass (default), underline, circle, none; `data-hl`: swipe, flick, double, low, dry, scribble; `data-color`: yellow, pink, green, orange, blue; `data-size`: fine, broad |
| Outlined button | `.pt-btn.pt-btn--outline` | `data-outline`: sketch, double, broken, circled, corners, brackets, parens, braces, angles, kagi, lenticular; `data-tool` |
| Inline highlight | `mark.pt-mark` | `data-hl`, `data-color`, `data-size`: fine, broad |
| Link | `a.pt-link` | `data-ul`: wobble, slant, double, swash, marker, wave, hl. `.pt-links-mix` on a container mixes them; `data-tool`; `data-hover`: second (default), underline, circle, none |
| Separator | `.pt-rule` | `data-rule`: wobble, double, dashes, brush, coil, scrawl, short, stars; `data-tool` |
| Mark on text | `span.pt-anno` | `data-anno`: circle, box, strike, cross, under, hatch, hanamaru; `data-tool` (default: the marking pencil) |
| Stamp | `.pt-stamp`, `.pt-stamp--box`, `.pt-stamp--round` | `data-ink`: red, vermilion, blue, green, pink, brown; `--pt-rot`. The playground has picture stamps (cloud, paw, daruma, Fuji, sun, thanks, tea) and a name seal with your own text to copy |
| Approval boxes | `.pt-approval` | 承認 / 確認 / 作成 columns |
| Tape | `.pt-tape` | `data-tape`: masking, kraft, stripes, dots, gingham, seigaiha, clear |
| Sticky note | `.pt-sticky > .pt-sticky__paper` | `data-color`: yellow, pink, mint, blue, orange; `data-sticky`: flat, lifted, pad, stack; `data-ratio`: square, wide, tall, small, strip (or `--pt-note-w`, `--pt-note-h`) |
| Film flag, index tab | `.pt-flag`, `.pt-tabs > .pt-tab` | `data-color` |
| Card, clip | `.pt-card`, `.pt-clip` | |
| Torn memo, ticket | `.pt-torn`, `.pt-ticket` | |
| Planner | `.pt-dayhead`, `.pt-week`, `.pt-habits` | `data-today` fills in today |
| Forms | `.pt-check`, `.pt-radio`, `.pt-field` > `.pt-field__label` + `.pt-input` (input or textarea), `.pt-todo` | native controls stay underneath; `data-tool` on the tick; on a to-do list `data-strike`: line, double, scribble, under (with any `data-ul`), none |
| Ink sample | `.pt-swatch` | `data-tool`: fountain, ballpoint, pencil; `--pt-swatch` |
| Frame | `figure.pt-photo` | `data-mount`: polaroid, corners, or a `.pt-tape` inside; `--pt-photo-w`, `--pt-photo-ratio` |
| Postage frame | `.pt-postage` inside `.pt-lift` | `--pt-perf` |
| Label tape | `.pt-label` (printed, laminated), `.pt-label--emboss` (punched vinyl) | `data-color` |
| Bullet journal | `ul.pt-bujo > li` | `data-sign`: task, done, migrated, scheduled, event, note, priority |
| Progress | `.pt-progress` | `--pt-value` (0 to 1) or `aria-valuenow`; `data-shape`: bar, boxes, circles, ring, tally, sei (正); `data-style` (the fill): highlight, pencil, hatch, cross, scribble, stipple; `data-tool`; `data-label` |
| Lithograph | `img.pt-litho` | `data-litho`: mono, duo, tri; `--pt-litho-ink`, `--pt-litho-ink2`, `--pt-litho-blue`, `--pt-litho-red`, `--pt-litho-yellow`, `--pt-litho-grain`, `--pt-litho-size`, `--pt-litho-contrast`, `--pt-litho-darken`, `--pt-litho-offset` |
| Printer | `img.pt-print` | `data-printer`: gameboy, thermal; `data-palette`: screen; `data-dither`: bayer, atkinson, floyd, threshold; `data-dots`; `--pt-print-ink`, `--pt-print-contrast`, `--pt-print-brightness`, `--pt-print-wear` |
| Diagram | `pre.pt-diagram` with Mermaid source | flowchart/graph, pie, xychart-beta; `data-fill`: wash, highlight, pencil, hatch, cross, scribble, stipple; `data-tool` (or `type` for typed labels) |
| Text tools | `.pt-type`, `.pt-pen-text`, `.pt-pencil-text`, `.pt-note`, `.pt-typewriter` | |

A `.pt-sheet` is a sheet lying on a desk (`.pt-desk`), so it has a shadow and the edge of a second sheet under it. For a website where the page itself is the paper, use `.pt-sheet--page`: it fills the window with no desk or shadow, and keeps the content to `--pt-page-width` (720px), centred on whole grid cells. `.pt-sheet--flat` keeps the sheet's size but drops the shadow.

The desk turns dark with the system's dark mode while the paper stays paper; force it with `.pt-night` or `.pt-day` on `<html>`. Anything written straight on the dark desk (text, links, highlights, ticks, rules, stamps, tape) switches to light night inks (`--pt-night-pen`, `--pt-night-pencil`, `--pt-night-graphite`, `--pt-night-ballpoint`) and text under a highlighter stays dark (`--pt-night-hl-ink`). Paper lying on the desk (sheets, cards, notes, tickets, photos, labels, flags, tabs) keeps its day inks. The script redraws when the system switches between light and dark; call `kit.refresh()` after toggling `.pt-night` yourself. Pages print without the desk, shadows or tabs.

Selected text gets a clean highlighter colour, and the ink texture steps aside while text is selected.

Switches on any ancestor: `.pt-mode-hand` (handwritten instead of typed), `.pt-texture-light`, `.pt-texture-off`, `.pt-dry` (no smudge), `.pt-guides` (show baselines).

What is on screen when the page opens is shown straight away; everything else draws itself on as it scrolls into view, block by block. `drawOnLoad: true` draws the first screen on as well, `motion: 'none'` turns drawing on off, `data-pt-draw="off"` keeps one part of the page still, and `data-pt-draw` on a block groups its marks so they draw in turn. Add `data-seed` to any drawn element to get the same shape on every visit.

## Colours

The fountain pen inks are named after traditional Japanese colours (伝統色, dentō-shoku), each a token: `--pt-ink-sumi` 墨, `blueblack`, `kon` 紺, `ai` 藍, `konpeki` 紺碧, `tsuyukusa` 露草, `asagi` 浅葱, `hisoku` 秘色, `wakatake` 若竹, `matcha` 抹茶, `uguisu` 鶯, `yamabuki` 山吹, `kaki` 柿, `shu` 朱, `beni` 紅, `sakura` 桜, `fuji` 藤 (wisteria), `edomurasaki` 江戸紫, `tobi` 鳶, `kakishibu` 柿渋 and `nezumi` 鼠. The same inks fill the brush pen (`--pt-brush`) and felt marker (`--pt-marker`). Ballpoints: `--pt-bp-blue`, `black`, `red`, `green`. Graphite: `--pt-pencil-2h`, `hb`, `2b`, `6b`. Coloured pencils: `--pt-pencil-red`, `vermilion`, `yellow`, `green`, `sky`, `blue`, `violet`, `pink`, `brown`, `black`. Ribbons, highlighters, stamp pads and papers have their own tokens too. The whole scheme is also exported as `PALETTE` from the script. Choose what is in use with `--pt-pen`, `--pt-ribbon`, `--pt-pencil` and `--pt-hl`.

Anything drawn takes `data-tool`: `pen` (fountain pen), `ballpoint`, `brush`, `marker`, `graphite` or `pencil` (coloured pencil). Each instrument sets the ink, the weight and the character of the line: a ballpoint skips now and then, a brush swells, a marker is see-through, pencils catch the paper's tooth. Change an instrument's ink with `--pt-ballpoint`, `--pt-brush`, `--pt-marker`, `--pt-graphite-c` or `--pt-pen`.

Nothing is rotated by default. Set `--pt-rot` on any stamp, tape, note, card, photo or label to put it at an angle; `--pt-tilt` scales every angle at once.

Image effects (lithograph, printer) apply to a plain `<img>`; frames (instant print, photo corners, tape, postage stamp) are separate, so any effect can go in any frame. The printer reads pixels, so pictures must come from the same site or be served with CORS headers (the script requests pictures from other sites with `crossOrigin="anonymous"`). A picture it cannot read stays in plain greyscale and gets the attribute `data-pt-blocked`. Diagrams follow the ink and font variables, so changing the pen restyles them without drawing them again.

## Settings

Every effect is a custom property. Put them on `:root`, on a sheet, or on one element.

| Property | Default | |
| --- | --- | --- |
| `--pt-grid` | `24px` | Dot pitch and line height |
| `--pt-sheet-width`, `--pt-sheet-pad` | `720px`, two cells | Sheet size |
| `--pt-paper`, `--pt-desk`, `--pt-desk-ink` | `#fcfbf7`, `#cdcbc5`, `#3a3c42` | Paper, desk, and text written straight on the desk (light at night) |
| `--pt-dot`, `--pt-dot-size`, `--pt-line` | | Ruling |
| `--pt-grain` | `.28` | Paper grain, 0 to 1 |
| `--pt-pen`, `--pt-pencil`, `--pt-ribbon`, `--pt-hl` | indigo, red pencil, black, yellow | Writing tools: pen ink, marking pencil, typewriter ribbon, highlighter |
| `--pt-wobble` | `1` | Letter wobble, 0 to 2 |
| `--pt-tilt` | `1` | How crooked things sit, 0 to 2 |
| `--pt-stamp-opacity` | `.86` | Stamp ink |
| `--pt-draw`, `--pt-ease` | `.75s` | Draw-on timing |
| `--pt-font-type`, `--pt-font-hand`, `--pt-font-type-head`, `--pt-font-jp`, `--pt-font-jp-round` | | Fonts |
| `--pt-s-body`, `--pt-s-small`, `--pt-s-h1`, `--pt-s-h2` | `20px`, `16px`, `36px`, `26px` | Sizes |
| `--pt-page-width` | `720px` | Content width on a `.pt-sheet--page` |

The colour tokens are listed under [Colours](#colours).

## Script

```js
const kit = init({
  root: document.body,   // where to look
  seed: null,            // a number makes every drawing repeatable
  filters: true,         // inject the texture filters
  filterParams: {
    text: { density: .7 }, head: { rough: 1, density: .8 },
    graphite: { tooth: 2.4, rough: .9 }, stamp: { wear: .55, rough: 1.3, edge: .5, mottle: .5 },
    smudge: { drag: 4.2, blur: 3.4, strength: .78 }, smear: { drag: 7, blur: 4.5, strength: .7 },
    typewriter: { spread: .6, rough: 1.2, uneven: .7, speckle: .5 }
  },
  snap: true,            // put text on the grid
  lazy: true,            // draw shapes only near the screen
  lazyMargin: '600px',
  motion: 'scroll',      // 'scroll', 'load' or 'none'
  drawSelector: '[data-pt-draw]', // blocks that draw on as a group
  drawAll: true,         // draw every mark as it comes into view, not only inside [data-pt-draw]
  drawOnLoad: false,     // also draw on what is on screen when the page opens
  drawInserted: true,    // content added later draws on even when it lands on screen; false shows it drawn
  stagger: .12,          // seconds between marks drawing on in one block
  highlight: 'swipe',    // default highlighter
  outline: 'sketch',     // default outline
  wobbleMax: 400,        // letters split per .pt-wobble element
  observe: true,         // enhance elements added later
  today: true,           // fill planner pieces marked data-today
  pen: null, pencil: null, ribbon: null, highlighter: null
});

kit.setPen('ink-beni');          // a token name or any CSS colour; redraws what the pen drew
kit.setPencil('pencil-2b');
kit.setRibbon('ribbon-blue');
kit.setHighlighter('#ffc06a');
kit.setTypewriter({ spread: .8 });
kit.setFilters({ stamp: { wear: .8 } });
kit.refresh();                   // after changing writing mode, layout or ink tokens in CSS
kit.replay();                    // draw everything on again
kit.settle(el);                  // show el's content as drawn, without drawing it on (after a route change)
kit.destroy();                   // stop observing; what is drawn stays drawn
```

Also exported:

- `VERSION`, `DEFAULTS` (the options above), `PALETTE` (every colour as data), `FILTER_DEFAULTS`
- `renderDiagram(source, options)`: a diagram as an SVG string
- `filtersMarkup(params)`, `typewriterFilter(id, params)`, `lithoFilter(id, params)`, `smearColour(ink, highlighter)`
- `setPen`, `setPencil`, `setRibbon`, `setHighlighter` (colour, target): change the ink on any element without a kit. They do not redraw what is already drawn; the kit's methods do.
- `dayHead(el, date, { locale })`, `week(el, date, { locale, weekStart })`: fill planner pieces with any date, in any language, from any first day of the week (0 = Sunday … 6 = Saturday; by default the locale's own when the browser knows it, Monday otherwise)
- `weekDates(date, weekStart)`, `dayParts(date, locale)`, `firstDayOf(locale)`, `sameDay(a, b)`, `isoWeek(date)`: the same calendar sums with no DOM, for a server or your own components

### Without the script

Everything still renders, with a fixed version of each shape. To get the textures too, paste `dist/papertooth-filters.svg` into the page and add `class="pt-filters"` to `<html>`.

## React and Next.js

The script adds markup to a few elements: a label inside a button, one span per letter in a wobbly heading, the svg a circle is drawn in. React owns those elements, so when their text changes it replaces their contents and that markup is lost. `papertooth/react` has components that render the markup themselves, and a hook that starts and stops the script. React 18 or later; nothing extra is installed if you don't use it.

```tsx
// app/layout.tsx
import 'papertooth/css';
import { Papertooth } from 'papertooth/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="pt-desk">
        <Papertooth seed={7} />
        {children}
      </body>
    </html>
  );
}
```

`<Papertooth />` takes the same options as `init()` and renders nothing. `papertooth/react` is marked `"use client"`, so it can be imported from server components such as a layout. In a component of your own, `const kit = usePapertooth(options)` does the same and returns the kit once it is running.

```tsx
import { Btn, Mark, Anno, Wobble, Check } from 'papertooth/react';

<main className="pt-sheet">
  <Wobble as="h1">{title}</Wobble>
  <p>Ship the <Mark hl="dry">{feature}</Mark> and <Anno anno="box" tool="pen">review</Anno> it.</p>
  <Btn href="/start">Get started</Btn>
  <Btn outline="circled" hover="circle" onClick={more}>Read more</Btn>
  <Check checked={done} onChange={e => setDone(e.target.checked)}>Write the announcement</Check>
</main>
```

| Component | Renders | Props |
| --- | --- | --- |
| `Btn` | `.pt-btn`: an `<a>` with `href`, otherwise a `<button>` (or `as`) | `outline` (true or a style), `hl`, `color`, `size`, `hover`, `tool` |
| `Mark` | `mark.pt-mark` | `hl`, `color`, `size` |
| `Anno` | `span.pt-anno` | `anno` (default circle), `tool` |
| `Wobble` | `.pt-wobble`, as any element (`as`) | `seed`; text, including `Hello {name}`, is split into letters (read out whole by screen readers); anything else is passed through |
| `DayHead` | `.pt-dayhead` | `date`, `locale` (default `en-GB`), `weekLabel` |
| `Week` | `.pt-week` | `date`, `today`, `locale`, `weekStart`; `children` is a function that fills each day: `{day => <p>{tasks[day.index]}</p>}` |
| `Habits` | a habit tracker, cells placed for wide and narrow screens | `habits` (`[{ name, ink, done: [] }]`), `days`, `head`, `title`, `onToggle(habit, day, checked)` |
| `Habit` | one tracker cell, for your own layout | input props and `ref` go on the checkbox; give it an `aria-label` |
| `Check` | `label.pt-check` (or `.pt-radio` with `type="radio"`) | `tool`, `seed`; `className` and `style` go on the label, every other prop and the `ref` on the input |

Everything else is plain classes: `<div className="pt-sticky">`, `<span className="pt-stamp">` and so on need no component. Two cases to know about: a `pre.pt-diagram` is replaced by its drawing, so give it `key={source}` if the source can change; and for planner pieces use `DayHead`, `Week` and `Habits` rather than `data-today`, which writes the dates in after React has rendered. Their defaults (English, Monday first) are the same on the server and in every browser; when you pass a locale, also pass `weekStart`, and pass `date` (and `today`) from the server if it runs in another time zone, so hydration matches. Shapes are seeded from React's `useId`, so the server and the browser draw the same thing and hydration matches.

In an app, pass `drawInserted={false}` to `<Papertooth>` so a page or tab swapped in on screen appears already drawn instead of drawing itself on each time; content that scrolls into view still draws on. `kit.settle(element)` does the same for one part of the page. The script keeps its own state in `data-pt-*` attributes, never in classes, so changing an element's `className` does not undo it, and it starts cleanly again after `destroy()` (a remount, or React's StrictMode in development).

For Vue, Svelte or Angular, the same rule applies: for elements whose content changes, write the markup the script would add (`.pt-btn__label` and `.pt-btn__smear` inside a button, `.pt-mark__ink` inside a mark, an empty `svg.pt-anno__ink` inside an annotation, `data-pt-ready` on a checkbox label that already has its drawn box) and it will paint that markup in place. Start the script with `init()` when the page mounts and call `kit.destroy()` when it unmounts.

## Performance

Load the script with `defer` so it never holds up the first paint, and load the fonts without blocking (`<link rel="preload" as="style" onload="this.rel='stylesheet'">`, or self-host them). Most of the extra work on a page comes from drawing marks on. By default only what scrolls into view is drawn on, so the first screen costs no more than a plain page; `motion: 'none'` turns drawing on off entirely, and visitors who ask for reduced motion never get it.

- Shapes are drawn only when they come near the screen and redrawn only when their size or style changes.
- Each frame measures everything first and writes everything after, so the page lays out once.
- Snapping uses `translate`, which moves text without triggering layout.
- The script's own DOM changes are ignored by its mutation observer, so it goes fully idle after loading.
- Animations are pure CSS and stop for people who prefer reduced motion.
- Textures are SVG filters applied to text only. On very long pages, use `.pt-texture-light`, or `.pt-lazy` on sections so the browser can skip them off screen.

## Browser support

Current Chrome, Edge, Safari and Firefox. Uses CSS masks, `color-mix()`, `:is()`, the `translate` property and `round()` (with a fallback).

## Develop

```sh
npm install
npm run build     # dist/ and docs/
npm run dev       # build, then serve the docs page on http://localhost:4173
npm test          # browser tests (Playwright, with the installed Chrome)
```

Changes are listed in [CHANGELOG.md](CHANGELOG.md).

`dist/` is committed so the files can be used straight from GitHub; rebuild before committing a change to `src/`. Bump the version in both `package.json` and `src/js/index.js` (the build checks they match).

## Licence

[MIT](LICENSE) © 2026 Thomas Budin.

The fonts named above are not part of the package; each comes with its own licence (SIL Open Font License, or Apache 2.0 for Special Elite).
