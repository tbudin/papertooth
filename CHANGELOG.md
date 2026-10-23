# Changelog

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## Unreleased

### Added
- React planner components: `<DayHead>`, `<Week>` (with `children` to fill each day), `<Habit>` and `<Habits>`. They render everything themselves, so nothing is written into React's DOM afterwards.
- Date helpers with no DOM, in any locale and from any first day of the week: `weekDates`, `firstDayOf`, `dayParts`, `sameDay` (and `isoWeek`, as before).
- `dayHead()` and `week()` take `{ locale }` and `{ locale, weekStart }`.
- `papertooth/layer.css`: the stylesheet inside `@layer papertooth`, so utility classes (Tailwind v4) can win over it.
- Browser tests (Playwright) and a GitHub Actions workflow that also checks `dist/` matches the source.

### Changed
- The weekend in `.pt-week` is coloured by `data-day` (0 = Sunday … 6 = Saturday), so it is right wherever the week starts. Markup without `data-day` is still read as Monday first.

## 0.3.1 - 2026-10-23

Fixes from a review by a Next.js app that re-renders a lot.

### Added
- `drawInserted` option: `false` shows content added on screen (a route or tab change) as already drawn.
- `kit.settle(element)` does the same for one part of the page.

### Changed
- The script keeps its state in `data-pt-*` attributes instead of classes (`is-drawn`, `is-painted`, `is-ready`, `pt-selecting`, `pt-motion` and others), so a framework changing `className` no longer undoes it. `class="pt-filters"` still works for pages that paste the filters themselves.
- A picture the printer cannot read gets `data-pt-blocked` instead of the `pt-print--blocked` class.

### Fixed
- `init()` after `destroy()` (a remount, React StrictMode) left blocks below the fold invisible.
- `<Wobble>` did not split `Hello {name}`; screen readers now get the whole text and the letters are hidden from them.
- `<Btn>` rendered its children twice (duplicate ids, duplicated state); the smear is now text only.
- React components forward refs on React 18 (`<Check>` and `<Habit>` to their input).

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
