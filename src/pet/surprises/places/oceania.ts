/** Oceania and the poles: the Opera House to the penguins. */
import { RectBatch } from "../../../svg/batch.js";
import { outlined, type Grid } from "../../../svg/pixel.js";
import { ground, hill, mountain, px, sky, sun, water } from "./photo.js";
import { PW, type Place } from "./types.js";

/** A moai: a long face under a heavy brow, deep eyes, a long nose, thin lips, and long ears. */
const MOAI: Grid = outlined([
  ".ssss.",
  "ssssss",
  "kSSSSk",
  "skSSks",
  "ssSSss",
  "ssSSss",
  "sSSSSs",
  "ssssss",
  "skkkks",
  "ssssss",
  ".ssss.",
  "ssssss",
  "ssssss",
]);
const PENGUIN: Grid = outlined(["..kk..", ".kkkk.", ".kwkw.", "kkwwff", "kwwwk.", "kwwwk.", "kwwwk.", ".f..f."]);
const CORAL: Grid = ["p..p..p.", "p.p.p.p.", "ppp.ppp.", ".p...p..", ".pp.pp..", "..ppp...", "...p....", "...p...."];
const TURTLE: Grid = outlined(["..ggg...", ".gGgGg..", "gGgGgGgh", ".ggggg..", "h.....h."]);

export const OCEANIA: Place[] = [
  {
    name: "SYDNEY",
    ink: "#1864ab",
    stamp: { bg: "#e7f5ff", grid: ["..w..w", ".ww.ww", "wwwwww", "bbbbbb"], colors: { w: "#ffffff", b: "#1c7ed6" } },
    souvenir: { name: "a boomerang", grid: ["bb....", "bbb...", ".bbb..", "..bbbb", "...bbb"], colors: { b: "#a0673a" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "day") + sun(x + 16, y + 10, 5) +
        // The Harbour Bridge's arch behind, the Opera House's sails in front.
        `<path d="M${x + 30} ${y + 38}Q${x + 60} ${y + 4} ${x + 96} ${y + 38}" fill="none" stroke="#6c7890" stroke-width="3"/>` +
        new RectBatch().add("#6c7890", x + 30, y + 36, 66, 2).toString() +
        `<path d="M${x + 44} ${y + 42}L${x + 54} ${y + 22}L${x + 58} ${y + 42}Z M${x + 54} ${y + 42}L${x + 64} ${y + 18}L${x + 70} ${y + 42}Z M${x + 66} ${y + 42}L${x + 76} ${y + 26}L${x + 80} ${y + 42}Z" fill="#f8f9fa" stroke="#ced4da" stroke-width=".8"/>` +
        new RectBatch().add("#c9a88a", x + 40, y + 42, 44, 4).toString() +
        water(x, y, 46, "#1c7ed6", "#a5d8ff") + new RectBatch().add("#b0a08a", x, y + 50, 36, 10).toString(),
      feet: { x: x + 18, y: y + 52 },
    }),
  },
  {
    name: "GREAT BARRIER REEF",
    ink: "#0b7285",
    stamp: { bg: "#c5f6fa", grid: ["..oo..o", ".owowoo", "oowowoo", ".owowoo", "..oo..o"], colors: { o: "#ff922b", w: "#ffffff" } },
    souvenir: { name: "a seashell", grid: ["..p..", ".pPp.", "pPpPp", "ppppp"], colors: { p: "#fcc2d7", P: "#f783ac" } },
    draw: (x, y) => ({
      bg:
        new RectBatch().add("#0c8599", x, y, PW, 60).add("#1098ad", x, y, PW, 20).add("#15aabf", x, y, PW, 8).toString() +
        `<g opacity=".15" fill="#ffffff"><path d="M${x + 20} ${y}h8l-18 60h-8z M${x + 60} ${y}h8l-18 60h-8z"/></g>` +
        px(CORAL, { p: "#ff8787" }, x + 56, y + 36) + px(CORAL, { p: "#ffa94d" }, x + 76, y + 40) + px(CORAL, { p: "#da77f2" }, x + 4, y + 42) +
        px(TURTLE, { g: "#5c940d", G: "#94d82d", h: "#8ce99a", o: "#2b5f0a" }, x + 60, y + 12) +
        ground(x, y, 54, "#f4d58d"),
      feet: { x: x + 28, y: y + 54 },
    }),
  },
  {
    name: "EASTER ISLAND",
    ink: "#5c940d",
    stamp: { bg: "#f4fce3", grid: [".ss.", "ssss", "kSSk", "sSSs", "sSSs", "skks", "ssss"], colors: { s: "#8a8a7a", S: "#6b6b5c", k: "#3b3b30" } },
    souvenir: { name: "a mini moai", grid: [".ss.", "ssss", "kSSk", "sSSs", "sSSs", "skks", "ssss"], colors: { s: "#8a8a7a", S: "#6b6b5c", k: "#3b3b30" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "sunset") + sun(x + 20, y + 30, 7, "#fff3bf") + water(x, y, 36, "#3a6ea5", "#ffd8a8") +
        hill(x, y, 70, 50, 70, 18, "#6f9e4f") + ground(x, y, 50, "#6f9e4f") +
        [52, 66, 80].map((mx, i) => px(MOAI, { s: "#8a8a7a", S: "#6b6b5c", k: "#3b3b30", o: "#3b3b30" }, x + mx, y + 20 + (i % 2) * 2)).join(""),
      feet: { x: x + 26, y: y + 56 },
    }),
  },
  {
    name: "ANTARCTICA",
    ink: "#1971c2",
    stamp: { bg: "#e7f5ff", grid: [".kk.", "kwwk", "kwwk", ".o.o"], colors: { k: "#1a1a1a", w: "#ffffff", o: "#ff922b" } },
    souvenir: { name: "a penguin plush", grid: [".kk.", "kwkw", "kwwo", "kwwk", ".oo."], colors: { k: "#1a1a1a", w: "#ffffff", o: "#ff922b" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "snow") +
        mountain(x, y, 70, 40, 60, 20, "#dbe7f3", 20, "#f8fbff") + mountain(x, y, 30, 40, 40, 12, "#e7eef6", 12, "#ffffff") +
        water(x, y, 38, "#4a7fb0", "#dbe7f3") + ground(x, y, 46, "#f1f5f9", "#ffffff") +
        [60, 72, 84].map((px0, i) => px(PENGUIN, { k: "#1a1a1a", w: "#ffffff", f: "#ff922b", o: "#343a40" }, x + px0, y + 34 + (i % 2) * 3)).join(""),
      feet: { x: x + 24, y: y + 56 },
    }),
  },
];
