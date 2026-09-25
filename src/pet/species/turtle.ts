import { layer, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 20 × 12, seen from the side (a turtle is unmistakable in profile): a TypeScript-blue
// domed shell with a hexagon, the head poking out on the right, two legs and a little tail.

const SHELL: Grid = [
  "...oooooo...",
  ".oohsssssoo.",
  "ohsssddsssso",
  "osssdssdssso",
  "ossdssssdsso",
  "osssddddssso",
  "oeeeeeeeeeeo",
  ".oooooooooo.",
];

const HEAD: Grid = [".oooo.", "oggggo", "oggggo", "oggggo", ".oooo."];
const TAIL: Grid = ["oo", ".o"];
const LEG: Grid = ["ogo", "ogo", "ooo"];

const legs = (back = 4, front = 11) => [layer(back, 9, LEG), layer(front, 9, LEG)];

export const turtle: Species = {
  id: "turtle",
  defaultName: "Shelly",
  width: 20,
  height: 12,
  facing: "right",
  palette: {
    o: "#13304f",
    s: "#3178c6",
    h: "#7fb0e8",
    d: "#235a97",
    e: "#9fc3ec",
    g: "#9ad3a8",
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
  body: [layer(1, 7, TAIL), layer(3, 2, SHELL), layer(14, 4, HEAD)],
  eyes: {
    open: [layer(16, 5, ["kw", "kk"])],
    happy: [layer(16, 5, [".k", "k."])],
    closed: [layer(16, 6, ["kk"])],
    sad: [layer(16, 5, ["oo", "kk"])],
  },
  mouths: {
    smile: [layer(17, 7, ["kk"]), layer(18, 6, ["k"])],
    neutral: [layer(17, 7, ["kk"])],
    frown: [layer(16, 7, ["kk"])],
  },
  blush: [layer(15, 7, ["p"])],
  limbs: {
    // A happy little shuffle.
    happy: [legs(), legs(5, 10)],
    // Slow and steady.
    idle: [legs(), legs(5, 10)],
    hungry: [legs(), legs()],
    // Tucked into its shell.
    sleeping: [[], []],
  },
  crownAnchor: { x: 9, y: 2 },
};
