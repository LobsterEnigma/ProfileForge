import { layer, mirror, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 16 × 17. A round blob with huge eyes, a snout and buck teeth.

const BODY: Grid = [
  "..oooooooooo..",
  ".oghhgggggggo.",
  "oghggggggggggo",
  "oggggggggggggo",
  "oggggggggggggo",
  "oggggggggggggo",
  "oggggggggggggo",
  "oggggggggggggo",
  "oggggggggggggo",
  "oggggggggggggo",
  "oggggggggggggo",
  ".oggggggggggo.",
  "..oooooooooo..",
];

/** Small and rounded, like the real gopher's. */
const EAR: Grid = [".oo", "ogg"];
const SNOUT: Grid = [".kk.", "ssss", ".ss."];
const TEETH = layer(7, 11, ["ww"]);

const ARM: Grid = ["oo", "og", "oo"];
const FOOT: Grid = ["osso", "osso", "oooo"];

const eyes = (grid: Grid) => [layer(2, 4, grid), layer(10, 4, grid)];
const arms = (y = 8) => [layer(0, y, ARM), layer(14, y, mirror(ARM))];
const feet = (leftY = 14) => [layer(3, leftY, FOOT), layer(9, 14, FOOT)];

export const gopher: Species = {
  id: "gopher",
  defaultName: "Gogo",
  width: 16,
  height: 17,
  palette: {
    o: "#1f4e5f",
    g: "#7fd5ea",
    h: "#bdf0fa",
    s: "#f3d6b2",
    k: "#151515",
    w: "#ffffff",
    p: "#ff8fa3",
  },
  legendaryPalette: {
    o: "#5a3d0a",
    g: "#f6c343",
    h: "#fff1a8",
  },
  body: [layer(2, 1, EAR), layer(11, 1, mirror(EAR)), layer(1, 2, BODY), layer(6, 8, SNOUT)],
  eyes: {
    open: eyes([".oo.", "owko", "owwo", ".oo."]),
    happy: eyes(["....", ".oo.", "o..o", "...."]),
    closed: eyes(["....", "....", "o..o", ".oo."]),
    sad: eyes(["....", "oooo", "owko", ".oo."]),
  },
  mouths: {
    smile: [layer(6, 10, ["o..o"]), TEETH],
    neutral: [TEETH],
    frown: [layer(6, 11, ["o..o"]), TEETH],
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
      [...arms(), ...feet(13)],
    ],
    hungry: [
      [...arms(9), ...feet()],
      [...arms(9), ...feet()],
    ],
    sleeping: [
      [...arms(9), ...feet()],
      [...arms(9), ...feet()],
    ],
  },
  crownAnchor: { x: 8, y: 1 },
};
