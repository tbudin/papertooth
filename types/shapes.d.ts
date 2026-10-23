// Types for papertooth/shapes: the hand-drawn shapes as SVG strings, with no DOM, for any renderer.

/** A seeded random function: the same seed draws the same shape. */
export type Random = () => number;
export type Point = [number, number];
/** A writing instrument: what a shape is drawn with. */
export interface Tool { kind: 'pen' | 'ballpoint' | 'brush' | 'marker' | 'graphite' | 'pencil'; color: string; w: number; op: number }
/** Draws in a w × h box. Returns SVG markup (OUTLINE, RULE, SWATCH) or path data (ANNO, LINK, STRIKE, FILLS). */
type Shape<R = string> = (w: number, h: number, r: Random, t: Tool) => R;

export declare function rng(seed: number): Random;
export declare function curve(points: Point[], move?: boolean): string;
export declare function stroke(a: Point, b: Point, r: Random, overshoot: number, bend: number): string;
export declare function jit(p: Point, r: Random, amount: number): Point;
export declare function svgDoc(w: number, h: number, inner: string): string;

/** Highlighter passes (each returns SVG elements filled with url(#g); add gradient() for the ink). */
export declare const HIGHLIGHT: Record<'swipe' | 'flick' | 'double' | 'low' | 'dry' | 'scribble', (w: number, h: number, r: Random) => string[]>;
export declare const POOL_Y: Record<string, string>;
export declare const HEAVY_START: Set<string>;
export declare function secondPass(style: string, w: number, h: number, r: Random): string[];
export declare function gradient(w: number, color: string, heavyStart?: boolean): string;
export declare function band(w: number, h: number, r: Random, o: { t0: number; t1: number; b0: number; b1: number; x0: number; x1: number; bow: number; taper?: boolean }): string;
/** Outlines around a box, as SVG markup in the tool's ink. */
export declare const OUTLINE: Record<'sketch' | 'double' | 'broken' | 'pencil' | 'circled' | 'corners' | 'brackets' | 'parens' | 'braces' | 'angles' | 'kagi' | 'lenticular', Shape>;
/** Separators, as SVG markup in the tool's ink. */
export declare const RULE: Record<'wobble' | 'short' | 'double' | 'dashes' | 'brush' | 'coil' | 'scrawl', Shape>;
/** Marks on text, as path data (stroke it). */
export declare const ANNO: Record<'circle' | 'box' | 'strike' | 'under' | 'cross' | 'hatch' | 'hanamaru' | 'x', (w: number, h: number, r: Random) => string>;
/** Link underlines, as path data in a 200 × 12 box. */
export declare const LINK: Record<'wobble' | 'slant' | 'double' | 'swash' | 'marker' | 'second', (r: Random) => string>;
/** Ways to cross out a done item, as path data in a 200 × 12 box. */
export declare const STRIKE: Record<'line' | 'double' | 'scribble', (r: Random) => string>;
export declare const WAVE_W: number;
export declare function waveD(r: Random): string;
/** Fills inside a box, as path data. */
export declare const FILLS: Record<'hatch' | 'cross' | 'scribble' | 'stipple' | 'pencil', (x: number, y: number, w: number, h: number, r: Random) => string>;
export declare function hatchD(x: number, y: number, w: number, h: number, r: Random, gap?: number, angle?: number): string;
export declare function scribbleD(x: number, y: number, w: number, h: number, r: Random, step?: number): string;
export declare function stippleD(x: number, y: number, w: number, h: number, r: Random, density?: number): string;
export declare function pencilD(x: number, y: number, w: number, h: number, r: Random): string;
export declare function swipesD(x: number, y: number, w: number, h: number, r: Random): string[];
export declare function progressSVG(shape: string, style: string, w: number, h: number, r: Random, t: Tool, value: number, o?: { hl?: string; segments?: number; max?: number }): string;
/** Ink samples, as SVG markup. */
export declare const SWATCH: Record<'fountain' | 'ballpoint' | 'pencil', (w: number, h: number, r: Random, color: string) => string>;
export declare function spiral(r: Random): string;
export declare function wobblyBox(r: Random): string;
export declare function wobblyRing(r: Random): string;
export declare const TICK: string;
export declare const DOT: string;

export declare const TOOLS: Tool['kind'][];
/** How an instrument lays its line, as passes of the same path: [dx, dy, width factor, opacity factor]. */
export declare function passes(t: Tool, nonScaling?: boolean): [number, number, number, number][];
/** Stroke path data with an instrument, as SVG markup. */
export declare function inkPath(d: string, t: Tool, opts?: { scale?: number; op?: number; nonScaling?: boolean; dash?: string; noFilter?: boolean; filterId?: string }): string;
export declare function inkFill(d: string, t: Tool, opts?: { noFilter?: boolean; filterId?: string }): string;
/** The <filter> a graphite or pencil line needs (empty for inks). */
export declare function toolDefs(t: Tool, id?: string): string;

export type PictureName = 'tick' | 'star' | 'heart' | 'arrow' | 'cat' | 'onigiri' | 'sakura' | 'cloud' | 'paw' | 'daruma' | 'fuji' | 'sun' | 'frog' | 'bear' | 'tiger' | 'rabbit' | 'tanuki' | 'owl';
/** The picture stamps: one ink (currentColor), with cut-outs in the paper colour. */
export declare const PICTURES: Record<PictureName, { label: string; viewBox: string; body: string }>;
export declare const PAPER: string;
export declare function pictureSVG(name: PictureName, options?: { width?: number; height?: number; label?: string }): string;
