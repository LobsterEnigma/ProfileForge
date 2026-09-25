import { layer, mirror, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 18 × 15. A round JavaScript-yellow chick with a feather tuft, wings and orange feet.

const BODY: Grid = [
  "....oooooo....",
  "..oohyyyyyoo..",
  ".ohyyyyyyyyyo.",
  ".oyyyyyyyyyyo.",
  "oyyyyyyyyyyyyo",
  "oyyyyyyyyyyyyo",
  "oyyyyyyyyyyyyo",
  "oyyyyyyyyyyyyo",
  "oyyyyyyyyyyyyo",
  ".oyyyyyyyyyyo.",
  "..oyyyyyyyyo..",
  "...oooooooo...",
];

const WING: Grid = ["oo.", "oyo", "oyo", ".oo"];
const WING_UP: Grid = [".oo", "oyo", "oo."];
const FOOT: Grid = ["b.b", "bbb"];

const wings = (grid: Grid, y: number) => [layer(0, y, grid), layer(15, y, mirror(grid))];
const feet = (leftY = 13) => [layer(5, leftY, FOOT), layer(10, 13, FOOT)];
const eyes = (grid: Grid, x = 5) => [layer(x, 5, grid), layer(x + 6, 5, grid)];

export const chick: Species = {
  id: "chick",
  defaultName: "Chirpy",
  width: 18,
  height: 15,
  palette: {
    o: "#5c4400",
    y: "#f7df1e",
    h: "#fff59d",
    b: "#f28c28",
    r: "#c0392b",
    k: "#1a1a1a",
    w: "#ffffff",
    p: "#ff8fa3",
  },
  legendaryPalette: {
    o: "#7a5200",
    y: "#ffd54a",
    h: "#ffffff",
  },
  body: [layer(8, 0, ["oo"]), layer(2, 1, BODY)],
  eyes: {
    open: eyes(["kw", "kk"]),
    happy: eyes([".kk.", "k..k"], 4),
    closed: eyes(["k..k", ".kk."], 4),
    sad: eyes(["oo", "kk"]),
  },
  mouths: {
    // Beak open mid-chirp.
    smile: [layer(7, 7, ["bbbb", ".rr.", ".bb."])],
    neutral: [layer(7, 7, ["bbbb", ".bb."])],
    frown: [layer(7, 8, [".bb.", "bbbb"])],
  },
  blush: [layer(3, 7, ["pp"]), layer(13, 7, ["pp"])],
  limbs: {
    // Flapping with joy.
    happy: [
      [...wings(WING, 6), ...feet()],
      [...wings(WING_UP, 4), ...feet()],
    ],
    // Hopping along.
    idle: [
      [...wings(WING, 6), ...feet()],
      [...wings(WING, 6), ...feet(12)],
    ],
    hungry: [
      [...wings(WING, 7), ...feet()],
      [...wings(WING, 7), ...feet()],
    ],
    sleeping: [
      [...wings(WING, 7), ...feet()],
      [...wings(WING, 7), ...feet()],
    ],
  },
  crownAnchor: { x: 9, y: 0 },
};
