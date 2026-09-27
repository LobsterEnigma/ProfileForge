import { layer, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 18 × 14, from the side (Swift: a swift, in Swift orange): a round little bird with a
// white chest, a forked tail, a short beak, and wings that flap when it's excited.

const BODY: Grid = [
  "..........oooo....",
  ".........orrrro...",
  "o.......orrrrrro..",
  "oro.....orrrrrrro.",
  ".oro...orrrrrrrro.",
  "..orr.orrrrrrrwwo.",
  "oorrrorrrrrrwwwwo.",
  "orrrrrrrrrrwwwwo..",
  ".ooorrrrrrwwwwo...",
  "....ooooooooo.....",
];

const BEAK: Grid = ["yy", "y."];
/** Wings: folded along its side, or raised mid-flap. */
const WING_DOWN: Grid = ["...ooooo", "..ohhhho", ".oddddo.", "odddoo..", "ooo....."];
const WING_UP: Grid = ["....oo..", "..oddo..", ".odddo..", "odddddo.", ".ooooo.."];
const FEET: Grid = ["y..y", "yy.yy"];

/** The folded wing is part of the body (in front); a raised wing peeks up behind the back. */
const flap = (up: boolean) => (up ? [layer(6, 1, WING_UP)] : []);
const feet = [layer(7, 12, FEET)];

export const swift: Species = {
  id: "swift",
  defaultName: "Zippy",
  width: 18,
  height: 14,
  facing: "right",
  palette: {
    o: "#4a1a0f",
    r: "#f05138",
    d: "#c63a24",
    h: "#ff8a6e",
    w: "#fff4ec",
    y: "#f4b73f",
    k: "#1a1a1a",
    p: "#ff9fb0",
  },
  legendaryPalette: {
    o: "#5a3d0a",
    r: "#f6c343",
    d: "#c99a1a",
    h: "#fff1a8",
  },
  body: [layer(0, 2, BODY), layer(16, 6, BEAK), layer(4, 7, WING_DOWN)],
  eyes: {
    open: [layer(13, 5, ["kw", "kk"])],
    happy: [layer(13, 5, [".k", "k."])],
    closed: [layer(13, 6, ["kk"])],
    sad: [layer(13, 5, ["oo", "kk"])],
  },
  // The beak does the talking: its tip marks the mouth (for treats, kisses and the ball).
  mouths: {
    smile: [layer(16, 7, ["y"])],
    neutral: [layer(16, 7, ["y"])],
    frown: [layer(16, 7, ["y"])],
  },
  blush: [layer(12, 7, ["pp"])],
  limbs: {
    // Flapping with joy.
    happy: [[...flap(false), ...feet], [...flap(true), ...feet]],
    // Hopping from foot to foot.
    idle: [feet, [layer(7, 12, ["y..y", "yy.y."]), layer(10, 13, ["y"])]],
    hungry: [feet, feet],
    sleeping: [feet, feet],
  },
  crownAnchor: { x: 12, y: 2 },
};
