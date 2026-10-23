// papertooth/tokens: the colour scheme as data, with no DOM. PALETTE groups every ink, pencil, ribbon, highlighter,
// stamp pad and paper with its traditional name; TOKENS is the same as a flat map from token to colour.
import { PALETTE } from '../js/palette.js';

export { PALETTE };
export const TOKENS = Object.fromEntries(Object.values(PALETTE).flat().map(([token, , , , hex]) => [token, hex]));
