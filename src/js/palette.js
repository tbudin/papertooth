// The colour scheme, as data. Fountain pen inks also fill brush pens and felt markers.
// every ink, ribbon, pencil, highlighter, stamp pad and paper,
// with its CSS token and, for the Japanese inks, the traditional colour it is named after.
// [token, name, kanji, meaning, hex]
export const PALETTE = {
  inks: [
    ['ink-sumi', 'Sumi', '墨', 'ink-stick black', '#232429'],
    ['ink-blueblack', 'Blue-black', '', 'the classic office ink', '#263252'],
    ['ink-kon', 'Kon', '紺', 'navy', '#22305e'],
    ['ink-ai', 'Ai', '藍', 'indigo', '#213c6b'],
    ['ink-konpeki', 'Konpeki', '紺碧', 'deep sky blue', '#1f5a9e'],
    ['ink-tsuyukusa', 'Tsuyukusa', '露草', 'dayflower blue', '#2f6db5'],
    ['ink-asagi', 'Asagi', '浅葱', 'pale leek blue-green', '#12737e'],
    ['ink-hisoku', 'Hisoku', '秘色', 'celadon', '#3f7f77'],
    ['ink-wakatake', 'Wakatake', '若竹', 'young bamboo', '#3c7a4c'],
    ['ink-matcha', 'Matcha', '抹茶', 'powdered green tea', '#5d7334'],
    ['ink-uguisu', 'Uguisu', '鶯', 'bush warbler olive', '#6b6b2a'],
    ['ink-yamabuki', 'Yamabuki', '山吹', 'kerria gold', '#b9800f'],
    ['ink-kaki', 'Kaki', '柿', 'persimmon', '#c25a26'],
    ['ink-shu', 'Shu', '朱', 'vermilion', '#c13d25'],
    ['ink-beni', 'Beni', '紅', 'safflower red', '#a52a45'],
    ['ink-sakura', 'Sakura', '桜', 'cherry blossom', '#c2637f'],
    ['ink-fuji', 'Fuji', '藤', 'wisteria', '#6b5aa6'],
    ['ink-edomurasaki', 'Edo murasaki', '江戸紫', 'Edo purple', '#5b3f86'],
    ['ink-tobi', 'Tobi', '鳶', 'kite brown', '#714a36'],
    ['ink-kakishibu', 'Kakishibu', '柿渋', 'persimmon tannin', '#8a5030'],
    ['ink-nezumi', 'Nezumi', '鼠', 'mouse grey', '#5f6066']
  ],
  ribbons: [
    ['ribbon-black', 'Black', '', 'a fresh ribbon', '#24262c'],
    ['ribbon-blue', 'Carbon blue', '', '', '#2b3550'],
    ['ribbon-faded', 'Faded', '', 'a ribbon near its end', '#55565c'],
    ['ribbon-red', 'Red', '', 'the red half of a two-colour ribbon', '#9e2b25']
  ],
  ballpoints: [
    ['bp-blue', 'Blue', '', '', '#2b40b0'],
    ['bp-black', 'Black', '', '', '#1d1e22'],
    ['bp-red', 'Red', '', '', '#c2302d'],
    ['bp-green', 'Green', '', '', '#2c7a4b']
  ],
  graphite: [
    ['pencil-2h', '2H', '', 'hard and light', '#9a9ca3'],
    ['pencil-hb', 'HB', '', 'the everyday pencil', '#6a6c72'],
    ['pencil-2b', '2B', '', 'soft', '#4d4f55'],
    ['pencil-6b', '6B', '', 'soft and dark', '#2f3136']
  ],
  colourPencils: [
    ['pencil-red', 'Red', '', 'for corrections', '#c8432f'],
    ['pencil-vermilion', 'Vermilion', '', '', '#d65a2e'],
    ['pencil-yellow', 'Yellow', '', '', '#d9a521'],
    ['pencil-green', 'Green', '', '', '#4f8a4a'],
    ['pencil-sky', 'Sky blue', '', '', '#4a90c9'],
    ['pencil-blue', 'Blue', '', 'for editing', '#2f62b8'],
    ['pencil-violet', 'Violet', '', '', '#7a5aa8'],
    ['pencil-pink', 'Pink', '', '', '#d0607e'],
    ['pencil-brown', 'Brown', '', '', '#8a5a3c'],
    ['pencil-black', 'Black', '', '', '#34363b']
  ],
  highlighters: [
    ['hl-yellow', 'Yellow', '', '', '#fff04a'],
    ['hl-pink', 'Pink', '', '', '#ff8fc4'],
    ['hl-green', 'Green', '', '', '#a8f28e'],
    ['hl-orange', 'Orange', '', '', '#ffc06a'],
    ['hl-blue', 'Blue', '', '', '#9fd8ff']
  ],
  stamps: [
    ['stamp-red', 'Shuniku red', '朱肉', 'seal paste', '#c0312b'],
    ['stamp-vermilion', 'Vermilion', '朱', '', '#d23c22'],
    ['stamp-blue', 'Blue pad', '', '', '#2a4fa8'],
    ['stamp-green', 'Green pad', '', '', '#2f7d4a'],
    ['stamp-pink', 'Pink pad', '', '', '#e0558a'],
    ['stamp-brown', 'Brown pad', '', '', '#8a5a3c']
  ],
  papers: [
    ['white', 'White', '', '', '#fcfbf7'],
    ['cream', 'Cream', '', '', '#f8f1df'],
    ['washi', 'Washi', '和紙', 'Japanese paper', '#f6f2e6'],
    ['kraft', 'Kraft', '', '', '#c9a67a'],
    ['recycled', 'Recycled', '', '', '#e9e8e2'],
    ['tracing', 'Tracing', '', '', '#f4f6f6']
  ]
};
