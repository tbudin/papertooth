// Types for the papertooth script. The CSS needs none: import 'papertooth/css'.

/** Settings for the SVG filters behind the textures. Every group and every value is optional. */
export interface FilterParams {
  /** How uneven the ribbon ink is on body text, 0 to 1. */
  text?: { density?: number };
  /** Headings: edge roughness 0 to 3, ink density 0 to 1. */
  head?: { rough?: number; density?: number };
  /** How much of the paper grain catches the lead, and how rough its edge is. */
  graphite?: { tooth?: number; rough?: number };
  /** Brush ink: dry streaks where the brush runs out (0 to 1), and how ragged the edge is. */
  brush?: { dry?: number; rough?: number };
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
  /** Content added later draws on even when it lands on screen. false shows it drawn, like the first screen. Default: true. */
  drawInserted?: boolean;
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
  /** Show everything in scope as drawn, without drawing it on: for content swapped in by a route or tab change. */
  settle(scope?: Element): void;
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

/** 0 = Sunday … 6 = Saturday, as Date#getDay. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Fill a .pt-dayhead with a date: its data-date, or today. Language from data-locale or the page; weekLabel from data-week-label. */
export declare function dayHead(el: Element, date?: Date, options?: { locale?: string; weekLabel?: string | ((week: number) => string) }): void;
/** Fill a .pt-week with the week containing a date (data-date, or today), that date marked (data-mark). weekStart defaults to the locale's first day. */
export declare function week(el: Element, date?: Date, options?: { locale?: string; weekStart?: Weekday; mark?: 'circle' | 'box' | 'highlight' | 'none' }): void;

/* Calendar helpers with no DOM. */
/** ISO 8601 week number. */
export declare function isoWeek(date: Date): number;
/** The locale's first day of the week when the runtime knows it, Monday otherwise. */
export declare function firstDayOf(locale?: string): Weekday;
/** The seven days of the week that contains `date`, from weekStart (default Monday). */
export declare function weekDates(date?: Date, weekStart?: Weekday): Date[];
export declare function sameDay(a: Date, b: Date): boolean;
/** What a day heading shows, in a locale (default 'en-GB'). */
export declare function dayParts(date?: Date, locale?: string): { day: number; month: string; weekday: string; short: string; kanji: string; week: number };

export type StampUnit = 'week' | 'month' | 'year' | 'day';
/** A cell of a date stamp; `date` is the day it stands for (the 1st for a month, 1 January for a year). */
export interface StampCell { label: string; state: 'past' | 'current' | 'future'; date: Date }
/** The cells of a date stamp: seven weekdays, twelve months, a run of years (default 5 around the date) or the days of the month. */
export declare function stampCells(unit?: StampUnit, date?: Date, options?: { locale?: string; weekStart?: Weekday; years?: number; from?: number }): StampCell[];
/** What a date stamp says, read whole (for screen readers). */
/** What a date stamp marks, as a screen reader reads it: the date, the month or the year. */
export declare function stampLabel(unit?: StampUnit, date?: Date, locale?: string, options?: { mark?: 'circle' | 'box' | 'highlight' | 'none'; variant?: 'bar' | 'wide' }): string;
/** Fill a .pt-datestamp from its data attributes (data-unit, data-date, data-mark, data-past, data-locale…). The script does this for you. */
export declare function dateStamp(el: Element, date?: Date, options?: { locale?: string; weekStart?: Weekday; years?: number; from?: number }): void;
export type StampPart = 'bar' | 'head' | 'write' | 'months' | 'days' | 'title' | 'year';
/** Cells in rows to fill in carry `row` (1, 2…) and the `date` of their column; `side` cells hold the row labels. */
export interface StampLayout { sections: { part: StampPart; rows: { label: string; state: StampCell['state'] | ''; date?: Date; row?: number; side?: boolean }[][] }[] }
/** Everything a date stamp prints, as sections of rows of cells, with no DOM: for drawing one in another renderer. */
export declare function stampLayout(unit?: StampUnit, date?: Date, options?: { variant?: 'bar' | 'wide'; locale?: string; weekStart?: Weekday; years?: number; from?: number; rows?: number | string[]; title?: string }): StampLayout;
