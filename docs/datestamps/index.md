# Date stamps

*papertooth · Marks*

The calendar stamps of Japanese stationery: a week strip to fill in, a month calendar, a year of months, or a single row. Fine printed lines in one ink, with today circled and the days gone by crossed out in pencil.

## Parameters

| Setting | Default | Values |
|---|---|---|
| `data-unit` | week | week (a strip to fill in), month (a calendar), year (its months), day (1 to 31 in a row) |
| `data-variant` |  | bar: a single row for week, month or year; wide: a month as one long row of days |
| `data-rows` | 1 | Week strip and wide month: rows to fill in |
| `data-title` |  | Week strip: a title line on top (empty to write in, or printed text) |
| `data-date` | today | The day to mark, as 2026-10-21 |
| `data-mark` | circle | How today is marked: circle, box, highlight, none |
| `data-past` | none | How the past is marked: x, strike, none |
| `data-locale` | the page’s lang | Labels come from Intl in this language |
| `data-week-start` | the locale’s | 0 = Sunday … 6 = Saturday |
| `data-years, data-from` | 5, around today | Year bar |
| `data-mark-tool, data-past-tool` | pencil, graphite | The instruments the marks are drawn with |
| `data-ink` | red | red, vermilion, blue, green, pink, brown |
| `<DateStamp>` |  | The same in papertooth/react |

---
https://tbudin.github.io/papertooth/datestamps/ · papertooth 0.5.2 · MIT
