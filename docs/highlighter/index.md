# Highlighter

*papertooth · Marks*

A felt-tip swipe. Most styles start light where the nib lands and fill in towards the end; a flick and a dry marker start heavy and run out. On fresh ink the highlighter drags a little of the ink with it.

## Parameters

| Setting | Default | Values |
|---|---|---|
| `data-hl` | swipe | swipe, flick, double, low, dry, scribble |
| `data-size` | regular | fine, broad |
| `data-color` | yellow | yellow, pink, green, orange, blue |
| `data-hover` | underline | underline (in pen), pass (a second highlighter pass), circle, none |
| `aria-pressed, aria-current, aria-expanded, aria-selected` |  | The button is on: its hover mark stays drawn (an open <details> too) |
| `:disabled, aria-disabled` |  | Faded, with no hover |
| `.pt-dry` |  | No fresh-ink smudge, on any ancestor |
| `--pt-hl` |  | Any colour |
| `kit.setFilters({ smudge })` | { drag: 4.2, blur: 3.4, strength: .78 } | How far and how strongly the ink drags |

---
https://tbudin.github.io/papertooth/highlighter/ · papertooth 0.5.2 · MIT
