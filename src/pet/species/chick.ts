import { layer, mirror, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 18 × 15. A round JavaScript-yellow chick: a fluffy tuft, a paler tummy, shading
// underneath, little wings, a two-tone beak and orange feet.

const BODY: Grid = [
  "....oooooo....",
  "..oohhyyyyoo..",
  ".ohyyyyyyyydo.",
  ".oyyyyyyyyydo.",
  "oyyyyyyyyyyydo",
  "oyyyyyyyyyyydo",
  "oyyyyllllyyydo",
  "oyyyllllllyydo",
  "oyyyllllllyddo",
  ".oyyllllllddo.",
  "..oddddddddo..",
  "...oooooooo...",
];

const TUFT: Grid = ["o.o", ".o."];
const WING: Grid = ["oo.", "oyo", "odo", ".oo"];
const WING_UP: Grid = [".oo", "oyo", "oo."];
const FOOT: Grid = ["b.b", "bbb"];

const wings = (grid: Grid, y: number) => [layer(0, y, grid), layer(15, y, mirror(grid))];
const feet = (leftY = 13) => [layer(5, leftY, FOOT), layer(10, 13, FOOT)];
const eyes = (grid: Grid, x = 5) => [layer(x, 6, grid), layer(x + 6, 6, grid)];

export const chick: Species = {
  id: "chick",
  defaultName: "Chirpy",
  width: 18,
  height: 15,
  palette: {
    o: "#6b4a00",
    y: "#f7df1e",
    h: "#fff9b0",
    l: "#fff09a",
    d: "#dcb800",
    b: "#f28c28",
    B: "#c8641a",
    r: "#c0392b",
    k: "#1a1a1a",
    w: "#ffffff",
    p: "#ff8fa3",
  },
  legendaryPalette: {
    o: "#7a5200",
    y: "#ffd54a",
    h: "#ffffff",
    l: "#fff4c4",
    d: "#e0a800",
  },
  body: [layer(8, 0, TUFT), layer(2, 2, BODY)],
  eyes: {
    open: eyes(["kw", "kk"]),
    happy: eyes([".kk.", "k..k"], 4),
    closed: eyes(["k..k", ".kk."], 4),
    sad: eyes(["oo", "kk"]),
  },
  mouths: {
    // Beak open mid-chirp.
    smile: [layer(7, 8, ["bbbb", ".rr.", ".BB."])],
    neutral: [layer(7, 8, ["bbbb", ".BB."])],
    frown: [layer(7, 9, [".BB.", "bbbb"])],
  },
  blush: [layer(3, 9, ["pp"]), layer(13, 9, ["pp"])],
  limbs: {
    // Flapping with joy.
    happy: [
      [...wings(WING, 7), ...feet()],
      [...wings(WING_UP, 5), ...feet()],
    ],
    // Hopping along.
    idle: [
      [...wings(WING, 7), ...feet()],
      [...wings(WING, 7), ...feet(12)],
    ],
    hungry: [
      [...wings(WING, 8), ...feet()],
      [...wings(WING, 8), ...feet()],
    ],
    sleeping: [
      [...wings(WING, 8), ...feet()],
      [...wings(WING, 8), ...feet()],
    ],
  },
  crownAnchor: { x: 9, y: 1 },
};
