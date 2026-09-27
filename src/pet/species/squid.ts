import { layer, mirror, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 18 × 17, from the front (C++: C's octopus, plus two): a pointed mantle with fins, big
// eyes, eight short arms and two long tentacles with clubs at the ends, in C++ blue.

const MANTLE: Grid = [
  "....oo....",
  "...ohbo...",
  "..ohbbbo..",
  ".ohbbbbbo.",
  "ohbbbbbbbo",
  "ohbbbbbbbo",
  "obbbbbbbbo",
  "obbbbbbbbo",
  "obbbbbbbbo",
  "obbbbbbbbo",
  "obbbbbbbbo",
  ".obbbbbbo.",
];

const FIN: Grid = ["...o", "..ob", ".obb", "obbb", ".oob", "...o"];

/** Eight short arms under the mantle, and two long tentacles swinging at the sides. */
const ARMS_A: Grid = [
  "..obbbbbbbbbbo..",
  ".obobobobobobo..",
  "ob.ob.ob.ob.ob.o",
  "o..o..o..o..o..o",
];
const ARMS_B: Grid = [
  "..obbbbbbbbbbo..",
  "..obobobobobobo.",
  ".o.bo.bo.bo.bo.o",
  "...o..o..o..o...",
];
const TENTACLE_A: Grid = ["o..", "bo.", "bo.", "bo.", "bbo", "obb"];
const TENTACLE_B: Grid = [".o.", "ob.", "ob.", "ob.", "obb", "bbo"];
const REST: Grid = [
  "..obbbbbbbbbbo..",
  ".obbbbbbbbbbbbo.",
  "obobobobobobobo.",
  "................",
];

const eyes = (grid: Grid) => [layer(6, 7, grid), layer(10, 7, grid)];
const arms = (skirt: Grid, left: Grid, right: Grid) => [layer(1, 12, skirt), layer(0, 11, left), layer(15, 11, right)];

export const squid: Species = {
  id: "squid",
  defaultName: "Plus",
  width: 18,
  height: 17,
  palette: {
    o: "#0b2a4a",
    b: "#4f8fd8",
    h: "#9cc4f0",
    k: "#111111",
    w: "#ffffff",
    p: "#ffb3c6",
  },
  legendaryPalette: {
    o: "#5a3d0a",
    b: "#f6c343",
    h: "#fff1a8",
  },
  body: [layer(1, 2, FIN), layer(13, 2, mirror(FIN)), layer(4, 0, MANTLE)],
  eyes: {
    open: eyes(["wk", "kk"]),
    happy: eyes([".o.", "o.o"]),
    closed: eyes(["...", "ooo"]),
    sad: eyes(["oo", "kk"]),
  },
  mouths: {
    smile: [layer(8, 10, ["o..o"]), layer(9, 11, ["oo"])],
    neutral: [layer(9, 10, ["oo"])],
    frown: [layer(9, 10, ["oo"]), layer(8, 11, ["o..o"])],
  },
  blush: [layer(4, 10, ["pp"]), layer(12, 10, ["pp"])],
  limbs: {
    happy: [arms(ARMS_A, TENTACLE_A, mirror(TENTACLE_A)), arms(ARMS_B, TENTACLE_B, mirror(TENTACLE_B))],
    idle: [arms(ARMS_A, TENTACLE_A, mirror(TENTACLE_A)), arms(ARMS_B, TENTACLE_B, mirror(TENTACLE_B))],
    hungry: [arms(REST, TENTACLE_B, mirror(TENTACLE_B)), arms(REST, TENTACLE_B, mirror(TENTACLE_B))],
    sleeping: [arms(REST, TENTACLE_B, mirror(TENTACLE_B)), arms(REST, TENTACLE_B, mirror(TENTACLE_B))],
  },
  crownAnchor: { x: 9, y: 0 },
};
