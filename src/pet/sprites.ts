import type { Grid, Palette } from "../svg/pixel.js";

/** Shared sprites that don't belong to any one species. */

export const EGG: Grid = [
  "...oooo...",
  "..occcco..",
  ".occsscco.",
  ".occcccco.",
  "occcccccso",
  "occcccccco",
  "ocssccccco",
  "ocsscccceo",
  "oeccccccco",
  ".oeccccco.",
  "..oeeeeo..",
  "...oooo...",
];

/** Drawn over the egg once it's halfway to hatching. */
export const EGG_CRACK: Grid = [
  "..........",
  "..........",
  "..........",
  "..........",
  "..........",
  "..x.x.....",
  "...x.x.x..",
  "..........",
];

export const EGG_PALETTE: Palette = {
  o: "#5b4636",
  c: "#fbf3e4",
  e: "#e0cfb1",
  s: "#7fc8a9",
  x: "#5b4636",
};

export const CROWN: Grid = [
  "y..y..y",
  "yy.y.yy",
  "yyyyyyy",
  "ygyyygy",
  "YYYYYYY",
];

export const HEART: Grid = ["pp.pp", "ppppp", ".ppp.", "..p.."];
export const ZED: Grid = ["zzz", "..z", ".z.", "z..", "zzz"];
export const SPARKLE: Grid = ["..s..", "..s..", "sssss", "..s..", "..s.."];
/** A contribution-graph square: the pet's favourite food. */
export const COMMIT: Grid = ["gggg", "gGGg", "gGGg", "gggg"];

export const FX_PALETTE: Palette = {
  y: "#ffd54a",
  Y: "#c99a1a",
  g: "#216e39",
  G: "#40c463",
  p: "#ff5c7a",
  s: "#fff3a0",
  z: "var(--pf-muted)",
};
