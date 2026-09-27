import { layer, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 20 × 13, seen from the side like the turtle (a capybara is all profile): a barrel of
// a body, a big boxy head with a blunt snout on the right, tiny ears, and total calm.

const BODY: Grid = [
  ".......ooooooooo..",
  ".....oobbhhhhbbboo",
  "...oobbhhbbbbbbbbb",
  "..obbbbbbbbbbbbbbb",
  ".obbbbbbbbbbbbbbbb",
  "obbbbbbbbbbbbbbbbb",
  "obbbbbbbbbbbbbbbbb",
  "obbbbbbbbbbbbbbbbb",
  ".obbbbbbbbbbbbbbbo",
  "..oddddddddddddddo",
  "...oooooooooooooo.",
];

/** The head: tall and boxy, the snout square at the front, a dark nose on top of it. */
const HEAD: Grid = [
  ".ooooo..",
  "obbbbboo",
  "bbbbbbbo",
  "bbbbbddo",
  "bbbbbdno",
  "bbbbbddo",
  "bbbbbbbo",
  "bbbbbbbo",
  "bbbbbboo",
];

const EAR: Grid = ["oo", "od"];
const LEG: Grid = ["obo", "odo", "ooo"];

const legs = (back = 3, front = 12, lift = 0) => [layer(back, 10 - lift, LEG), layer(front, 10, LEG)];

export const capybara: Species = {
  id: "capybara",
  defaultName: "Mocha",
  width: 20,
  height: 13,
  facing: "right",
  palette: {
    o: "#3b2616",
    b: "#a9764d",
    h: "#c99a6e",
    d: "#86573a",
    n: "#2a1a10",
    k: "#1a1a1a",
    w: "#ffffff",
    p: "#ff8fa3",
  },
  legendaryPalette: {
    o: "#5a3d0a",
    b: "#f6c343",
    h: "#fff1a8",
    d: "#c99a1a",
  },
  body: [layer(0, 1, BODY), layer(12, 0, HEAD), layer(13, 0, EAR)],
  eyes: {
    open: [layer(15, 2, ["kw", "kk"])],
    happy: [layer(15, 2, [".k", "k."])],
    closed: [layer(15, 3, ["kk"])],
    sad: [layer(15, 2, ["oo", "kk"])],
  },
  mouths: {
    smile: [layer(17, 7, ["kk"]), layer(16, 6, ["k"])],
    neutral: [layer(17, 7, ["kk"])],
    frown: [layer(16, 7, ["kk"])],
  },
  blush: [layer(14, 5, ["pp"])],
  limbs: {
    // An unhurried trot.
    happy: [legs(), legs(4, 11, 1)],
    idle: [legs(), legs(4, 11)],
    hungry: [legs(), legs()],
    // Lying down: legs tucked away.
    sleeping: [[], []],
  },
  crownAnchor: { x: 15, y: 0 },
};
