/** Africa and the Middle East: the pyramids to Petra. */
import { RectBatch } from "../../../svg/batch.js";
import { outlined, type Grid } from "../../../svg/pixel.js";
import { cloud, ground, px, sky, sun, water } from "./photo.js";
import type { Place } from "./types.js";

/** A pyramid lit from the left: a light face and a shaded one. */
function pyramid(b: RectBatch, cx: number, base: number, h: number): void {
  for (let i = 0; i < h; i += 2) {
    const half = h - i;
    b.add("#f0c97a", cx - half, base - i - 2, half, 2).add("#c9a24a", cx, base - i - 2, half, 2);
  }
}

const GIRAFFE: Grid = outlined([
  "....yy..",
  "...yyyk.",
  "...yy...",
  "...yd...",
  "...yy...",
  "...dy...",
  "...yy...",
  "yyyyyy..",
  "ydyydyy.",
  "yyydyyy.",
  "y.y..y.y",
  "y.y..y.y",
]);

const ACACIA: Grid = [
  "..kkkkkkkkkk..",
  "kkkkkkkkkkkkkk",
  ".kkkkkkkkkkkk.",
  "......kk......",
  ".....kk.......",
  ".....k........",
  ".....k........",
  "....kk........",
];

const TREASURY: Grid = [
  "....rrrrrrrrrr....",
  "...rRrRrRrRrRrr...",
  "..rrrrrrrrrrrrrr..",
  "..rc.rc.rrc.rc.r..",
  "..rc.rc.rrc.rc.r..",
  "rrrrrrrrrrrrrrrrrr",
  "rRrRrRrRrRrRrRrRrR",
  "rc.rc.rkkkkrc.rc.r",
  "rc.rc.rkkkkrc.rc.r",
  "rc.rc.rkkkkrc.rc.r",
  "rc.rc.rkkkkrc.rc.r",
  "rrrrrrrrrrrrrrrrrr",
];

export const AFRICA: Place[] = [
  {
    name: "GIZA",
    ink: "#b8860b",
    stamp: { bg: "#fff9db", grid: ["..y..", ".yyd.", "yyydd", "yyddd"], colors: { y: "#f0c97a", d: "#c9a24a" } },
    souvenir: { name: "a papyrus scroll", grid: ["b.....b", "byyyyyb", "bykkkyb", "byyyyyb", "b.....b"], colors: { b: "#a0673a", y: "#f1e3c6", k: "#8a6a4a" } },
    draw: (x, y) => {
      const b = new RectBatch();
      pyramid(b, x + 76, y + 46, 30);
      pyramid(b, x + 52, y + 46, 20);
      pyramid(b, x + 92, y + 46, 12);
      return { bg: sky(x, y, "desert") + sun(x + 18, y + 12, 6) + b + ground(x, y, 46, "#e8c98f", "#f3dcaa"), feet: { x: x + 22, y: y + 55 }, friend: { x: x + 40, y: y + 55 } };
    },
  },
  {
    name: "SERENGETI",
    ink: "#e67700",
    stamp: { bg: "#fff4e6", grid: ["..yy", "..yk", "..y.", "yyyy", "y..y"], colors: { y: "#f2b84b", k: "#3b2616" } },
    souvenir: { name: "a safari hat", grid: ["..kkk..", ".kbbbk.", "kkkkkkk"], colors: { k: "#c9a86b", b: "#6b4a2a" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "sunset") + sun(x + 50, y + 34, 12, "#ffd43b") +
        px(ACACIA, { k: "#3b2a1a" }, x + 60, y + 22) +
        ground(x, y, 44, "#d9a84e", "#e8c06a") +
        px(GIRAFFE, { y: "#f2b84b", d: "#a0673a", k: "#3b2616", o: "#6b4226" }, x + 74, y + 18),
      feet: { x: x + 24, y: y + 55 },
      friend: { x: x + 46, y: y + 55 },
    }),
  },
  {
    name: "CAPE TOWN",
    ink: "#1864ab",
    stamp: { bg: "#e7f5ff", grid: ["......", ".gggg.", "gggggg", "bbbbbb"], colors: { g: "#6b7f5a", b: "#1c7ed6" } },
    souvenir: { name: "a protea", grid: [".p.p.", "pPpPp", "pPPPp", ".ggg.", "..g.."], colors: { p: "#f783ac", P: "#fcc2d7", g: "#2f9e44" } },
    draw: (x, y) => {
      // Table Mountain: flat as a table, with its tablecloth of cloud.
      const table = new RectBatch().add("#7a8a66", x + 20, y + 16, 64, 22).add("#6b7a58", x + 12, y + 24, 80, 14).add("#8d9c78", x + 22, y + 16, 60, 2);
      return {
        bg: sky(x, y, "day") + table + cloud(x + 22, y + 11, 58) + water(x, y, 38, "#1c7ed6", "#74c0fc") + ground(x, y, 50, "#f1e3c6", "#f8efdc"),
        feet: { x: x + 24, y: y + 56 },
        friend: { x: x + 44, y: y + 56 },
      };
    },
  },
  {
    name: "PETRA",
    ink: "#c2553a",
    stamp: { bg: "#fff4e6", grid: ["rrrrr", "rc.cr", "rrrrr", "rckcr", "rckcr"], colors: { r: "#d9826a", c: "#b5654f", k: "#5b2a1f" } },
    souvenir: { name: "a sand bottle", grid: [".k.", "www", "rrr", "yyy", "ppp", "www"], colors: { k: "#8a5a33", w: "#f1f3f5", r: "#e8590c", y: "#fcc419", p: "#d6336c" } },
    draw: (x, y) => {
      // The Treasury, carved into rose-red canyon walls.
      const cliffs = new RectBatch().add("#b5654f", x, y, 30, 60).add("#c97a62", x + 4, y, 8, 60).add("#b5654f", x + 80, y, 16, 60).add("#a0563f", x + 88, y, 8, 60);
      return {
        bg: sky(x, y, "desert") + cliffs + new RectBatch().add("#d9826a", x + 30, y + 4, 50, 56).toString() + px(TREASURY, { r: "#e8a08a", R: "#c97a62", c: "#b5654f", k: "#5b2a1f" }, x + 37, y + 12) + ground(x, y, 50, "#e8b48a"),
        feet: { x: x + 20, y: y + 57 },
      };
    },
  },
];

