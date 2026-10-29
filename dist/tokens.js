/*! papertooth v0.5.1 | (c) 2026 Thomas Budin | MIT License | github.com/tbudin/papertooth */

// src/js/palette.js
var PALETTE = {
  inks: [
    ["ink-sumi", "Sumi", "\u58A8", "ink-stick black", "#232429"],
    ["ink-blueblack", "Blue-black", "", "the classic office ink", "#263252"],
    ["ink-kon", "Kon", "\u7D3A", "navy", "#22305e"],
    ["ink-ai", "Ai", "\u85CD", "indigo", "#213c6b"],
    ["ink-konpeki", "Konpeki", "\u7D3A\u78A7", "deep sky blue", "#1f5a9e"],
    ["ink-tsuyukusa", "Tsuyukusa", "\u9732\u8349", "dayflower blue", "#2f6db5"],
    ["ink-asagi", "Asagi", "\u6D45\u8471", "pale leek blue-green", "#12737e"],
    ["ink-hisoku", "Hisoku", "\u79D8\u8272", "celadon", "#3f7f77"],
    ["ink-wakatake", "Wakatake", "\u82E5\u7AF9", "young bamboo", "#3c7a4c"],
    ["ink-matcha", "Matcha", "\u62B9\u8336", "powdered green tea", "#5d7334"],
    ["ink-uguisu", "Uguisu", "\u9DAF", "bush warbler olive", "#6b6b2a"],
    ["ink-yamabuki", "Yamabuki", "\u5C71\u5439", "kerria gold", "#b9800f"],
    ["ink-kaki", "Kaki", "\u67FF", "persimmon", "#c25a26"],
    ["ink-shu", "Shu", "\u6731", "vermilion", "#c13d25"],
    ["ink-beni", "Beni", "\u7D05", "safflower red", "#a52a45"],
    ["ink-sakura", "Sakura", "\u685C", "cherry blossom", "#c2637f"],
    ["ink-fuji", "Fuji", "\u85E4", "wisteria", "#6b5aa6"],
    ["ink-edomurasaki", "Edo murasaki", "\u6C5F\u6238\u7D2B", "Edo purple", "#5b3f86"],
    ["ink-tobi", "Tobi", "\u9CF6", "kite brown", "#714a36"],
    ["ink-kakishibu", "Kakishibu", "\u67FF\u6E0B", "persimmon tannin", "#8a5030"],
    ["ink-nezumi", "Nezumi", "\u9F20", "mouse grey", "#5f6066"]
  ],
  ribbons: [
    ["ribbon-black", "Black", "", "a fresh ribbon", "#24262c"],
    ["ribbon-blue", "Carbon blue", "", "", "#2b3550"],
    ["ribbon-faded", "Faded", "", "a ribbon near its end", "#55565c"],
    ["ribbon-red", "Red", "", "the red half of a two-colour ribbon", "#9e2b25"]
  ],
  ballpoints: [
    ["bp-blue", "Blue", "", "", "#2b40b0"],
    ["bp-black", "Black", "", "", "#1d1e22"],
    ["bp-red", "Red", "", "", "#c2302d"],
    ["bp-green", "Green", "", "", "#2c7a4b"]
  ],
  graphite: [
    ["pencil-2h", "2H", "", "hard and light", "#9a9ca3"],
    ["pencil-hb", "HB", "", "the everyday pencil", "#6a6c72"],
    ["pencil-2b", "2B", "", "soft", "#4d4f55"],
    ["pencil-6b", "6B", "", "soft and dark", "#2f3136"]
  ],
  colourPencils: [
    ["pencil-red", "Red", "", "for corrections", "#c8432f"],
    ["pencil-vermilion", "Vermilion", "", "", "#d65a2e"],
    ["pencil-yellow", "Yellow", "", "", "#d9a521"],
    ["pencil-green", "Green", "", "", "#4f8a4a"],
    ["pencil-sky", "Sky blue", "", "", "#4a90c9"],
    ["pencil-blue", "Blue", "", "for editing", "#2f62b8"],
    ["pencil-violet", "Violet", "", "", "#7a5aa8"],
    ["pencil-pink", "Pink", "", "", "#d0607e"],
    ["pencil-brown", "Brown", "", "", "#8a5a3c"],
    ["pencil-black", "Black", "", "", "#34363b"]
  ],
  highlighters: [
    ["hl-yellow", "Yellow", "", "", "#fff04a"],
    ["hl-pink", "Pink", "", "", "#ff8fc4"],
    ["hl-green", "Green", "", "", "#a8f28e"],
    ["hl-orange", "Orange", "", "", "#ffc06a"],
    ["hl-blue", "Blue", "", "", "#9fd8ff"]
  ],
  stamps: [
    ["stamp-red", "Shuniku red", "\u6731\u8089", "seal paste", "#c0312b"],
    ["stamp-vermilion", "Vermilion", "\u6731", "", "#d23c22"],
    ["stamp-blue", "Blue pad", "", "", "#2a4fa8"],
    ["stamp-green", "Green pad", "", "", "#2f7d4a"],
    ["stamp-pink", "Pink pad", "", "", "#e0558a"],
    ["stamp-brown", "Brown pad", "", "", "#8a5a3c"]
  ],
  papers: [
    ["white", "White", "", "", "#fefefe"],
    ["cream", "Cream", "", "", "#f8f1df"],
    ["washi", "Washi", "\u548C\u7D19", "Japanese paper", "#f6f2e6"],
    ["kraft", "Kraft", "", "", "#c9a67a"],
    ["recycled", "Recycled", "", "", "#e9e8e2"],
    ["tracing", "Tracing", "", "", "#f4f6f6"]
  ]
};

// src/tokens/index.js
var TOKENS = Object.fromEntries(Object.values(PALETTE).flat().map(([token, , , , hex]) => [token, hex]));
export {
  PALETTE,
  TOKENS
};
