# Theming

*papertooth · Getting started*

Every effect is a CSS custom property. Set the grid, the paper and the fonts here and the whole site follows; copy the result into your own stylesheet. Inks and colours have their own page.

```html
:root {
  --pt-grid: 24px;
  --pt-dot-size: 0.8px;
  --pt-dot: rgba(88, 86, 80, 0.26);
  --pt-grain: 0.1;
  --pt-wobble: 1;
  --pt-font-type: "Courier Prime", monospace;
  --pt-font-hand: "Caveat", cursive;
}
```

Pens, pencils, ribbons and highlighters: see [Inks and colours](https://tbudin.github.io/papertooth/colours/).

## Parameters

| Setting | Default | Values |
|---|---|---|
| `--pt-grid` | 24px | Dot pitch and line height. Text snaps to it. |
| `--pt-sheet-width` | 720px | Widest the sheet gets, rounded down to whole cells. |
| `--pt-paper, --pt-desk` | #fefefe, #cdcbc5 | Paper and desk colours. |
| `--pt-dot, --pt-dot-size` | warm grey, .8px | Printed dots. |
| `--pt-line` | pale blue | Ruling on grid, graph and lined paper. |
| `--pt-grain` | .1 | Paper grain, 0 to 1. |
| `--pt-pen, --pt-pencil, --pt-ribbon` | indigo, red pencil, black | Current tools. |
| `--pt-hl` | yellow | Highlighter colour. |
| `--pt-wobble` | 1 | Letter wobble, 0 to 2. |
| `--pt-tilt` | 1 | Multiplies every --pt-rot, 0 to 2. |
| `--pt-draw, --pt-ease` | .75s | Drawing-on timing. |
| `--pt-font-type, -hand, -type-head, -jp` | Courier Prime, Caveat… | Fonts. |
| `--pt-s-body, -small, -h1, -h2` | 20, 16, 36, 26px | Type sizes. |

---
https://tbudin.github.io/papertooth/theming/ · papertooth 0.5.2 · MIT
