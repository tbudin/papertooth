# Habit tracker

*papertooth · Planner*

Tap a circle and it fills in with a quick scribble. Each habit has its own ink.

```html
<div class="pt-habits" style="--pt-days: 14">
  <div class="pt-habits__row" style="--pt-hb: var(--pt-ink-ai)">
    <span class="pt-habits__name">Write 500 words</span>
    <label class="pt-habit"><input type="checkbox" aria-label="Write 500 words, day 1"></label>
    <!-- one label per day -->
  </div>
</div>
```

## Parameters

| Setting | Default | Values |
|---|---|---|
| `--pt-days` | 14 | Columns |
| `--pt-hb` | pen | Ink for a row |

---
https://tbudin.github.io/papertooth/habits/ · papertooth 0.5.2 · MIT
