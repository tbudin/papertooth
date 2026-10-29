# Inks and colours

*papertooth · Getting started*

Every ink, pencil, ribbon, highlighter, stamp pad and paper in Papertooth, in one place. The fountain pen inks are named after traditional Japanese colours (伝統色, dentō-shoku). Click any of them to use it across the site, then copy the settings.

## Notes from the week

A paragraph in the current ribbon, with a [link in pen](#) and a highlighted phrase.

A line written in fountain pen.

A note in coloured pencil , graphite , ballpoint and brush pen .

[Fountain pen, brush pen and marker](https://tbudin.github.io/papertooth/colours/)[Ballpoint](https://tbudin.github.io/papertooth/colours/)[Graphite pencil](https://tbudin.github.io/papertooth/colours/)[Coloured pencil](https://tbudin.github.io/papertooth/colours/)[Typewriter ribbon](https://tbudin.github.io/papertooth/colours/)[Highlighter](https://tbudin.github.io/papertooth/colours/)[Stamp pad](https://tbudin.github.io/papertooth/colours/)[Paper](https://tbudin.github.io/papertooth/colours/)

## Fountain pen, brush pen and marker 21

The same bottled inks fill all three. Choose which one a click sets:

## Ballpoint 4

## Graphite pencil 4

Hatching, shading and anything drawn in graphite.

## Coloured pencil 10

Notes and marks on text.

## Typewriter ribbon 4

Typed text.

## Highlighter 5

## Stamp pad 6

Set on each stamp with data-ink.

印 Shuniku red 朱肉 seal paste `data-ink="red"` #c0312b

印 Vermilion 朱 `data-ink="vermilion"` #d23c22

印 Blue pad `data-ink="blue"` #2a4fa8

印 Green pad `data-ink="green"` #2f7d4a

印 Pink pad `data-ink="pink"` #e0558a

印 Brown pad `data-ink="brown"` #8a5a3c

## Paper 6

Set on each sheet with data-paper.

## In your stylesheet

```
:root {
  --pt-pen: var(--pt-ink-ai);          /* fountain pen */
  --pt-brush: var(--pt-ink-sumi);      /* brush pen */
  --pt-marker: var(--pt-ink-sumi);     /* felt marker */
  --pt-ballpoint: var(--pt-bp-blue);
  --pt-graphite-c: var(--pt-pencil-hb);
  --pt-pencil: var(--pt-pencil-red);    /* coloured pencil */
  --pt-ribbon: var(--pt-ribbon-black);    /* typed text */
  --pt-hl: var(--pt-hl-yellow);            /* highlighter */
}

// pens, pencils and ribbons also recolour shapes already drawn, so set them from script too
kit.setPen('ink-ai'); kit.setPencil('pencil-red'); kit.setRibbon('ribbon-black');
```

The same list is exported as `PALETTE` from the script, if you need the names and values in JavaScript.

---
https://tbudin.github.io/papertooth/colours/ · papertooth 0.5.2 · MIT
