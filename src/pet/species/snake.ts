import { layer, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 20 × 15. Python blue and yellow: a round head raised on its neck over two coils,
// each a shaded tube with a scaled yellow belly, the tail tip flicking on the right.

const HEAD: Grid = [
  "..oooooo..",
  ".ohhbbbbo.",
  "ohhbbbbbdo",
  "ohbbbbbbdo",
  "obbbbbbbdo",
  ".obyyyydo.",
  "..oooooo..",
];

const NECK: Grid = ["obdo", "obdo", "obdo"];

/** Each coil is a shaded tube: a lit top, the blue body, a scaled yellow belly. */
const TOP_COIL: Grid = [
  "..oooooooooo..",
  ".obhhbbbbbbdo.",
  "obbbbbbbbbbbdo",
  "oyyYyyYyyYyydo",
  ".oooooooooooo.",
];

const BOTTOM_COIL: Grid = [
  "..oooooooooooooo..",
  ".obhhbbbbbbbbbbdo.",
  "obbbbbbbbbbbbbbbdo",
  "oyyYyyYyyYyyYyyydo",
  ".oooooooooooooooo.",
];

const TAIL_UP = layer(18, 7, [".o", "ob", "od", "o."]);
const TAIL_DOWN = layer(18, 9, ["o.", "ob", ".o"]);

export const snake: Species = {
  id: "snake",
  defaultName: "Monty",
  width: 20,
  height: 15,
  palette: {
    o: "#1b2f4a",
    b: "#3776ab",
    h: "#7fb2e0",
    d: "#25507a",
    y: "#ffd43b",
    Y: "#e0a800",
    w: "#ffffff",
    k: "#111111",
    p: "#ff8fa3",
    r: "#e63946",
  },
  legendaryPalette: {
    o: "#5a3d0a",
    b: "#f6c343",
    h: "#fff1a8",
    d: "#c99a1a",
    y: "#fff8d6",
    Y: "#f1d27a",
  },
  body: [layer(1, 10, BOTTOM_COIL), layer(3, 7, TOP_COIL), layer(5, 0, HEAD), layer(8, 5, NECK)],
  eyes: {
    open: [layer(7, 2, ["kw", "kk"]), layer(11, 2, ["kw", "kk"])],
    happy: [layer(6, 2, [".k.", "k.k"]), layer(11, 2, [".k.", "k.k"])],
    closed: [layer(6, 3, ["kkk"]), layer(11, 3, ["kkk"])],
    sad: [layer(7, 2, ["oo", "kk"]), layer(11, 2, ["oo", "kk"])],
  },
  mouths: {
    // Tongue out!
    smile: [layer(8, 4, ["o..o"]), layer(9, 5, ["rr"])],
    neutral: [layer(9, 4, ["oo"])],
    frown: [layer(8, 4, [".oo."]), layer(8, 5, ["o..o"])],
  },
  blush: [layer(6, 4, ["p"]), layer(13, 4, ["p"])],
  limbs: {
    happy: [[TAIL_UP], [TAIL_DOWN]],
    idle: [[TAIL_UP], [TAIL_DOWN]],
    hungry: [[TAIL_DOWN], [TAIL_DOWN]],
    sleeping: [[TAIL_DOWN], [TAIL_DOWN]],
  },
  crownAnchor: { x: 10, y: 0 },
};
