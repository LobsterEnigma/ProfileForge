import { layer, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 18 × 16, from the front: a round spotted head with big eyes, and a skirt of tentacles
// that wave (C and C++: a hand for every pointer).

const HEAD: Grid = [
  "....oooooooo....",
  "..oohhhhhmmmoo..",
  ".ohhhmmmmmmsmmo.",
  ".ohmmmmmmmmmmmo.",
  "ohmmsmmmmmmmmmmo",
  "ommmmmmmmmmmmsmo",
  "ommmmmmmmmmmmmmo",
  "ommmmmmmmmmmmmmo",
  "ommmmmmmmmmmmmmo",
  "ommmmmmmmmmmmmmo",
  ".ommmmmmmmmmmmo.",
];

/** Eight tentacles make a skirt; four curl out in front and wave. */
const SKIRT: Grid = ["ommmmmmmmmmmmmmmmo"];
const WAVE_A: Grid = [
  "omo.omo..omo.omo..",
  "omo..omo.omo..omo.",
  ".omo.omo..omo.omo.",
  "..oo..oo...oo..oo.",
];
const WAVE_B: Grid = [
  "..omo.omo..omo.omo",
  ".omo.omo..omo.omo.",
  ".omo..omo.omo..omo",
  ".oo...oo..oo...oo.",
];
/** Tentacles spread flat on the sea floor. */
const REST: Grid = [
  "omo.omo..omo.omo..",
  "ommoommooommoommo.",
  ".oo..oo...oo..oo..",
  "..................",
];

const eyes = (grid: Grid) => [layer(4, 4, grid), layer(10, 4, grid)];
const tentacles = (grid: Grid) => [layer(0, 11, SKIRT), layer(0, 12, grid)];

export const octopus: Species = {
  id: "octopus",
  defaultName: "Inky",
  width: 18,
  height: 16,
  palette: {
    o: "#5c1d3a",
    m: "#ee6a8f",
    h: "#ffa8bf",
    s: "#c9446c",
    k: "#1a1a1a",
    w: "#ffffff",
    p: "#ffd1dc",
  },
  legendaryPalette: {
    o: "#5a3d0a",
    m: "#f6c343",
    h: "#fff1a8",
    s: "#c99a1a",
  },
  body: [layer(1, 0, HEAD)],
  eyes: {
    open: eyes([".oo.", "owko", "owwo", ".oo."]),
    happy: eyes(["....", ".oo.", "o..o", "...."]),
    closed: eyes(["....", "....", "o..o", ".oo."]),
    sad: eyes(["....", "oooo", "owko", ".oo."]),
  },
  mouths: {
    smile: [layer(7, 8, ["o..o", ".oo."])],
    neutral: [layer(8, 9, ["oo"])],
    frown: [layer(7, 8, [".oo.", "o..o"])],
  },
  blush: [layer(3, 8, ["pp"]), layer(13, 8, ["pp"])],
  limbs: {
    happy: [tentacles(WAVE_A), tentacles(WAVE_B)],
    idle: [tentacles(WAVE_A), tentacles(WAVE_B)],
    hungry: [tentacles(REST), tentacles(REST)],
    sleeping: [tentacles(REST), tentacles(REST)],
  },
  crownAnchor: { x: 9, y: 0 },
};
