# Changelog

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## 0.4.0 - 2026-10-23

### Added
- Picture stamps in the stylesheet, no script needed: `<span class="pt-stamp" data-pic="frog">`. Six new animals (frog, bear, tiger, rabbit, tanuki, owl) join tick, star, heart, arrow, cat, paw, daruma, Fuji, sakura, onigiri, cloud and sun.
- Date stamps, `.pt-datestamp` and `<DateStamp>`, in the manner of Japanese stationery stamps: a week strip to fill in (with rows and a title line), a month calendar with the 1st on its weekday and a month selector, a year of months, and single-row bars. Fine printed lines in one ink, labels in any language through Intl; today circled, boxed or highlighted, the days gone by crossed out or struck through in pencil.
- Per-part stylesheets: `papertooth/css/base` and then only the parts a page uses (`highlight`, `marks`, `pictures`, `planner`…), in any order. `papertooth/css` is still everything.
- Picture stamps as files of their own: `papertooth/stamps/frog.svg` and so on (one ink, real holes), also downloadable from the docs site.
- `papertooth/diagram` for `renderDiagram` and `kindOf`.
- A wide month stamp, `data-variant="wide"` (`variant="wide"`): the whole month in one row, each day under its weekday, with rows to fill in like a habit tracker.
- Every state of a button and a link:
  - pressed down (`:active`), and on (`aria-pressed`, `aria-selected`, `aria-expanded`, `aria-current` or an open `<details>`), which keeps the hover mark drawn;
  - disabled (`disabled` or `aria-disabled="true"`);
  - visited links (`--pt-visited`);
  - reduced motion, and a plain underline and border in high-contrast mode;
  - `button.pt-link` and `summary` as buttons or links.
- An `x` mark on text (`data-anno="x"`).
- `data-wrap` on a mark (`wrap` on `<Anno>`) lets a longer phrase wrap: a strike, underline or scribble follows each line, a circle, box or hanamaru goes around the whole phrase.
- React planner components: `<DayHead>`, `<Week>` (with `children` to fill each day), `<Habit>` and `<Habits>`. They render everything themselves, so nothing is written into React's DOM afterwards.
- Date helpers with no DOM, in any locale and from any first day of the week: `weekDates`, `firstDayOf`, `dayParts`, `sameDay`, `stampCells`, `stampLabel` (and `isoWeek`, as before). `dayHead()` and `week()` take `{ locale }` and `{ locale, weekStart }`.
- `papertooth/shapes` and `papertooth/tokens`: the shape generators, picture stamps and colours with no DOM, for React Native, canvas or a server.
- `papertooth/layer.css`: the stylesheet inside `@layer papertooth`, so utility classes (Tailwind v4) can win over it.
- Browser tests (Playwright) and CI. Releases are published from a version tag by a GitHub workflow with npm trusted publishing, and copied to GitHub Packages as `@tbudin/papertooth`.

### Changed
- As a module, the script fetches the code for diagrams and image effects only when a page has one: about 23 KB gzipped up front instead of 30. The `<script>` build is still one file with everything.
- `renderDiagram` moved from `papertooth` to `papertooth/diagram` (it stays on `window.Papertooth` in the `<script>` build).
- White paper is a neutral white (`#fefefe`) with a grey grain at `.1`, so it reads white on a whole screen; cream and kraft keep the warm grain (`--pt-grain-warm-image`).
- To-do lists, bullet journals and anything marked `data-pt-ruled` snap to the grid as one block, so rows an app sizes and rules itself keep their rhythm.
- The sheet's text styles, headings included, weigh as little as one class (through `:where()`), so an app's own class wins over them when it loads later. Within papertooth, the per-part stylesheets can load in any order.
- `.pt-sheet--page` is an ordinary block instead of a column with a grid line of gap between everything on it. Its blocks of text keep that line between them, but an app's header, tabs and views no longer get it added on top of their own spacing.
- A `<section>` on a sheet is no longer a flex column. It puts a grid line between its blocks of text with margins, which an app can override and which merge with the app's own margins instead of adding to them. Before, every section in an app became a flex column, which shrank centred children with a `max-width` and stacked its gap on the app's margins.
- Hovering a highlighter button underlines it in pen instead of adding a second highlighter pass, which is now `data-hover="pass"`. Outlined buttons still bring out the highlighter.
- Hover marks on buttons and links are drawn only where a pointer can hover, so a tap on a phone no longer leaves one stuck; a tap draws it while the finger is down.
- A highlighted link (`data-ul="hl"`) is highlighted from the start, and hovering draws a pen underline under it instead of more highlighter.
- The weekend in `.pt-week` is coloured by `data-day` (0 = Sunday … 6 = Saturday), so it is right wherever the week starts. Markup without `data-day` is still read as Monday first.

### Fixed
- On `.pt-sheet--page`, a `--pt-sheet-pad` smaller than a grid cell rounded the side margins to nothing on phones; they are now at least one cell.
- A to-do that wraps onto several lines is struck through line by line and takes as many grid lines as it needs, instead of overflowing into the next one. The strike now sits on an inline `.pt-check__ink` inside `.pt-check__text` (the script and `<Check>` add it).
- A sticky note in a flex row or grid that stretches its items kept its shadows at the bottom of the stretched box, below the paper.

## 0.3.1 - 2026-10-23

### Added
- `drawInserted` option: `false` shows content added on screen (a route or tab change) as already drawn. `kit.settle(element)` does the same for one part of the page.

### Changed
- The script keeps its state in `data-pt-*` attributes instead of classes (`is-drawn`, `is-painted`, `is-ready`, `pt-selecting`, `pt-motion` and others), so a framework changing `className` no longer undoes it. `class="pt-filters"` still works for pages that paste the filters themselves.
- A picture the printer cannot read gets `data-pt-blocked` instead of the `pt-print--blocked` class.

### Fixed
- `init()` after `destroy()` (a remount, React StrictMode) left blocks below the fold invisible.
- `<Wobble>` did not split `Hello {name}`; screen readers now get the whole text and the letters are hidden from them.
- `<Btn>` rendered its children twice (duplicate ids, duplicated state); the smear is now text only.
- React components forward refs on React 18 (`<Check>` to its input).

## 0.3.0 - 2026-10-23

### Added
- `papertooth/react`: `<Btn>`, `<Mark>`, `<Anno>`, `<Wobble>` and `<Check>` render the markup the script would add, so React re-renders keep it; `usePapertooth()` and `<Papertooth />` start and stop the script. Marked `"use client"` for Next.js.
- TypeScript types for the script and the React components.
- A React and Next.js section in the README.

### Changed
- CDN snippets point at `@0.3`.

## 0.2.2 - 2026-10-22

### Added
- Night inks: on the dark desk, links, highlights, ticks, rules, stamps and tape written straight on the desk switch to light inks (`--pt-night-pen`, `--pt-night-pencil`, `--pt-night-graphite`, `--pt-night-ballpoint`, `--pt-night-hl-ink`); paper keeps its day inks.
- Text on the desk takes `--pt-desk-ink`.
- The script redraws when the system switches between light and dark.

### Fixed
- Buttons no longer stretch in grid or column layouts, so their highlight fits the label.
- The draw-on wipe releases its clip when it ends, so nothing drawn past an element's box stays cut off.
- Checkbox outlines, bullet-journal signs and the progress label follow the text colour.

## 0.2.1 - 2026-10-22

### Fixed
- A progress bar's label was cut off after it drew on.
- The highlight on a chosen colour swatch ran past its name.

## 0.2.0 - 2026-10-22

First public release.
