/**
 * A tiny 5-pixel-tall pixel font, for words on banners, bubbles and postcards.
 * Every glyph is drawn with "x"; M, N and W are wider so they stay readable.
 */
import type { Grid } from "./pixel.js";

const GLYPHS: Record<string, Grid> = {
  A: [".x.", "x.x", "xxx", "x.x", "x.x"],
  B: ["xx.", "x.x", "xx.", "x.x", "xx."],
  C: [".xx", "x..", "x..", "x..", ".xx"],
  D: ["xx.", "x.x", "x.x", "x.x", "xx."],
  E: ["xxx", "x..", "xx.", "x..", "xxx"],
  F: ["xxx", "x..", "xx.", "x..", "x.."],
  G: [".xx", "x..", "x.x", "x.x", ".xx"],
  H: ["x.x", "x.x", "xxx", "x.x", "x.x"],
  I: ["xxx", ".x.", ".x.", ".x.", "xxx"],
  J: ["..x", "..x", "..x", "x.x", ".x."],
  K: ["x.x", "x.x", "xx.", "x.x", "x.x"],
  L: ["x..", "x..", "x..", "x..", "xxx"],
  M: ["x...x", "xx.xx", "x.x.x", "x...x", "x...x"],
  N: ["x..x", "xx.x", "x.xx", "x..x", "x..x"],
  O: [".x.", "x.x", "x.x", "x.x", ".x."],
  P: ["xx.", "x.x", "xx.", "x..", "x.."],
  Q: [".x.", "x.x", "x.x", "xx.", ".xx"],
  R: ["xx.", "x.x", "xx.", "x.x", "x.x"],
  S: [".xx", "x..", ".x.", "..x", "xx."],
  T: ["xxx", ".x.", ".x.", ".x.", ".x."],
  U: ["x.x", "x.x", "x.x", "x.x", "xxx"],
  V: ["x.x", "x.x", "x.x", "x.x", ".x."],
  W: ["x...x", "x...x", "x.x.x", "xx.xx", "x...x"],
  X: ["x.x", "x.x", ".x.", "x.x", "x.x"],
  Y: ["x.x", "x.x", ".x.", ".x.", ".x."],
  Z: ["xxx", "..x", ".x.", "x..", "xxx"],
  "0": ["xxx", "x.x", "x.x", "x.x", "xxx"],
  "1": [".x.", "xx.", ".x.", ".x.", "xxx"],
  "2": ["xx.", "..x", ".x.", "x..", "xxx"],
  "3": ["xx.", "..x", ".x.", "..x", "xx."],
  "4": ["x.x", "x.x", "xxx", "..x", "..x"],
  "5": ["xxx", "x..", "xx.", "..x", "xx."],
  "6": [".xx", "x..", "xxx", "x.x", "xxx"],
  "7": ["xxx", "..x", ".x.", ".x.", ".x."],
  "8": ["xxx", "x.x", "xxx", "x.x", "xxx"],
  "9": ["xxx", "x.x", "xxx", "..x", "xx."],
  "!": ["x", "x", "x", ".", "x"],
  "?": ["xx.", "..x", ".x.", "...", ".x."],
  ".": [".", ".", ".", ".", "x"],
  ":": [".", "x", ".", "x", "."],
  "-": ["...", "...", "xxx", "...", "..."],
  "+": ["...", ".x.", "xxx", ".x.", "..."],
  "'": ["x", "x", ".", ".", "."],
  "/": ["..x", "..x", ".x.", "x..", "x.."],
  "<": ["..x", ".x.", "x..", ".x.", "..x"],
  ">": ["x..", ".x.", "..x", ".x.", "x.."],
  ",": [".", ".", ".", "x", "x"],
  "=": ["...", "xxx", "...", "xxx", "..."],
  // Text is upper-cased first, so π arrives as Π.
  "Π": ["xxxxx", ".x.x.", ".x.x.", ".x.x.", "x..x."],
  "♥": [".x.x.", "xxxxx", "xxxxx", ".xxx.", "..x.."],
  " ": ["..", "..", "..", "..", ".."],
};

/** Renders text (A–Z, 0–9, π, ♥ and a little punctuation; other characters are skipped) as one grid. */
export function pixelText(text: string): Grid {
  const glyphs = [...text.toUpperCase()].filter((c) => Object.hasOwn(GLYPHS, c)).map((c) => GLYPHS[c]!);
  return Array.from({ length: 5 }, (_, row) => glyphs.map((g) => g[row]).join("."));
}

export const textWidth = (text: string) => pixelText(text)[0]!.length;
