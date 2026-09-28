/** The Americas: Lady Liberty to Christ the Redeemer. */
import { RectBatch } from "../../../svg/batch.js";
import { outlined, type Grid } from "../../../svg/pixel.js";
import { cloud, ground, hill, mountain, px, sky, skyline, sun, water } from "./photo.js";
import { PW, type Place } from "./types.js";

const LIBERTY: Grid = [
  ".y......",
  "yyy.....",
  ".g......",
  ".g..ggg.",
  ".g.ggggg",
  ".gg.ggg.",
  "..gggggg",
  "...ggggg",
  "...gGggg",
  "...ggggg",
  "..gGgggg",
  "..gggggg",
  "..gGgggg",
  "..gggggg",
  ".ssssssss",
  ".sSsSsSss",
  ".ssssssss",
  "ssssssssss",
];

const GOLDEN_GATE_TOWER: Grid = ["r..r", "rrrr", "r..r", "r..r", "rrrr", "r..r", "r..r", "r..r", "rrrr", "r..r", "r..r", "r..r", "r..r", "r..r"];

const EL_CASTILLO: Grid = [
  "........tttt........",
  "........tkkt........",
  "......tttttttt......",
  "......sssssssss.....",
  "....sssssSsssssss...",
  "....ssssSSSsssssss..",
  "..sssssssSssssssssss",
  "..ssssssSSSssssssss.",
  "sssssssssSsssssssssss",
];

const LLAMA: Grid = outlined([
  "w.w...",
  "wwww..",
  "wkwwn.",
  "wwww..",
  ".ww...",
  ".ww...",
  ".wwwwww",
  ".wwwwww",
  ".wwwwww",
  ".w.w.w.",
]);

const CHRIST: Grid = ["...w...", "...w...", "wwwwwww", "...w...", "...w...", "..www..", "..www..", "..www..", "..www.."];

const PALM: Grid = ["gg.gg..", ".gggg.g", "gg.bggg", "...b..g", "...b...", "...b...", "..b....", "..b....", "..b....", "..b...."];

export const AMERICAS: Place[] = [
  {
    name: "NEW YORK",
    ink: "#2b8a3e",
    stamp: { bg: "#e6fcf5", grid: ["y....", "g.gg.", "ggggg", ".ggg.", "sssss"], colors: { y: "#fcc419", g: "#5fae8f", s: "#adb5bd" } },
    souvenir: { name: "an I ♥ NY shirt", grid: ["ww.ww", "wwwww", "wwrww", "wwwww", "wwwww"], colors: { w: "#ffffff", r: "#e03131" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "day") + cloud(x + 6, y + 8, 16) +
        skyline(x, y, 38, [[0, 8, 16, "#8d99ae"], [9, 6, 26, "#7a869a"], [16, 8, 20, "#8d99ae"], [25, 5, 30, "#6c7890"], [31, 7, 22, "#8d99ae"], [39, 6, 14, "#7a869a"]], "#e7f5ff") +
        water(x, y, 38, "#3a86c8", "#9fd4ff") +
        px(LIBERTY, { y: "#fcc419", g: "#5fae8f", G: "#8fd1b5", s: "#a0896b", S: "#8a7358" }, x + 68, y + 4) +
        new RectBatch().add("#b0a08a", x, y + 50, 50, 10).toString(),
      feet: { x: x + 22, y: y + 52 },
    }),
  },
  {
    name: "SAN FRANCISCO",
    ink: "#c92a2a",
    stamp: { bg: "#fff5f5", grid: ["r..r", "rrrr", "r..r", "rrrr", "r..r"], colors: { r: "#e8590c" } },
    souvenir: { name: "sourdough", grid: [".bbbb.", "bBbBbb", "bbbbbb", ".bbbb."], colors: { b: "#d9a066", B: "#f0c890" } },
    draw: (x, y) => {
      // The Golden Gate: two towers, a sweep of cable, the deck, and a bit of fog.
      const deck = new RectBatch().add("#c4461c", x, y + 36, PW, 3).add("#8a2e10", x, y + 39, PW, 1);
      return {
        bg:
          sky(x, y, "day") +
          hill(x, y, 90, 42, 40, 16, "#6a8f5a") +
          px(GOLDEN_GATE_TOWER, { r: "#e8590c" }, x + 34, y + 8) + px(GOLDEN_GATE_TOWER, { r: "#e8590c" }, x + 78, y + 8) +
          `<path d="M${x} ${y + 30}Q${x + 20} ${y + 36} ${x + 38} ${y + 10}Q${x + 60} ${y + 34} ${x + 82} ${y + 10}Q${x + 90} ${y + 26} ${x + 96} ${y + 30}" fill="none" stroke="#e8590c" stroke-width="1.2"/>` +
          deck + water(x, y, 42, "#2f6f9f", "#a5d8ff") +
          `<rect x="${x}" y="${y + 20}" width="${PW}" height="10" fill="#ffffff" opacity=".35"/>` +
          new RectBatch().add("#c9b28a", x, y + 52, 44, 8).toString(),
        feet: { x: x + 22, y: y + 54 },
      };
    },
  },
  {
    name: "GRAND CANYON",
    ink: "#c2553a",
    stamp: { bg: "#fff4e6", grid: ["......", "rr..rr", "RRRRRR", "rrrrrr"], colors: { r: "#c2553a", R: "#e8a06a" } },
    souvenir: { name: "a cowboy hat", grid: ["..bbb..", ".bbbbb.", "kkkkkkk", "b.....b"], colors: { b: "#a0673a", k: "#6b4226" } },
    draw: (x, y) => {
      // Buttes of layered red rock either side of the canyon, the river far below.
      const rock = new RectBatch();
      const bands = ["#a8452e", "#c2553a", "#e8a06a", "#d9774f", "#c2553a", "#a8452e"];
      const butte = (left: number, widths: number[]) =>
        widths.forEach((w, i) => {
          const top = y + 44 - (i + 1) * 5;
          rock.add(bands[i % bands.length]!, x + left + (widths[0]! - w) / 2, top, w, 5).add("#f0b98a", x + left + (widths[0]! - w) / 2, top, w, 1);
        });
      butte(40, [56, 50, 46, 38, 30, 14]);
      butte(-6, [34, 30, 24, 16]);
      rock.add("#7a3222", x + 28, y + 44, 16, 16).add("#4dabf7", x + 32, y + 52, 8, 8);
      return { bg: sky(x, y, "sunset") + sun(x + 70, y + 12, 5, "#fff3bf") + rock + ground(x, y, 54, "#c2553a"), feet: { x: x + 16, y: y + 55 } };
    },
  },
  {
    name: "NIAGARA FALLS",
    ink: "#1864ab",
    stamp: { bg: "#e7f5ff", grid: ["gggg", "bwbw", "wbwb", "bwbw"], colors: { g: "#2f9e44", b: "#4dabf7", w: "#ffffff" } },
    souvenir: { name: "maple syrup", grid: [".k.", ".b.", "bbb", "brb", "bbb"], colors: { k: "#6b4226", b: "#c8773a", r: "#e03131" } },
    draw: (x, y) => {
      const falls = new RectBatch().add("#4f8f4f", x + 36, y + 14, 60, 8);
      for (let fx = 36; fx < PW; fx += 3) falls.add(fx % 2 ? "#e7f5ff" : "#a5d8ff", x + fx, y + 22, 3, 24);
      return {
        bg:
          sky(x, y, "day") + falls + `<g class="pf-s-flicker"><rect x="${x + 36}" y="${y + 42}" width="60" height="6" fill="#ffffff" opacity=".6"/></g>` +
          `<path d="M${x + 44} ${y + 40}a26 26 0 0 1 52 0" fill="none" stroke="#ff8787" stroke-width="1.5" opacity=".6"/><path d="M${x + 46} ${y + 40}a24 24 0 0 1 48 0" fill="none" stroke="#ffd43b" stroke-width="1.5" opacity=".6"/><path d="M${x + 48} ${y + 40}a22 22 0 0 1 44 0" fill="none" stroke="#69db7c" stroke-width="1.5" opacity=".6"/>` +
          water(x, y, 46, "#3a86c8", "#d0ebff") + new RectBatch().add("#6f8f5f", x, y + 14, 36, 46).add("#8a9a6a", x, y + 48, 40, 12).toString(),
        feet: { x: x + 20, y: y + 56 },
      };
    },
  },
  {
    name: "HAWAII",
    ink: "#e8590c",
    stamp: { bg: "#e3fafc", grid: ["gg.gg", ".ggg.", "..b..", "..b..", "wwwww"], colors: { g: "#2f9e44", b: "#8a5a33", w: "#4dabf7" } },
    souvenir: { name: "a pineapple", grid: [".g.g.", "..g..", ".yyy.", "yYyYy", "yyYyy", ".yyy."], colors: { g: "#2f9e44", y: "#fcc419", Y: "#e8a10f" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "tropical") +
        mountain(x, y, 70, 38, 60, 22, "#5a6b5a") + `<g class="pf-s-steam"><rect x="${x + 68}" y="${y + 10}" width="4" height="4" fill="#dee2e6"/></g>` +
        water(x, y, 36, "#1c9ad6", "#e3fafc") + ground(x, y, 46, "#f4d58d", "#fbe7b0") +
        px(PALM, { g: "#2f9e44", b: "#8a5a33" }, x + 76, y + 26) +
        // A surfboard stuck in the sand.
        `<rect x="${x + 60}" y="${y + 30}" width="5" height="18" rx="2.5" fill="#ff6b6b"/><rect x="${x + 62}" y="${y + 31}" width="1" height="16" fill="#ffffff"/>`,
      feet: { x: x + 24, y: y + 55 },
      friend: { x: x + 44, y: y + 55 },
    }),
  },
  {
    name: "CHICHEN ITZA",
    ink: "#2b8a3e",
    stamp: { bg: "#ebfbee", grid: ["..t..", ".sss.", "sssss", "sssss"], colors: { t: "#8a7358", s: "#c9b28a" } },
    souvenir: { name: "maracas", grid: ["rr.yy", "rr.yy", ".b..b", ".b..b"], colors: { r: "#e03131", y: "#fcc419", b: "#8a5a33" } },
    draw: (x, y) => {
      // El Castillo: nine stepped terraces, a staircase up the middle, a temple on top.
      const b = new RectBatch();
      const cx = x + 70;
      for (let i = 0; i < 9; i++) {
        const w = 52 - i * 5;
        b.add(i % 2 ? "#c9b28a" : "#b8a07a", cx - w / 2, y + 46 - (i + 1) * 3, w, 3).add("#8a7358", cx - w / 2, y + 46 - (i + 1) * 3, w, 1);
      }
      b.add("#a38b63", cx - 3, y + 19, 6, 27);
      for (let sy = 20; sy < 46; sy += 2) b.add("#8a7358", cx - 3, y + sy, 6, 1);
      b.add("#b8a07a", cx - 7, y + 11, 14, 8).add("#8a7358", cx - 7, y + 10, 14, 1).add("#3b2a1a", cx - 2, y + 14, 4, 5);
      return {
        bg: sky(x, y, "day") + cloud(x + 8, y + 6, 18) + hill(x, y, 18, 46, 40, 14, "#2f7a3f") + hill(x, y, 94, 46, 30, 16, "#3f8f4f") + b + ground(x, y, 46, "#8cbf6a", "#a5d17f"),
        feet: { x: x + 22, y: y + 55 },
      };
    },
  },
  {
    name: "MACHU PICCHU",
    ink: "#2b8a3e",
    stamp: { bg: "#ebfbee", grid: ["...g..", "..ggg.", ".ggggg", "ssssss"], colors: { g: "#2f7a3f", s: "#adb5bd" } },
    souvenir: { name: "a llama plush", grid: ["w.w.", "wwww", "wkwn", ".ww.", ".wwww", ".w.w."], colors: { w: "#fff4e6", k: "#1a1a1a", n: "#e8a0a0" } },
    draw: (x, y) => {
      const terraces = new RectBatch();
      for (let i = 0; i < 5; i++) terraces.add("#6fae5f", x + 30 - i * 4, y + 36 + i * 4, 70, 4).add("#a3a3a3", x + 30 - i * 4, y + 39 + i * 4, 70, 1);
      terraces.add("#b0a89a", x + 50, y + 30, 10, 6).add("#b0a89a", x + 64, y + 30, 12, 6);
      return {
        bg: sky(x, y, "mist") + mountain(x, y, 76, 36, 34, 32, "#2f6f3f") + mountain(x, y, 40, 40, 50, 16, "#4f8f5f") + terraces + px(LLAMA, { w: "#fff4e6", k: "#1a1a1a", n: "#e8a0a0", o: "#8a7358" }, x + 80, y + 38),
        feet: { x: x + 22, y: y + 58 },
      };
    },
  },
  {
    name: "RIO DE JANEIRO",
    ink: "#2b8a3e",
    stamp: { bg: "#ebfbee", grid: ["..w..", "wwwww", "..w..", ".ggg.", "ggggg"], colors: { w: "#ffffff", g: "#2f9e44" } },
    souvenir: { name: "a football", grid: [".www.", "wkwkw", "wwkww", "wkwkw", ".www."], colors: { w: "#ffffff", k: "#1a1a1a" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "tropical") +
        hill(x, y, 30, 40, 36, 26, "#3f7d4f") + px(CHRIST, { w: "#f1f3f5" }, x + 23, y + 0) +
        hill(x, y, 80, 40, 24, 22, "#4f8f5f") +
        water(x, y, 38, "#1c9ad6", "#e3fafc") + ground(x, y, 48, "#f4d58d", "#fbe7b0"),
      feet: { x: x + 50, y: y + 56 },
      friend: { x: x + 70, y: y + 56 },
    }),
  },
];

