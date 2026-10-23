// Types for papertooth/react.
import type { ComponentPropsWithRef, ElementType, InputHTMLAttributes, CSSProperties, ReactNode, ReactElement, Ref } from 'react';
import type { Options, Kit, HighlightStyle, OutlineStyle, Weekday } from 'papertooth';

export type HighlighterColor = 'yellow' | 'pink' | 'green' | 'orange' | 'blue';
export type Tool = 'pen' | 'ballpoint' | 'brush' | 'marker' | 'graphite' | 'pencil';
export type AnnoStyle = 'circle' | 'box' | 'strike' | 'cross' | 'under' | 'hatch' | 'hanamaru';

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
  /** What happens on hover. Default: a second highlighter pass. */
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
  /** Default: n => `Week ${n}`. */
  weekLabel?: (week: number) => ReactNode;
};
/** A day heading: the date, month and weekday, the weekday's kanji as a stamp, and the ISO week. */
export declare function DayHead(props: DayHeadProps): ReactElement;

export interface WeekDay { date: Date; index: number; today: boolean }
export type WeekProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** Any day of the week to show. Default: today. */
  date?: Date;
  /** The day to circle. Default: date. */
  today?: Date;
  /** Default: 'en-GB'. */
  locale?: string;
  /** Default: the locale's first day when the runtime knows it, Monday otherwise. */
  weekStart?: Weekday;
  /** Fills each day, e.g. day => tasks[key(day.date)].map(…). */
  children?: (day: WeekDay) => ReactNode;
};
/** Seven days around a date, the weekend coloured and today circled. */
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
};
/** A habit tracker: a row per habit and a column per day, swapped on narrow screens. */
export declare function Habits(props: HabitsProps): ReactElement;
