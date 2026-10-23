// Types for papertooth/react.
import type { ComponentPropsWithoutRef, ElementType, InputHTMLAttributes, CSSProperties, ReactNode, ReactElement } from 'react';
import type { Options, Kit, HighlightStyle, OutlineStyle } from 'papertooth';

export type HighlighterColor = 'yellow' | 'pink' | 'green' | 'orange' | 'blue';
export type Tool = 'pen' | 'ballpoint' | 'brush' | 'marker' | 'graphite' | 'pencil';
export type AnnoStyle = 'circle' | 'box' | 'strike' | 'cross' | 'under' | 'hatch' | 'hanamaru';

/** Start papertooth when the component mounts and stop it when it unmounts. Options are read once. */
export declare function usePapertooth(options?: Options): Kit | null;

/** Drop-in for a layout: <Papertooth seed={7} /> starts the script for the whole page. Renders nothing. */
export declare function Papertooth(props: Options): null;

type As<E extends ElementType, P> = P & { as?: E } & Omit<ComponentPropsWithoutRef<E>, keyof P | 'as'>;

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

export type MarkProps = Omit<ComponentPropsWithoutRef<'mark'>, 'color'> & {
  hl?: HighlightStyle;
  color?: HighlighterColor;
  size?: 'fine' | 'broad';
};
/** A highlighted phrase. */
export declare function Mark(props: MarkProps): ReactElement;

export type AnnoProps = ComponentPropsWithoutRef<'span'> & {
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
  /** Plain text is split into letters; anything else is passed through unchanged. */
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
  /** Class and style go on the label; every other prop goes on the input. */
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};
/** A hand-drawn checkbox or radio around a native input. */
export declare function Check(props: CheckProps): ReactElement;
