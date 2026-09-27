import { layer, type Grid } from "../../svg/pixel.js";
import type { Species } from "./types.js";

// Canvas: 20 × 13, from the side (C sharp: all spikes): a dome of prickles, a cream face with a
// pointy snout and a black button nose on the right, tiny feet.

/** The dome's shape; `x` becomes quills, striped so they sweep back and up. */
const DOME: Grid = [
  "....o.o.o.o.....",
  "..o.oxoxoxo.o...",
  ".oxoxxxxxxxoxo..",
  "oxxxxxxxxxxxxxo.",
  "oxxxxxxxxxxxxxo.",
  "oxxxxxxxxxxxxxo.",
  "oxxxxxxxxxxxxxo.",
  "oxxxxxxxxxxxxxo.",
  ".oxxxxxxxxxxxo..",
  "..offffffffffo..",
  "...oooooooooo...",
];
const SPIKES: Grid = DOME.map((row, y) => [...row].map((c, x) => (c === "x" ? ((((x - y) % 3) + 3) % 3 === 0 ? "S" : "s") : c)).join(""));

/** A cream face with a pointy snout and the nose right at its tip. */
const FACE: Grid = [
  "oo......",
  "ffo.....",
  "fffoo...",
  "ffffffoo",
  "fffffffn",
  "ffffffoo",
  "fffoo...",
  "ooo.....",
];

const EAR: Grid = ["oo", "oi"];
const FOOT: Grid = ["off", "ooo"];

const feet = (back = 3, front = 10, lift = 0) => [layer(back, 11 - lift, FOOT), layer(front, 11, FOOT)];

export const hedgehog: Species = {
  id: "hedgehog",
  defaultName: "Spike",
  width: 20,
  height: 13,
  facing: "right",
  palette: {
    o: "#2e1d12",
    s: "#6b4a33",
    S: "#a67b55",
    f: "#f3d9b1",
    i: "#e8a0a0",
    n: "#141414",
    k: "#141414",
    w: "#ffffff",
    p: "#ff8fa3",
  },
  legendaryPalette: {
    o: "#5a3d0a",
    s: "#c99a1a",
    S: "#fff1a8",
  },
  body: [layer(0, 0, SPIKES), layer(11, 3, FACE), layer(12, 2, EAR)],
  eyes: {
    open: [layer(13, 5, ["kw", "kk"])],
    happy: [layer(13, 5, [".k", "k."])],
    closed: [layer(13, 6, ["kk"])],
    sad: [layer(13, 5, ["oo", "kk"])],
  },
  mouths: {
    smile: [layer(15, 8, ["kk"])],
    neutral: [layer(15, 8, ["k"])],
    frown: [layer(14, 8, ["k"]), layer(15, 7, ["k"])],
  },
  blush: [layer(12, 7, ["pp"])],
  limbs: {
    // Pitter-patter.
    happy: [feet(), feet(4, 9, 1)],
    idle: [feet(), feet(4, 9)],
    hungry: [feet(), feet()],
    // Curled up.
    sleeping: [[], []],
  },
  crownAnchor: { x: 7, y: 0 },
};
