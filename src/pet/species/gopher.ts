import { layer, mirror, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 16 × 17. The Go gopher: a round blue bean with huge eyes, a pale tummy, a beige
// snout with a black nose and buck teeth, little ears, beige paws. Lit from the top left.

const BODY: Grid = [
  "....oooooo....",
  "..oohhhgggoo..",
  ".ohhgggggggdo.",
  "ohhgggggggggdo",
  "ohgggggggggggo",
  "ogggggggggggdo",
  "ogggggggggggdo",
  "ogggggggggggdo",
  "oggglllllgggdo",
  "ogglllllllggdo",
  "ogglllllllgddo",
  ".ogglllllgddo.",
  "..oddddddddo..",
  "....oooooo....",
];

/** Small and rounded, like the real gopher's. */
const EAR: Grid = [".oo", "ohd"];
const SNOUT: Grid = ["..kk..", ".ssss.", "ssssss", ".SSSS."];
const TEETH = layer(7, 12, ["ww"]);

const ARM: Grid = [".o", "os", "oS", ".o"];
const FOOT: Grid = ["ossso", ".ooo."];

const eyes = (grid: Grid) => [layer(3, 4, grid), layer(9, 4, grid)];
const arms = (y = 9) => [layer(0, y, ARM), layer(14, y, mirror(ARM))];
const feet = (leftY = 15) => [layer(3, leftY, FOOT), layer(8, 15, FOOT)];

export const gopher: Species = {
  id: "gopher",
  defaultName: "Gogo",
  width: 16,
  height: 17,
  palette: {
    o: "#1f4e5f",
    g: "#7fd5ea",
    h: "#c9f3fb",
    d: "#57b3cc",
    l: "#d9f7fc",
    s: "#f3d6b2",
    S: "#d9b48a",
    k: "#151515",
    w: "#ffffff",
    p: "#ff8fa3",
  },
  legendaryPalette: {
    o: "#5a3d0a",
    g: "#f6c343",
    h: "#fff1a8",
    d: "#d9a21c",
    l: "#fde7a0",
  },
  body: [layer(3, 1, EAR), layer(10, 1, mirror(EAR)), layer(1, 2, BODY), layer(5, 8, SNOUT)],
  eyes: {
    open: eyes([".oo.", "owko", "owwo", ".oo."]),
    happy: eyes(["....", ".oo.", "o..o", "...."]),
    closed: eyes(["....", "....", "o..o", ".oo."]),
    sad: eyes(["....", "oooo", "owko", ".oo."]),
  },
  mouths: {
    smile: [layer(6, 11, ["o..o"]), TEETH],
    neutral: [TEETH],
    frown: [layer(6, 12, ["o..o"]), TEETH],
  },
  blush: [layer(2, 9, ["pp"]), layer(12, 9, ["pp"])],
  limbs: {
    // Waving both paws.
    happy: [
      [...arms(), ...feet()],
      [...arms(6), ...feet()],
    ],
    // Waddling.
    idle: [
      [...arms(), ...feet()],
      [...arms(), ...feet(14)],
    ],
    hungry: [
      [...arms(10), ...feet()],
      [...arms(10), ...feet()],
    ],
    sleeping: [
      [...arms(10), ...feet()],
      [...arms(10), ...feet()],
    ],
  },
  crownAnchor: { x: 8, y: 1 },
};
