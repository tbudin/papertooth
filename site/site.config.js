/* Papertooth's own site. Everything particular to this package: its tokens,
   its fonts, its credit and where it is published. The chrome, the generator
   and the SEO come from package-site.

   The tokens below are the ones the old hand-written page carried in its
   <style>; they are the same names the template uses, because the template's
   chrome was lifted from this page in the first place. */

export default {
  tagline: 'the feel of paper, for the web',
  baseUrl: 'https://tbudin.github.io/papertooth/',
  repo: 'https://github.com/tbudin/papertooth',
  editBranch: 'main',
  npm: 'https://www.npmjs.com/package/papertooth',
  author: { name: 'Thomas Budin' },
  owner: 'Plain Matter Pte Ltd',
  programmingLanguage: 'CSS',
  codeLang: 'html',
  findLabel: 'Find a component',
  noMatch: 'Nothing matches. Try “stamp” or “chart”.',
  about: 'Hand-drawn stationery for the web: dotted and ruled paper, fountain-pen and pencil ink, highlighters, hanko stamps, washi tape, planner pieces and Mermaid diagrams drawn by hand. The CSS works on its own; a small optional script adds the textures, the shapes drawn at each element\'s real size and the diagrams.',
  groups: ['Getting started', 'Paper and writing', 'Marks', 'Paper goods', 'Images', 'Planner', 'Forms', 'Diagrams', 'Reference'],

  themeColor: { light: '#f4f2ec', dark: '#1f1e1c' },
  og: {
    image: 'og.png',
    width: 1200,
    height: 630,
    alt: 'Papertooth: a sheet of dotted paper with a highlighted word, a circled word, a red daruma stamp and a sticky note',
  },
  icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23f8f1df'/%3E%3Cpath d='M4 19 C 12 16, 20 17, 28 14 L 28 23 C 20 25, 12 24, 4 27 Z' fill='%23fff04a'/%3E%3Ctext x='16' y='23' font-family='Georgia, serif' font-size='21' text-anchor='middle' fill='%23213c6b'%3Ep%3C/text%3E%3C/svg%3E",

  fonts: [
    'https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Special+Elite&family=Kalam:wght@400;700&family=Nanum+Pen+Script&family=IBM+Plex+Mono:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Space+Mono:wght@400;700&family=Work+Sans:wght@400;700&family=DM+Sans:wght@400;700&family=Archivo:wght@400;700&family=Archivo+Narrow:wght@500;600&display=swap',
    'https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@800&family=Zen+Maru+Gothic:wght@700&display=swap',
  ],

  /* The library's own stylesheet, then the few shapes this site draws around
     it. Both are served from assets/ and linked at the page's own depth. */
  stylesheets: ['assets/papertooth.min.css', 'assets/site.css'],

  theme: {
    tokens: {
      '--bg': '#f4f2ec', '--fg': '#24262c', '--muted': '#6c6a64', '--line': '#dcd8ce',
      '--panel': '#ebe8e0', '--code': '#efece5', '--accent': '#213c6b', '--mark': '#fff04a',
      '--f-ui': '"Courier Prime", "Courier New", monospace',
      '--f-head': '"Special Elite", "Courier Prime", monospace',
      '--f-mono': '"Courier Prime", "Courier New", monospace',
    },
    dark: {
      '--bg': '#1f1e1c', '--fg': '#e9e6de', '--muted': '#a29f97', '--line': '#3a3834',
      '--panel': '#2a2926', '--code': '#262522', '--accent': '#a9bde6', '--mark': '#6d6418',
    },
  },

  credit: {
    statement: '{title}, made by {creators}',
    materials: [
      { kind: 'font', name: 'Courier Prime', maker: 'Quote-Unquote Apps', url: 'https://quoteunquoteapps.com/courierprime/', licence: 'OFL-1.1', use: 'Interface and code' },
      { kind: 'font', name: 'Special Elite', maker: 'Astigmatic', url: 'https://fonts.google.com/specimen/Special+Elite', licence: 'OFL-1.1', use: 'Headings' },
      { kind: 'host', name: 'GitHub Pages', url: 'https://pages.github.com' },
    ],
  },

  /* The library itself, imported by site/pages.js in Node and by the browser
     from the same path. The chunks go with it: the ESM build imports them. */
  assets: {
    'papertooth.js': 'dist/papertooth.js',
    chunks: 'dist/chunks',
    'papertooth.min.css': 'dist/papertooth.min.css',
    'site.css': 'site/site.css',
  },
  static: [
    ['site/static/og.png', 'og.png'],
    ['site/static/img', 'img'],
    ['dist/stamps', 'stamps'],
  ],
};
