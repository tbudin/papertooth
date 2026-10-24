// Types for papertooth/react.
import type { ComponentPropsWithRef, ElementType, InputHTMLAttributes, CSSProperties, ReactNode, ReactElement, Ref } from 'react';
import type { Options, Kit, HighlightStyle, OutlineStyle, Weekday, StampUnit, StampPart } from 'papertooth';

export type HighlighterColor = 'yellow' | 'pink' | 'green' | 'orange' | 'blue';
export type Tool = 'pen' | 'ballpoint' | 'brush' | 'marker' | 'graphite' | 'pencil';
export type AnnoStyle = 'circle' | 'box' | 'strike' | 'cross' | 'under' | 'hatch' | 'hanamaru' | 'x';

/** Start papertooth when the component mounts and stop it when it unmounts. Options are read once. */
export declare function usePapertooth(options?: Options): Kit | null;

/** Drop-in for a layout: <Papertooth seed={7} /> starts the script for the whole page. Renders nothing. */
export declare function Papertooth(props: Options): null;

// the element's own props, ref included, so <Btn ref={…}> is typed for the element it renders
type As<E extends ElementType, P> = P & { as?: E } & Omit<ComponentPropsWithRef<E>, keyof P | 'as'>;

export type BtnProps<E extends ElementType = 'button'> = As<E, {
  /** An outlined button; a string picks the outline. */
  outline?: boolean | OutlineStyle;
  hl?: HighlightStyle;
  /** Hover highlighter colour. */
  color?: HighlighterColor;
  size?: 'fine' | 'broad';
  /** What happens on hover. Default: a pen underline; on an outlined button, the highlighter. */
  hover?: 'pass' | 'underline' | 'circle' | 'none';
  /** The instrument an outline, underline or circle is drawn with. */
  tool?: Tool;
  children?: ReactNode;
}>;
/** A highlighter button, or an outlined one. Renders an <a> when given href, otherwise a <button>. */
export declare function Btn(props: BtnProps<'a'> & { href: string }): ReactElement;
export declare function Btn<E extends ElementType = 'button'>(props: BtnProps<E>): ReactElement;

export type MarkProps = Omit<ComponentPropsWithRef<'mark'>, 'color'> & {
  hl?: HighlightStyle;
  color?: HighlighterColor;
  size?: 'fine' | 'broad';
};
/** A highlighted phrase. */
export declare function Mark(props: MarkProps): ReactElement;

export type AnnoProps = ComponentPropsWithRef<'span'> & {
  /** Default: 'circle'. */
  anno?: AnnoStyle;
  /** Default: the marking pencil. */
  tool?: Tool;
  /** Let a longer phrase wrap: circle, box and hanamaru go around all of it; strike, under and cross follow each line. */
  wrap?: boolean;
};
/** A mark drawn on text. */
export declare function Anno(props: AnnoProps): ReactElement;

export type WobbleProps<E extends ElementType = 'span'> = As<E, {
  /** The same seed gives the same letters on every visit. Default: stable per component. */
  seed?: number;
  /** Text (strings and numbers, e.g. `Hello {name}`) is split into letters; anything else is passed through unchanged. */
  children?: ReactNode;
}>;
/** Typed text whose letters sit a little unevenly. */
export declare function Wobble<E extends ElementType = 'span'>(props: WobbleProps<E>): ReactElement;

export type CheckProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'style' | 'className' | 'children'> & {
  /** Default: 'checkbox'. */
  type?: 'checkbox' | 'radio';
  /** The instrument the tick is drawn with. */
  tool?: Tool;
  /** The same seed gives the same box on every visit. Default: stable per component. */
  seed?: number;
  /** Class and style go on the label; every other prop, and the ref, go on the input. */
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};
/** A hand-drawn checkbox or radio around a native input. */
export declare function Check(props: CheckProps): ReactElement;

/* Planner. Dates are worked out during render. The defaults (English, Monday first) are the same on the server and
   in every browser; pass locale and weekStart for others, and pass date (and today) if the server is in another time zone. */

export type DayHeadProps = ComponentPropsWithRef<'div'> & {
  /** Default: today. */
  date?: Date;
  /** Default: 'en-GB'. */
  locale?: string;
  /** 'Semaine {n}', or a function of the week number. Default: 'Week {n}'. */
  weekLabel?: string | ((week: number) => ReactNode);
};
/** A day heading: the date, month and weekday, the weekday's kanji as a stamp, and the ISO week. */
export declare function DayHead(props: DayHeadProps): ReactElement;

export interface WeekDay { date: Date; index: number; today: boolean }
export type WeekProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** Any day of the week to show. Default: today. */
  date?: Date;
  /** The day to mark. Default: date. */
  today?: Date;
  /** How that day is marked: circle, box, highlight or none. Default: circle. */
  mark?: 'circle' | 'box' | 'highlight' | 'none';
  /** Default: 'en-GB'. */
  locale?: string;
  /** Default: the locale's first day when the runtime knows it, Monday otherwise. */
  weekStart?: Weekday;
  /** Fills each day, e.g. day => tasks[key(day.date)].map(…). */
  children?: (day: WeekDay) => ReactNode;
};
/** Seven days around a date, the weekend coloured and today marked. */
export declare function Week(props: WeekProps): ReactElement;

export type HabitProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'style' | 'className'> & {
  seed?: number;
  /** Class and style go on the label; every other prop, and the ref, go on the input. */
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLInputElement>;
};
/** One habit-tracker cell. Give it an aria-label: it has no visible text. */
export declare function Habit(props: HabitProps): ReactElement;

export interface HabitRow {
  name: string;
  /** A token such as 'ink-beni', or any colour. Default: the pen. */
  ink?: string;
  /** One entry per day. */
  done: boolean[];
}
export type HabitsProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  habits: HabitRow[];
  /** Columns. Default: the longest done list. */
  days?: number;
  /** Column headings. Default: 1, 2, 3… */
  head?: ReactNode[];
  /** The heading above the habit names. Default: 'Habit'. */
  title?: ReactNode;
  /** Without it the tracker is read-only. */
  onToggle?: (habit: number, day: number, checked: boolean) => void;
  /** Draws a cell yourself (a stamp, a letter, a mark) in place of its checkbox; return null to keep the checkbox. */
  cell?: (info: { habit: number; day: number; done: boolean }) => ReactNode;
};
/** A habit tracker: a row per habit and a column per day, swapped on narrow screens. */
export declare function Habits(props: HabitsProps): ReactElement;

export type StampInk = 'red' | 'vermilion' | 'blue' | 'green' | 'pink' | 'brown';
export type DateStampProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
  /** Default: 'week'. week: a strip to fill in; month: a calendar; year: its months; day: 1 to 31 in a row. */
  unit?: StampUnit;
  /** 'bar' prints a week, the months or a run of years as one row; 'wide' prints a month as one long row of days. */
  variant?: 'bar' | 'wide';
  /** Week strip and wide month: how many rows to fill in, or their labels (['Run', 'Read']). Default: 1. */
  rows?: number | string[];
  /**
   * What to draw in a cell: a stamp, a letter, a mark. Called for every dated cell; `row` is 0 on the dates themselves
   * and 1, 2… in the rows to fill in. Return null to leave the cell as it is.
   */
  cell?: (info: { part: StampPart; row: number; date: Date; state: 'past' | 'current' | 'future' | '' }) => ReactNode;
  /** Week strip: a title line on top ('' to write in by hand). */
  title?: string;
  /** The day, month or year to mark. Default: today. */
  date?: Date;
  /** How the current one is marked. Default: 'circle'. */
  mark?: 'circle' | 'box' | 'highlight' | 'none';
  /** How the past ones are marked. Default: 'none'. */
  past?: 'x' | 'strike' | 'none';
  /** Labels come from Intl in this locale. Default: 'en-GB'. */
  locale?: string;
  /** Week stamps: the first day. Default: the locale's when the runtime knows it, Monday otherwise. */
  weekStart?: Weekday;
  /** Year bar: how many years (default 5) and the first (default: the date's year in the middle). */
  years?: number;
  from?: number;
  /** The instruments the marks are drawn with. Default: 'pencil' for the current one, 'graphite' for the past. */
  markTool?: Tool;
  pastTool?: Tool;
  ink?: StampInk;
};
/** A date stamp: a week, the months, a run of years or the days of a month, with the current one marked and the past crossed out. */
export declare function DateStamp(props: DateStampProps): ReactElement;
