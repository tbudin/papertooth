// Types for the papertooth script. The CSS needs none: import 'papertooth/css'.

/** Settings for the SVG filters behind the textures. Every group and every value is optional. */
export interface FilterParams {
  /** How uneven the ribbon ink is on body text, 0 to 1. */
  text?: { density?: number };
  /** Headings: edge roughness 0 to 3, ink density 0 to 1. */
  head?: { rough?: number; density?: number };
  /** How much of the paper grain catches the lead, and how rough its edge is. */
  graphite?: { tooth?: number; rough?: number };
  /** Paper gaps, edge roughness, ink pooling at the rim, uneven pad. */
  stamp?: { wear?: number; rough?: number; edge?: number; mottle?: number };
  /** Fresh ink dragged by a highlighter. */
  smudge?: { drag?: number; blur?: number; strength?: number };
  /** Extra ink dragged on hover. */
  smear?: { drag?: number; blur?: number; strength?: number };
  typewriter?: TypewriterParams;
  colors?: { ribbon?: string; pen?: string; highlighter?: string };
}

export interface TypewriterParams { spread?: number; rough?: number; uneven?: number; speckle?: number }

export type HighlightStyle = 'swipe' | 'flick' | 'double' | 'low' | 'dry' | 'scribble';
export type OutlineStyle = 'sketch' | 'double' | 'broken' | 'circled' | 'corners' | 'brackets' | 'parens' | 'braces' | 'angles' | 'kagi' | 'lenticular';

export interface Options {
  /** Element to enhance. Default: document.body. */
  root?: Element | null;
  /** A number makes every drawing repeatable. */
  seed?: number | null;
  /** Inject the SVG filters (false if you paste dist/papertooth-filters.svg yourself). Default: true. */
  filters?: boolean;
  filterParams?: FilterParams;
  /** Put text on the grid inside .pt-sheet. Default: true. */
  snap?: boolean;
  /** Draw shapes only when they come near the screen. Default: true. */
  lazy?: boolean;
  /** Default: '600px'. */
  lazyMargin?: string;
  /** Default: 'scroll'. */
  motion?: 'scroll' | 'load' | 'none';
  /** Blocks that draw on as a group. Default: '[data-pt-draw]'. */
  drawSelector?: string;
  /** Draw every mark as it comes into view, not only inside drawSelector blocks. Default: true. */
  drawAll?: boolean;
  /** Also draw on what is on screen when the page opens. Default: false. */
  drawOnLoad?: boolean;
  /** Seconds between marks drawing on in one block. Default: 0.12. */
  stagger?: number;
  /** Default highlighter for .pt-btn and .pt-mark. Default: 'swipe'. */
  highlight?: HighlightStyle;
  /** Default outline for .pt-btn--outline. Default: 'sketch'. */
  outline?: OutlineStyle;
  /** Letters split per .pt-wobble element. Default: 400. */
  wobbleMax?: number;
  /** Enhance elements added to the page later. Default: true. */
  observe?: boolean;
  /** Fill .pt-dayhead[data-today] and .pt-week[data-today] with today. Default: true. */
  today?: boolean;
  /** A token name such as 'ink-beni', or any CSS colour. */
  pen?: string | null;
  pencil?: string | null;
  ribbon?: string | null;
  highlighter?: string | null;
}

/** The running instance returned by init(). */
export interface Kit {
  readonly options: Required<Omit<Options, 'root'>> & { root: Element | null };
  /** Redraw everything near the screen, e.g. after changing writing mode, layout or ink tokens in CSS. */
  refresh(scope?: Element): void;
  /** Draw everything on again. */
  replay(scope?: Element): void;
  /** Put text back on the grid. */
  snap(): void;
  /** Enhance a subtree added without the mutation observer. */
  scan(scope: Element): void;
  /** Change an ink and redraw what it drew. Returns the colour as hex. */
  setPen(colour: string): string;
  setPencil(colour: string): string;
  setRibbon(colour: string): string;
  setHighlighter(colour: string): string;
  setFilters(params: FilterParams): SVGSVGElement;
  setTypewriter(params: TypewriterParams): SVGSVGElement;
  planner: { dayHead: typeof dayHead; week: typeof week; isoWeek: typeof isoWeek };
  /** Stop observing. What is drawn stays drawn. */
  destroy(): void;
}

export declare const VERSION: string;
export declare const DEFAULTS: Options;
export declare const FILTER_DEFAULTS: Required<FilterParams>;

/** Start papertooth on the page. Safe to import on the server; call it in the browser. */
export declare function init(options?: Options): Kit;

/** [token, name, kanji, meaning, hex] */
export type PaletteEntry = [token: string, name: string, kanji: string, meaning: string, hex: string];
export declare const PALETTE: {
  inks: PaletteEntry[]; ribbons: PaletteEntry[]; ballpoints: PaletteEntry[]; graphite: PaletteEntry[];
  colourPencils: PaletteEntry[]; highlighters: PaletteEntry[]; stamps: PaletteEntry[]; papers: PaletteEntry[];
};

export interface DiagramOptions {
  seed?: number;
  /** A CSS font shorthand, e.g. '20px Caveat, cursive'. */
  font?: string;
  lineHeight?: number;
  fill?: 'none' | 'wash' | 'highlight' | 'pencil' | 'hatch' | 'cross' | 'scribble' | 'stipple';
  width?: number;
}
/** Render Mermaid-style source (flowchart/graph, pie, xychart-beta) to an SVG string. Empty for anything else. */
export declare function renderDiagram(source: string, options?: DiagramOptions): string;

export interface LithoParams {
  mode: 'mono' | 'duo' | 'tri';
  ink: string; ink2: string; blue: string; red: string; yellow: string;
  grain: number; size: number; contrast: number; darken: number; offset: number; seed: number;
}
export declare function lithoFilter(id: string, params: LithoParams): string;
export declare function typewriterFilter(id: string, params?: TypewriterParams): string;
/** Every filter the library uses, as SVG markup. */
export declare function filtersMarkup(params?: FilterParams): string;
/** Wet ink dissolved by a highlighter. */
export declare function smearColour(ink: string, highlighter?: string): string;

/** Change an ink on any element without a kit. Does not redraw what is already drawn; the kit's methods do. */
export declare function setPen(colour: string, target?: HTMLElement): string;
export declare function setPencil(colour: string, target?: HTMLElement): string;
export declare function setRibbon(colour: string, target?: HTMLElement): string;
export declare function setHighlighter(colour: string, target?: HTMLElement): string;

/** Fill a .pt-dayhead with a date (today by default). */
export declare function dayHead(el: Element, date?: Date): void;
/** Fill a .pt-week with the week containing a date, Monday first, today circled. */
export declare function week(el: Element, date?: Date): void;
export declare function isoWeek(date: Date): number;
