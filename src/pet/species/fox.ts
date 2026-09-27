import { layer, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 18 × 16, from the front, sitting (Ruby: red as a gem): pointed ears with dark tips, a
// white muzzle and cheeks, a white bib, black socks, and a big white-tipped tail at its side.

const HEAD: Grid = [
  ".o..........o.",
  "oko........oko",
  "oiro......orio",
  "oirroooooorrio",
  "orrrrrrrrrrrro",
  "orrrrrrrrrrrro",
  "orrrrrrrrrrrro",
  "owwrrrrrrrrwwo",
  ".owwwwnnwwwwo.",
  "..oowwwwwwoo..",
  "....oooooo....",
];

const BODY: Grid = [
  "..orrrrrro..",
  ".orrwwwwrro.",
  "orrrwwwwrrro",
  "orrrrwwrrrro",
  "orrrrrrrrrro",
  ".oooooooooo.",
];

/** A bushy tail curled up at its side, the tip white. */
const TAIL: Grid = ["...oo.", "..owwo", ".owwro", ".orrro", "orrrro", "orrrro", ".orrro", "..ooo."];
const TAIL_WAG: Grid = ["....oo", "...owo", "..owwo", ".orrro", "orrrro", "orrrro", ".orrro", "..ooo."];
const DROOP: Grid = ["......", "......", "......", "......", "..ooo.", ".orrro", "orrrwo", ".oooo."];

const PAW: Grid = ["okko", "oooo"];

const paws = (lift = 0) => [layer(5, 14 - lift, PAW), layer(9, 14, PAW)];
const tail = (grid: Grid) => [layer(12, 7, grid)];

export const fox: Species = {
  id: "fox",
  defaultName: "Ember",
  width: 18,
  height: 16,
  palette: {
    o: "#4a1a0c",
    r: "#e8622c",
    i: "#ffb3a0",
    w: "#fff4e6",
    n: "#1a1a1a",
    k: "#1a1a1a",
    p: "#ff8fa3",
  },
  legendaryPalette: {
    o: "#5a3d0a",
    r: "#f6c343",
    i: "#fff1a8",
  },
  body: [layer(3, 9, BODY), layer(2, 0, HEAD)],
  eyes: {
    open: [layer(5, 5, ["kw", "kk"]), layer(11, 5, ["kw", "kk"])],
    happy: [layer(5, 5, [".k.", "k.k"]), layer(10, 5, [".k.", "k.k"])],
    closed: [layer(5, 6, ["kk"]), layer(11, 6, ["kk"])],
    sad: [layer(5, 5, ["oo", "kk"]), layer(11, 5, ["oo", "kk"])],
  },
  mouths: {
    smile: [layer(7, 9, ["k..k"])],
    neutral: [layer(8, 9, ["kk"])],
    frown: [layer(7, 9, [".kk."])],
  },
  blush: [layer(3, 7, ["p"]), layer(14, 7, ["p"])],
  limbs: {
    // The tail wags.
    happy: [[...tail(TAIL), ...paws()], [...tail(TAIL_WAG), ...paws(1)]],
    idle: [[...tail(TAIL), ...paws()], [...tail(TAIL_WAG), ...paws()]],
    // Tail drooping.
    hungry: [[...tail(DROOP), ...paws()], [...tail(DROOP), ...paws()]],
    // Curled up, the tail as a blanket.
    sleeping: [[...tail(TAIL), ...paws()], [...tail(TAIL), ...paws()]],
  },
  crownAnchor: { x: 9, y: 3 },
};
