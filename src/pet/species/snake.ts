import { layer, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 20 × 15. A head raised over a striped coil, tail tip flicking on the right.

const HEAD: Grid = [
  "...oooo...",
  ".oobbbboo.",
  "obbbbbbbbo",
  "obhbbbbbbo",
  "obbbbbbbbo",
  ".oobbbboo.",
  "...obbo...",
];

const COILS: Grid = [
  "....oooooooo....",
  "...obbyybbyybo..",
  "..obbyybbyybbyo.",
  "..oooooooooooo..",
  ".obbyybbyybbyybo",
  "obbyybbyybbyybbo",
  "obbyybbyybbyybbo",
  ".oooooooooooooo.",
];

const TAIL_UP = layer(18, 9, [".o", "oy", "o."]);
const TAIL_DOWN = layer(18, 11, ["o.", "oy", ".o"]);

export const snake: Species = {
  id: "snake",
  defaultName: "Monty",
  width: 20,
  height: 15,
  palette: {
    o: "#1b2f4a",
    b: "#3776ab",
    h: "#6fa3d6",
    y: "#ffd43b",
    w: "#ffffff",
    k: "#111111",
    p: "#ff8fa3",
    r: "#e63946",
  },
  legendaryPalette: {
    o: "#5a3d0a",
    b: "#f6c343",
    h: "#fff1a8",
    y: "#fff8d6",
  },
  body: [layer(2, 7, COILS), layer(5, 0, HEAD)],
  eyes: {
    open: [layer(7, 2, ["kw", "kk"]), layer(11, 2, ["kw", "kk"])],
    happy: [layer(6, 2, [".k.", "k.k"]), layer(11, 2, [".k.", "k.k"])],
    closed: [layer(6, 2, ["k.k", ".k."]), layer(11, 2, ["k.k", ".k."])],
    sad: [layer(7, 2, ["oo", "kk"]), layer(11, 2, ["oo", "kk"])],
  },
  mouths: {
    // Tongue out!
    smile: [layer(8, 4, ["o..o", ".rr."])],
    neutral: [layer(9, 5, ["oo"])],
    frown: [layer(8, 4, [".oo.", "o..o"])],
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
