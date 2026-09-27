import { layer, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 20 × 14, from the side (Shell: it carries its own): a spiral shell on its back, a soft
// body gliding underneath, and eyes on two stalks up front.

const SHELL: Grid = [
  "...ooooo...",
  ".ooyyyyyoo.",
  "oyyhrrrryyo",
  "oyhryyyyryo",
  "oyryyrryryo",
  "oyryryyryyo",
  "oyryyrryyyo",
  "oyyryyyyryo",
  ".oyyrrrryo.",
  "..ooooooo..",
];

const FOOT: Grid = [
  "..............bbbbo.",
  ".oobbbbbbbbbbbbbbo..",
  "obbbbbbbbbbbbbbbbbo.",
  ".oooooooooooooooooo.",
];

const HEAD: Grid = [".oooo.", "obbbbo", "obbbbo", "obbbbo", "obbbbo"];
const STALK: Grid = ["g", "g", "g"];

const stalks = (tilt = 0) => [layer(14 + tilt, 3, STALK), layer(17 + tilt, 3, STALK)];

export const snail: Species = {
  id: "snail",
  defaultName: "Bash",
  width: 20,
  height: 14,
  facing: "right",
  palette: {
    o: "#3d2b1f",
    y: "#e9b04f",
    h: "#f7dc93",
    r: "#9a5d27",
    b: "#b9dcc3",
    g: "#7fb592",
    k: "#1a1a1a",
    w: "#ffffff",
    p: "#ff8fa3",
  },
  legendaryPalette: {
    o: "#5a3d0a",
    y: "#f6c343",
    h: "#fff1a8",
    r: "#c99a1a",
  },
  body: [layer(0, 10, FOOT), layer(13, 6, HEAD), layer(2, 1, SHELL)],
  eyes: {
    open: [layer(13, 1, ["wk", "kk"]), layer(16, 1, ["wk", "kk"])],
    happy: [layer(13, 1, ["k.", ".k"]), layer(16, 1, ["k.", ".k"])],
    closed: [layer(13, 2, ["kk"]), layer(16, 2, ["kk"])],
    sad: [layer(13, 1, ["oo", "kk"]), layer(16, 1, ["oo", "kk"])],
  },
  mouths: {
    smile: [layer(16, 9, ["k"]), layer(17, 8, ["k"])],
    neutral: [layer(16, 9, ["kk"])],
    frown: [layer(16, 8, ["k"]), layer(17, 9, ["k"])],
  },
  blush: [layer(14, 8, ["pp"])],
  limbs: {
    // The stalks bob as it glides.
    happy: [stalks(), stalks(1)],
    idle: [stalks(), stalks()],
    hungry: [stalks(), stalks()],
    sleeping: [stalks(), stalks()],
  },
  crownAnchor: { x: 7, y: 1 },
};
