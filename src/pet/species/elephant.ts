import { layer, mirror, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 20 × 14. Front view: big ears, trunk in the middle, feet peeking out below.

const TORSO: Grid = [
  ".oooooooooooo.",
  "obbbbbbbbbbbbo",
  "obbbbbbbbbbbbo",
  "obbbbbbbbbbbbo",
];

const HEAD: Grid = [
  "..oooooooo..",
  ".obbbbbbbbo.",
  "obhhbbbbbbbo",
  "obhbbbbbbbbo",
  "obbbbbbbbbbo",
  "obbbbbbbbbbo",
  "obbbbbbbbbbo",
  ".obbbbbbbbo.",
  "..odbbbbdo..",
  "...oobboo...",
];

const TRUNK: Grid = ["obbo", "obbo", "obbo", ".oo."];

const EAR: Grid = [
  ".ooo.",
  "obbbo",
  "obeeb",
  "obeeb",
  "obeeb",
  "obbeb",
  ".obbb",
  "..ooo",
];
/** Mid-flap: pulled in towards the head. */
const EAR_FLAP: Grid = [
  "..oo.",
  ".obbo",
  ".obeb",
  ".obeb",
  ".obeb",
  ".obbb",
  "..obb",
  "...oo",
];

const FOOT: Grid = ["obo", "obo", "ooo"];

const ears = (grid: Grid, y = 1) => [layer(0, y, grid), layer(15, y, mirror(grid))];
const feet = (leftY = 11, rightY = 11) => [layer(4, leftY, FOOT), layer(13, rightY, FOOT)];
const pair = (x: number, y: number, grid: Grid, gap: number) => [layer(x, y, grid), layer(x + gap, y, grid)];

export const elephant: Species = {
  id: "elephant",
  defaultName: "Ellie",
  width: 20,
  height: 14,
  palette: {
    o: "#2d2a4a",
    b: "#8892bf",
    h: "#b7bfe8",
    d: "#6c74a8",
    e: "#d8a7c4",
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
    e: "#ffd98a",
  },
  body: [layer(3, 7, TORSO), layer(4, 0, HEAD), layer(8, 10, TRUNK), layer(7, 10, ["t"]), layer(12, 10, ["t"])],
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
