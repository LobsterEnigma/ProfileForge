import { layer, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 20 × 12, seen from the side (a turtle is unmistakable in profile): a TypeScript-blue
// domed shell with a hexagon scute and a pale rim, a round head with a lighter jaw poking out
// on the right, two legs and a little tail.

const SHELL: Grid = [
  "....ooooo....",
  "..oohhsssoo..",
  ".ohssddddsso.",
  "ohssdssssdsso",
  "ossdssssssdso",
  "osssddddddsso",
  "oeeeeeeeeeeeo",
  ".ooooooooooo.",
];

const HEAD: Grid = [".ooooo.", "ohhgggo", "ogggggo", "ogggggo", "olllllo", ".ooooo."];
const TAIL: Grid = ["..o", "ogo", "oo."];
const LEG: Grid = ["oggo", "oGGo", ".oo."];

const legs = (back = 4, front = 10) => [layer(back, 9, LEG), layer(front, 9, LEG)];

export const turtle: Species = {
  id: "turtle",
  defaultName: "Shelly",
  width: 20,
  height: 12,
  facing: "right",
  palette: {
    o: "#13304f",
    s: "#3178c6",
    h: "#86b8ee",
    d: "#1f5596",
    e: "#a8cbf2",
    g: "#9ad3a8",
    G: "#6fb482",
    l: "#c9ecd2",
    k: "#111111",
    w: "#ffffff",
    p: "#ff8fa3",
  },
  legendaryPalette: {
    o: "#5a3d0a",
    s: "#f6c343",
    h: "#fff1a8",
    d: "#c99a1a",
    e: "#fff1a8",
  },
  body: [layer(0, 6, TAIL), layer(2, 1, SHELL), layer(13, 2, HEAD)],
  eyes: {
    open: [layer(16, 3, ["kw", "kk"])],
    happy: [layer(15, 3, [".k.", "k.k"])],
    closed: [layer(16, 4, ["kk"])],
    sad: [layer(16, 3, ["oo", "kk"])],
  },
  mouths: {
    smile: [layer(15, 5, ["k..k"]), layer(16, 6, ["kk"])],
    neutral: [layer(16, 6, ["kk"])],
    frown: [layer(16, 5, ["kk"]), layer(15, 6, ["k..k"])],
  },
  blush: [layer(14, 5, ["p"])],
  limbs: {
    // A happy little shuffle.
    happy: [legs(), legs(5, 9)],
    // Slow and steady.
    idle: [legs(), legs(5, 9)],
    hungry: [legs(), legs()],
    // Tucked into its shell.
    sleeping: [[], []],
  },
  crownAnchor: { x: 8, y: 1 },
};
