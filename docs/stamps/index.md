# Stamps

*papertooth · Marks*

Rubber stamps with real ink: heavier at the rim, uneven in the middle, with small gaps where the paper did not take it.

```html
<span class="pt-stamp pt-stamp--box">Approved</span>

// texture, for every stamp on the page
kit.setFilters({ stamp: { wear: 0.55, edge: 0.5, mottle: 0.5 } });
```

## Download the pictures

Each picture stamp is also a file of its own: one ink (it takes the colour around it, or black as an image) with real holes, so it sits on any paper. In a project they are `papertooth/stamps/frog.svg` and so on, and the stylesheet with all of them is optional (`papertooth/css/pictures`).

[ Tick](https://tbudin.github.io/papertooth/stamps/tick.svg)[ Star](https://tbudin.github.io/papertooth/stamps/star.svg)[ Heart](https://tbudin.github.io/papertooth/stamps/heart.svg)[ Arrow](https://tbudin.github.io/papertooth/stamps/arrow.svg)[ Cat 猫](https://tbudin.github.io/papertooth/stamps/cat.svg)[ Frog 蛙](https://tbudin.github.io/papertooth/stamps/frog.svg)[ Bear 熊](https://tbudin.github.io/papertooth/stamps/bear.svg)[ Tiger 虎](https://tbudin.github.io/papertooth/stamps/tiger.svg)[ Rabbit 兎](https://tbudin.github.io/papertooth/stamps/rabbit.svg)[ Tanuki 狸](https://tbudin.github.io/papertooth/stamps/tanuki.svg)[ Owl 梟](https://tbudin.github.io/papertooth/stamps/owl.svg)[ Cat paw 肉球](https://tbudin.github.io/papertooth/stamps/paw.svg)[ Onigiri](https://tbudin.github.io/papertooth/stamps/onigiri.svg)[ Sakura](https://tbudin.github.io/papertooth/stamps/sakura.svg)[ Smiling cloud](https://tbudin.github.io/papertooth/stamps/cloud.svg)[ Smiling sun](https://tbudin.github.io/papertooth/stamps/sun.svg)[ Daruma](https://tbudin.github.io/papertooth/stamps/daruma.svg)[ Mount Fuji](https://tbudin.github.io/papertooth/stamps/fuji.svg)

## Approval boxes

The 承認 / 確認 / 作成 boxes found on Japanese office documents.

承認

確認

作成

## Parameters

| Setting | Default | Values |
|---|---|---|
| `.pt-stamp--box, .pt-stamp--round` |  | Text stamps. Any inline SVG drawn in currentColor works too |
| `data-pic` |  | A picture stamp, no script needed: tick, star, heart, arrow, cat, frog, bear, tiger, rabbit, tanuki, owl, paw, onigiri, sakura, cloud, sun, daruma, fuji. Give it role="img" and an aria-label; size with --pt-pic-size (60px) |
| `data-ink` | red | red, vermilion, blue, green, pink, brown |
| `--pt-rot` | 0deg | Rotation |
| `--pt-stamp-opacity` | .86 | How much ink |
| `kit.setFilters({ stamp })` | { wear: .55, edge: .5, mottle: .5, rough: 1.3 } | Texture |

---
https://tbudin.github.io/papertooth/stamps/ · papertooth 0.5.2 · MIT
