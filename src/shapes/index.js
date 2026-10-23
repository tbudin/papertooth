// papertooth/shapes: the hand-drawn shapes as SVG, with no DOM, for any renderer (React Native, Skia, canvas, a server).
// Every generator takes a size and a seeded random function, so a shape can be drawn again exactly:
//   const r = rng(7); const d = ANNO.circle(120, 40, r);   // an SVG path for a circle around a 120 × 40 word
export { rng, curve, stroke, jit, svgDoc } from '../js/core.js';
export {
  HIGHLIGHT, POOL_Y, HEAVY_START, secondPass, gradient, band, OUTLINE, RULE, ANNO, LINK, STRIKE, WAVE_W, waveD,
  FILLS, hatchD, scribbleD, stippleD, pencilD, swipesD, progressSVG, SWATCH, spiral, wobblyBox, wobblyRing, TICK, DOT
} from '../js/shapes.js';
export { TOOLS, passes, inkPath, inkFill, toolDefs } from '../js/tools.js';
export { PICTURES, PAPER, pictureSVG } from '../js/pictures.js';
