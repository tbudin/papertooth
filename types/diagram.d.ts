// Types for papertooth/diagram. The script draws .pt-diagram elements by itself; import this to render one yourself.

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
/** Which kind of diagram a source is ('flow', 'pie', 'xy'), or null. */
export declare function kindOf(source: string): 'flow' | 'pie' | 'xy' | null;
