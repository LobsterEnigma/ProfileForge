import { layer, mirror, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 20 × 13. Claws on the outside, eyes on stalks, legs below.

const BODY: Grid = [
  "..oooooooo..",
  ".orhhrrrrro.",
  "orhrrrrrrrro",
  "orrrrrrrrrro",
  ".oddrrrrddo.",
  "..oooooooo..",
];

const EYE_OPEN: Grid = ["oooo", "owko", "owwo", "oooo"];
/** Big shiny pupils with a highlight. */
const EYE_HAPPY: Grid = ["oooo", "okwo", "okko", "oooo"];
const EYE_SAD: Grid = ["....", "oooo", "owko", "oooo"];
/** Real crabs fold their eyes down to sleep: lids resting on the shell, no stalks. */
const EYE_TUCKED: Grid = [".oo.", "orro", "oooo"];

const CLAW_OPEN: Grid = ["oo.oo", "oh.ro", "ohrro", "orrro", ".ooo."];
const CLAW_SHUT: Grid = [".ooo.", "ohrro", "orrro", "orrro", ".ooo."];

const LEGS_A: Grid = [
  "..o.o..........o.o..",
  ".o..o..........o..o.",
];
const LEGS_B: Grid = [
  "...oo..........oo...",
  "..o..o........o..o..",
];

const STALKS = [layer(7, 4, ["o", "o"]), layer(12, 4, ["o", "o"])];
const eyes = (grid: Grid) => [layer(5, 0, grid), layer(11, 0, grid), ...STALKS];
const claws = (grid: Grid, y: number) => [layer(0, y, grid), layer(15, y, mirror(grid))];
const ARMS = [layer(4, 6, ["o"]), layer(15, 6, ["o"])];
const legs = (grid: Grid) => [layer(0, 11, grid)];

const clawsUp = (grid: Grid) => [...claws(grid, 1), ...ARMS];
const clawsDown = (grid: Grid) => claws(grid, 4);

export const crab: Species = {
  id: "crab",
  defaultName: "Pinchy",
  width: 20,
  height: 13,
  palette: {
    o: "#4a1c14",
    r: "#e8553a",
    h: "#ff9a76",
    d: "#b53a24",
    w: "#ffffff",
    k: "#1a1a1a",
    p: "#ff8fa3",
  },
  legendaryPalette: {
    o: "#5a3d0a",
    r: "#f6c343",
    h: "#fff1a8",
    d: "#c99a1a",
  },
  body: [layer(4, 6, BODY)],
  eyes: {
    open: eyes(EYE_OPEN),
    closed: [layer(5, 3, EYE_TUCKED), layer(11, 3, EYE_TUCKED)],
    happy: eyes(EYE_HAPPY),
    sad: eyes(EYE_SAD),
  },
  mouths: {
    smile: [layer(8, 8, ["o..o", ".oo."])],
    neutral: [layer(8, 8, ["....", ".oo."])],
    frown: [layer(8, 8, [".oo.", "o..o"])],
  },
  blush: [layer(5, 9, ["pp"]), layer(13, 9, ["pp"])],
  limbs: {
    // Snapping claws while bouncing around.
    happy: [
      [...clawsUp(CLAW_OPEN), ...legs(LEGS_A)],
      [...clawsUp(CLAW_SHUT), ...legs(LEGS_A)],
    ],
    // Scuttling sideways, like a proper crab.
    idle: [
      [...clawsUp(CLAW_OPEN), ...legs(LEGS_A)],
      [...clawsUp(CLAW_OPEN), ...legs(LEGS_B)],
    ],
    hungry: [
      [...clawsDown(CLAW_OPEN), ...legs(LEGS_A)],
      [...clawsDown(CLAW_OPEN), ...legs(LEGS_A)],
    ],
    sleeping: [
      [...clawsDown(CLAW_SHUT), ...legs(LEGS_A)],
      [...clawsDown(CLAW_SHUT), ...legs(LEGS_A)],
    ],
  },
  crownAnchor: { x: 10, y: 0 },
};
