import { layer, mirror, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 20 × 14. The PHP elephant from the front: a round head with big fan ears (pink
// inside), a trunk with a lighter underside, little tusks, and feet with toenails.

const TORSO: Grid = [
  ".oooooooooooo.",
  "obbbbbbbbbbbdo",
  "obbbbbbbbbbbdo",
  "obbbbbbbbbbbdo",
  ".oddddddddddo.",
];

const HEAD: Grid = [
  "..oooooooo..",
  ".ohhbbbbbbo.",
  "ohhbbbbbbbdo",
  "ohbbbbbbbbdo",
  "obbbbbbbbbdo",
  "obbbbbbbbbdo",
  "obbbbbbbbbdo",
  ".obbbbbbbdo.",
  "..obbbbbdo..",
  "...oobboo...",
];

const TRUNK: Grid = ["obdo", "obdo", "olbo", ".oo."];

const EAR: Grid = [
  ".ooo.",
  "ohhbo",
  "obeeo",
  "obeeo",
  "obeeo",
  "obeeo",
  "obbeo",
  ".obdo",
  "..oo.",
];
/** Mid-flap: pulled in towards the head. */
const EAR_FLAP: Grid = [
  "..oo.",
  ".ohbo",
  ".obeo",
  ".obeo",
  ".obeo",
  ".obeo",
  "..obo",
  "...o.",
  ".....",
];

const FOOT: Grid = ["obdo", "otto", "oooo"];

const ears = (grid: Grid, y = 1) => [layer(0, y, grid), layer(15, y, mirror(grid))];
const feet = (leftY = 11, rightY = 11) => [layer(4, leftY, FOOT), layer(12, rightY, FOOT)];
const pair = (x: number, y: number, grid: Grid, gap: number) => [layer(x, y, grid), layer(x + gap, y, grid)];

export const elephant: Species = {
  id: "elephant",
  defaultName: "Ellie",
  width: 20,
  height: 14,
  palette: {
    o: "#2d2a4a",
    b: "#8892bf",
    h: "#b9c1ea",
    d: "#6770a3",
    l: "#a9b1dc",
    e: "#e6a9c6",
    t: "#fffaf0",
    w: "#ffffff",
    k: "#151515",
    p: "#ff8fa3",
  },
  legendaryPalette: {
    o: "#5a3d0a",
    b: "#f6c343",
    h: "#fff1a8",
    d: "#c99a1a",
    l: "#fde7a0",
    e: "#ffd98a",
  },
  body: [layer(3, 8, TORSO), layer(4, 0, HEAD), layer(8, 10, TRUNK), layer(7, 9, ["t"]), layer(12, 9, ["t"])],
  eyes: {
    open: pair(6, 4, ["kw", "kk"], 6),
    happy: pair(5, 4, [".kk.", "k..k"], 6),
    closed: pair(5, 4, ["k..k", ".kk."], 6),
    sad: pair(6, 4, ["dd", "kk"], 6),
  },
  mouths: {
    smile: [layer(7, 8, ["k"]), layer(12, 8, ["k"])],
    neutral: [],
    frown: [],
  },
  blush: [layer(5, 6, ["pp"]), layer(13, 6, ["pp"])],
  limbs: {
    // Flapping ears.
    happy: [
      [...ears(EAR), ...feet()],
      [...ears(EAR_FLAP), ...feet()],
    ],
    // Plodding along.
    idle: [
      [...ears(EAR), ...feet()],
      [...ears(EAR), ...feet(10, 11)],
    ],
    hungry: [
      [...ears(EAR, 2), ...feet()],
      [...ears(EAR, 2), ...feet()],
    ],
    sleeping: [
      [...ears(EAR, 2), ...feet()],
      [...ears(EAR, 2), ...feet()],
    ],
  },
  crownAnchor: { x: 10, y: 0 },
};
