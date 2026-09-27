import { layer, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 22 × 12, from the side (Kotlin: Java's nimble modern cousin): a long sleek body, a
// thick tapering tail, a round head with a cream muzzle, and a Kotlin-purple bandana.

const BODY: Grid = [
  "........oooooooo..",
  "......oobbhhhhbbbo",
  "....oobbbbbbbbbbbb",
  "ooooobbbbbbbbbbbbb",
  "obbbbbbbbbbbbbbbbb",
  ".oooobbbbbbbbbbbbb",
  ".....obccccccccbbo",
  "......oooooooooo..",
];

const HEAD: Grid = [
  ".oo.....",
  "oboooo..",
  "obbbbboo",
  "bbbbbbbo",
  "bbbbbccn",
  "bbbbcccc",
  "obbbcccc",
  ".ooooooo",
];

const BANDANA: Grid = ["vv", "vv", "vV", "vv", ".v"];
const LEG: Grid = ["obo", "ooo"];

const legs = (back = 5, front = 13, lift = 0) => [layer(back, 10 - lift, LEG), layer(front, 10, LEG)];

export const otter: Species = {
  id: "otter",
  defaultName: "Kody",
  width: 22,
  height: 12,
  facing: "right",
  palette: {
    o: "#2e1b10",
    b: "#8a5a3a",
    h: "#b07d56",
    c: "#f1dcc0",
    n: "#1a1a1a",
    v: "#7f52ff",
    V: "#e44857",
    k: "#1a1a1a",
    w: "#ffffff",
    p: "#ff8fa3",
  },
  legendaryPalette: {
    o: "#5a3d0a",
    b: "#f6c343",
    h: "#fff1a8",
  },
  body: [layer(0, 2, BODY), layer(14, 1, HEAD), layer(13, 3, BANDANA)],
  eyes: {
    open: [layer(17, 3, ["kw", "kk"])],
    happy: [layer(17, 3, [".k", "k."])],
    closed: [layer(17, 4, ["kk"])],
    sad: [layer(17, 3, ["oo", "kk"])],
  },
  mouths: {
    smile: [layer(19, 7, ["k"]), layer(20, 6, ["k"])],
    neutral: [layer(19, 7, ["kk"])],
    frown: [layer(19, 6, ["k"]), layer(20, 7, ["k"])],
  },
  blush: [layer(16, 6, ["pp"])],
  limbs: {
    // Scampering.
    happy: [legs(), legs(6, 12, 1)],
    idle: [legs(), legs(6, 12)],
    hungry: [legs(), legs()],
    // Curled up on its side.
    sleeping: [[], []],
  },
  crownAnchor: { x: 17, y: 1 },
};
