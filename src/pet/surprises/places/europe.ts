/** Europe: the Eiffel Tower to the northern lights. */
import { RectBatch } from "../../../svg/batch.js";
import { outlined, type Grid } from "../../../svg/pixel.js";
import { cloud, ground, hill, mountain, px, sky, sun, water } from "./photo.js";
import { PW, type Place } from "./types.js";

const EIFFEL: Grid = [
  ".......k.......",
  ".......k.......",
  "......kkk......",
  "......kek......",
  "......kkk......",
  ".....kk.kk.....",
  ".....k.k.k.....",
  ".....kk.kk.....",
  ".....kk.kk.....",
  "....kkkkkkk....",
  "....k.k.k.k....",
  "....kk.k.kk....",
  "...kk.k.k.kk...",
  "...kk.k.k.kk...",
  "..kkkkkkkkkkk..",
  "..kk.k...k.kk..",
  "..k.k.....k.k..",
  ".kk..........kk",
  ".kkkkkkkkkkkkk.",
  ".kk.........kk.",
  "kk...kkkkk...kk",
  "k...kk...kk...k",
  "k..kk.....kk..k",
];

const BIG_BEN: Grid = [
  "....k....",
  "....k....",
  "...ttt...",
  "...ttt...",
  "..ttttt..",
  "..tTtTt..",
  ".ttttttt.",
  ".twwwwwt.",
  ".twwkwwt.",
  ".twkkwwt.",
  ".twwwwwt.",
  ".ttttttt.",
  ...Array.from({ length: 6 }, () => [".tTtTtTt.", ".ttttttt."]).flat(),
  "ttttttttt",
];

const BUS: Grid = outlined([
  "rrrrrrrrrrrrrrrr",
  "rwwrwwrwwrwwrwwr",
  "rrrrrrrrrrrrrrrr",
  "rwwrwwrwwrwwrwwr",
  "rrrrrrrrrrrrrrrr",
  ".kk........kk...",
]);

const COLOSSEUM: Grid = [
  "..............ssssssss..",
  "......ssssssssssssssssss",
  "..ssssssssssssssssssssss",
  ".sakasakasakasakasakasak",
  ".sakasakasakasakasakasak",
  "ssssssssssssssssssssssss",
  "sakasakasakasakasakasaka",
  "sakasakasakasakasakasaka",
  "ssssssssssssssssssssssss",
  "sakasakasakasakasakasaka",
  "sakasakasakasakasakasaka",
  "ssssssssssssssssssssssss",
];

const WINDMILL: Grid = [
  "s.......s..",
  ".s.....s...",
  "..s...s....",
  "...s.s.....",
  "....h......",
  "...shs.....",
  "..s.b.s....",
  ".s.bbb.s...",
  "s..bbbb.s..",
  "...bbbb....",
  "..bbwbbb...",
  "..bbwbbb...",
  ".bbbbbbbb..",
  ".bbbbbbbb..",
];

const PARTHENON: Grid = [
  "......ppppppp......",
  "...ppppppppppppp...",
  "ppppppppppppppppppp",
  "ppppppppppppppppppp",
  "c.c.c.c.c.c.c.c.c.c",
  "c.c.c.c.c.c.c.c.c.c",
  "c.c.c.c.c.c.c.c.c.c",
  "c.c.c.c.c.c.c.c.c.c",
  "c.c.c.c.c.c.c.c.c.c",
  "ppppppppppppppppppp",
];

const SAGRADA: Grid = [
  "..y.....y..y.....y..",
  ".ttt...ttttt....ttt.",
  ".ttt...tt.tt....ttt.",
  ".tTt...tTtTt....tTt.",
  ".ttt..ttttttt...ttt.",
  ".tTt..tTt.tTt...tTt.",
  "ttttt.ttttttt..ttttt",
  "tTtTt.tTtTtTt..tTtTt",
  "tttttttttttttttttttt",
  "tTttTttTttTttTttTttT",
  "tttkkkttttttttkkkttt",
  "tttkkkttttttttkkkttt",
];

/** St Basil's: onion domes in every colour, on a red brick base. */
const ST_BASILS: Grid = [
  ".........y.........",
  "........ggg........",
  "...y...gGgGg...y...",
  "..rrr...ggg...bbb..",
  ".rwrwr..rrr..bwbwb.",
  "..rrr..rrrrr..bbb..",
  "..ttt..ttttt..ttt..",
  "..tRt..tRtRt..tRt..",
  "..ttt..ttttt..ttt..",
  "ttttttttttttttttttt",
  "tRtRtRtRtRtRtRtRtRt",
  "ttttttttkkkttttttt.",
  "ttttttttkkktttttttt",
];

const MOSQUE: Grid = [
  "m..........k.........m",
  "m.........www........m",
  "m.......wwwwwww......m",
  "m......wwwwwwwww.....m",
  "m....w.wwwwwwwww.w...m",
  "m...www.wwwwwww.www..m",
  "m..wwwwwwwwwwwwwwwww.m",
  "mm.wwwwwwwwwwwwwwwwwmm",
  "m.wwawwawwawwawwawwaw.",
  "m.wwwwwwwwwwwwwwwwwww.",
];

const GATE: Grid = [
  ".......qqqqq.......",
  "......qq.q.qq......",
  "sssssssssssssssssss",
  "SSSSSSSSSSSSSSSSSSS",
  "ssssssssssssssssss.",
  ".s.s.s.s.s.s.s.s.s.",
  ".s.s.s.s.s.s.s.s.s.",
  ".s.s.s.s.s.s.s.s.s.",
  ".s.s.s.s.s.s.s.s.s.",
  ".s.s.s.s.s.s.s.s.s.",
  "sssssssssssssssssss",
];

export const EUROPE: Place[] = [
  {
    name: "PARIS",
    ink: "#364fc7",
    stamp: { bg: "#edf2ff", grid: ["..k..", "..k..", ".kkk.", ".k.k.", "k...k"], colors: { k: "#6b5a48" } },
    souvenir: { name: "a croissant", grid: ["..ccc..", ".cCcCc.", "cc...cc"], colors: { c: "#e0a458", C: "#b97a36" } },
    draw: (x, y) => ({
      bg: sky(x, y, "day") + cloud(x + 6, y + 8, 20) + cloud(x + 36, y + 16, 14) + px(EIFFEL, { k: "#6b5a48", e: "#ffd43b" }, x + 58, y + 4) + ground(x, y, 50, "#79b865", "#8cc97a"),
      feet: { x: x + 24, y: y + 55 },
      friend: { x: x + 42, y: y + 55 },
    }),
  },
  {
    name: "LONDON",
    ink: "#c92a2a",
    stamp: { bg: "#fff5f5", grid: ["..k..", ".ttt.", ".twt.", ".ttt.", ".ttt.", "ttttt"], colors: { k: "#5b4636", t: "#c8a86b", w: "#ffffff" } },
    souvenir: { name: "a cup of tea", grid: ["..s...", "wwww..", "wtttww", "wtttw.", ".www.."], colors: { s: "#ffffff", w: "#f1f3f5", t: "#a0522d" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "mist") + cloud(x + 6, y + 6, 22, "#f1f3f5") +
        px(BIG_BEN, { k: "#5b4636", t: "#c8a86b", T: "#a8894f", w: "#fff8e1" }, x + 74, y + 2) +
        ground(x, y, 50, "#6b717a", "#868e96") +
        px(BUS, { r: "#e03131", w: "#cfe8ff", k: "#212529", o: "#6b1414" }, x + 40, y + 36),
      feet: { x: x + 20, y: y + 57 },
    }),
  },
  {
    name: "ROME",
    ink: "#c92a2a",
    stamp: { bg: "#fff4e6", grid: ["sssss", "sksks", "sssss", "sksks"], colors: { s: "#d9b98a", k: "#7a5a3a" } },
    souvenir: { name: "a pizza slice", grid: ["bbbbb", "yryry", ".yry.", "..y.."], colors: { b: "#c68b59", y: "#ffd43b", r: "#e03131" } },
    draw: (x, y) => ({
      bg: sky(x, y, "day") + sun(x + 16, y + 12, 5) + px(COLOSSEUM, { s: "#d9b98a", a: "#b8966a", k: "#6b4a2a" }, x + 44, y + 22) + ground(x, y, 46, "#c9b28a", "#d9c7a8"),
      feet: { x: x + 22, y: y + 55 },
      friend: { x: x + 40, y: y + 55 },
    }),
  },
  {
    name: "VENICE",
    ink: "#1864ab",
    stamp: { bg: "#e7f5ff", grid: ["k.....", "kk...k", ".kkkkk", "..kk.."], colors: { k: "#1a1a1a" } },
    souvenir: { name: "a carnival mask", grid: ["p...p", "ggggg", "gkgkg", ".ggg."], colors: { g: "#fcc419", k: "#1a1a1a", p: "#be4bdb" } },
    draw: (x, y) => {
      // Canal houses on both sides and a gondola on the water.
      const houses = new RectBatch();
      for (const [hx, hw, hh, c] of [[0, 14, 30, "#f4a261"], [14, 12, 36, "#e76f51"], [70, 12, 34, "#e9c46a"], [82, 14, 28, "#f4a261"]] as const) {
        houses.add(c, x + hx, y + 40 - hh, hw, hh);
        for (let wy = 40 - hh + 4; wy < 36; wy += 7) houses.add("#264653", x + hx + 3, y + wy, 3, 4).add("#264653", x + hx + hw - 6, y + wy, 3, 4);
      }
      const gondola = new RectBatch().add("#1a1a1a", x + 28, y + 50, 40, 3).add("#1a1a1a", x + 26, y + 47, 3, 4).add("#1a1a1a", x + 66, y + 46, 3, 5).add("#c92a2a", x + 40, y + 49, 14, 1);
      return {
        bg: sky(x, y, "sunset") + houses + `<path d="M${x + 30} ${y + 30}q18 -12 36 0v4q-18 -9 -36 0z" fill="#e9dcc3"/>` + water(x, y, 40, "#2f7fa8", "#a5d8ff") + gondola,
        feet: { x: x + 48, y: y + 50 },
      };
    },
  },
  {
    name: "AMSTERDAM",
    ink: "#e8590c",
    stamp: { bg: "#fff4e6", grid: ["s...s", ".s.s.", "..h..", ".bbb.", ".bwb."], colors: { s: "#6b4a2a", h: "#343a40", b: "#8a5a33", w: "#fff4e6" } },
    souvenir: { name: "wooden clogs", grid: ["....yy", "yyyyyy", ".yyyyy"], colors: { y: "#fcc419" } },
    draw: (x, y) => {
      const tulips = new RectBatch();
      const colours = ["#e03131", "#fcc419", "#f783ac", "#e03131"];
      for (let row = 0; row < 4; row++) for (let tx = 0; tx < PW; tx += 4) tulips.add(colours[row]!, x + tx + (row % 2) * 2, y + 46 + row * 4, 2, 2).add("#2f9e44", x + tx + (row % 2) * 2, y + 48 + row * 4, 2, 2);
      return {
        bg: sky(x, y, "day") + cloud(x + 10, y + 6, 18) + ground(x, y, 44, "#5eaf57") + px(WINDMILL, { s: "#6b4a2a", h: "#343a40", b: "#8a5a33", w: "#fff4e6" }, x + 62, y + 16) + tulips,
        feet: { x: x + 24, y: y + 50 },
      };
    },
  },
  {
    name: "SANTORINI",
    ink: "#1864ab",
    stamp: { bg: "#e7f5ff", grid: [".bbb.", "bbbbb", "wwwww", "wkwkw"], colors: { b: "#1c7ed6", w: "#ffffff", k: "#495057" } },
    souvenir: { name: "a jar of olives", grid: [".kkk.", "jjjjj", "jgGgj", "jGgGj", "jgGgj", "jjjjj"], colors: { k: "#1c7ed6", j: "#d0ebff", g: "#5c940d", G: "#94d82d" } },
    draw: (x, y) => {
      const town = new RectBatch();
      for (const [hx, hy, hw, hh] of [[46, 22, 14, 10], [58, 16, 12, 16], [70, 24, 14, 10], [82, 18, 14, 14], [52, 30, 16, 8], [74, 32, 16, 8]] as const) {
        town.add("#ffffff", x + hx, y + hy, hw, hh).add("#dee2e6", x + hx, y + hy + hh - 1, hw, 1).add("#1c7ed6", x + hx + 3, y + hy + hh - 5, 3, 4);
      }
      return {
        bg:
          sky(x, y, "sunset") + sun(x + 20, y + 30, 6, "#fff3bf") + water(x, y, 36, "#1971c2", "#74c0fc") +
          hill(x, y, 72, 44, 60, 12, "#b08968") + town +
          `<path d="M${x + 60} ${y + 16}a5 5 0 0 1 10 0z M${x + 84} ${y + 18}a5 5 0 0 1 10 0z" fill="#1c7ed6"/>` +
          new RectBatch().add("#f1e3c6", x, y + 50, 44, 10).toString(),
        feet: { x: x + 22, y: y + 52 },
      };
    },
  },
  {
    name: "ATHENS",
    ink: "#1864ab",
    stamp: { bg: "#e7f5ff", grid: ["..p..", "ppppp", "c.c.c", "c.c.c", "ppppp"], colors: { p: "#e9dcc3", c: "#d8cbb3" } },
    souvenir: { name: "a greek vase", grid: [".oo.", "oooo", "okko", "oooo", ".oo."], colors: { o: "#e8590c", k: "#1a1a1a" } },
    draw: (x, y) => ({
      bg: sky(x, y, "day") + sun(x + 16, y + 12, 5) + hill(x, y, 68, 40, 72, 14, "#b8a07a") + px(PARTHENON, { p: "#e9dcc3", c: "#d8cbb3" }, x + 50, y + 8) + ground(x, y, 40, "#c9b28a") + hill(x, y, 16, 60, 30, 20, "#6b8e4e"),
      feet: { x: x + 24, y: y + 55 },
      friend: { x: x + 44, y: y + 55 },
    }),
  },
  {
    name: "BARCELONA",
    ink: "#e67700",
    stamp: { bg: "#fff9db", grid: ["y...y", "t.t.t", "t.t.t", "ttttt", "ttttt"], colors: { y: "#fcc419", t: "#b08968" } },
    souvenir: { name: "churros", grid: ["b.b.b", "b.b.b", "b.b.b", "kkkkk", "kkkkk"], colors: { b: "#e0a458", k: "#5c3d2e" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "day") + cloud(x + 8, y + 8, 18) +
        px(SAGRADA, { y: "#fcc419", t: "#b08968", T: "#8a6a4a", k: "#3b2a1a" }, x + 54, y + 14) +
        // Still under construction, of course.
        new RectBatch().add("#fcc419", x + 90, y + 4, 1, 34).add("#fcc419", x + 78, y + 4, 16, 1).add("#1a1a1a", x + 80, y + 5, 1, 6).toString() +
        ground(x, y, 38, "#d9c7a8"),
      feet: { x: x + 22, y: y + 55 },
      friend: { x: x + 40, y: y + 55 },
    }),
  },
  {
    name: "MOSCOW",
    ink: "#c92a2a",
    stamp: { bg: "#fff5f5", grid: ["..y..", ".ggg.", "gGgGg", ".ggg.", "rrrrr"], colors: { y: "#fcc419", g: "#2f9e44", G: "#8ce99a", r: "#c92a2a" } },
    souvenir: { name: "a matryoshka", grid: [".ff.", "rffr", "rrrr", "ryyr", ".rr."], colors: { f: "#f8d8b0", r: "#e03131", y: "#fcc419" } },
    draw: (x, y) => ({
      bg: sky(x, y, "snow") + px(ST_BASILS, { y: "#fcc419", g: "#2f9e44", G: "#8ce99a", r: "#e03131", w: "#ffffff", b: "#1c7ed6", t: "#b5452b", R: "#e8a18f", k: "#3b1a14" }, x + 54, y + 20) + ground(x, y, 46, "#eef3f8", "#ffffff"),
      feet: { x: x + 24, y: y + 55 },
      friend: { x: x + 42, y: y + 55 },
    }),
  },
  {
    name: "ICELAND",
    ink: "#0b7285",
    stamp: { bg: "#0e1440", grid: ["g.g..", ".g.g.", "..g.g", "wwwww"], colors: { g: "#69db7c", w: "#ffffff" } },
    souvenir: { name: "a puffin", grid: ["kkk.", "kwwo", "kwwO", "kww."], colors: { k: "#1a1a1a", w: "#ffffff", o: "#ff922b", O: "#e8590c" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "night") +
        // The northern lights ripple across the sky.
        `<g class="pf-s-flicker" opacity=".8"><path d="M${x} ${y + 18}q24 -14 48 0t48 0v6q-24 -12 -48 0t-48 0z" fill="#69db7c" opacity=".7"/><path d="M${x} ${y + 28}q24 -10 48 0t48 -4v4q-24 -8 -48 2t-48 0z" fill="#b197fc" opacity=".5"/></g>` +
        mountain(x, y, 70, 50, 70, 22, "#3b4a6b", 8) + mountain(x, y, 22, 50, 50, 14, "#4a5a7b", 5) + ground(x, y, 48, "#dfe7f0", "#f8fbff"),
      feet: { x: x + 26, y: y + 55 },
    }),
  },
  {
    name: "SWISS ALPS",
    ink: "#c92a2a",
    stamp: { bg: "#fff5f5", grid: ["..w..", ".wgw.", ".ggg.", "ggggg"], colors: { w: "#ffffff", g: "#5c7cfa" } },
    souvenir: { name: "swiss cheese", grid: ["..yyy", "yyoyy", "yoyyy", "yyyyo"], colors: { y: "#fcc419", o: "#e8b10f" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "day") +
        mountain(x, y, 66, 48, 44, 44, "#7d8aa8", 14) + mountain(x, y, 30, 48, 60, 20, "#95a3be", 6) +
        ground(x, y, 46, "#6fbf5a", "#8cd176") +
        // A chalet with a pitched roof.
        new RectBatch().add("#b07845", x + 74, y + 40, 16, 10).add("#ffffff", x + 78, y + 43, 3, 3).add("#ffffff", x + 84, y + 43, 3, 3).toString() +
        `<path d="M${x + 71} ${y + 41}L${x + 82} ${y + 33}L${x + 93} ${y + 41}Z" fill="#6b3a1e"/>`,
      feet: { x: x + 26, y: y + 55 },
      friend: { x: x + 46, y: y + 55 },
    }),
  },
  {
    name: "ISTANBUL",
    ink: "#1864ab",
    stamp: { bg: "#e7f5ff", grid: ["m.k.m", "m.w.m", "mwwwm", "wwwww"], colors: { m: "#adb5bd", k: "#868e96", w: "#dee2e6" } },
    souvenir: { name: "a mosaic lamp", grid: ["..k..", ".rbr.", "rbybr", ".rbr.", "..k.."], colors: { k: "#b8860b", r: "#e03131", b: "#1c7ed6", y: "#fcc419" } },
    draw: (x, y) => ({
      bg: sky(x, y, "sunset") + sun(x + 18, y + 14, 5, "#fff3bf") + px(MOSQUE, { m: "#c9cfd6", k: "#868e96", w: "#e9e4dc", a: "#8d99ae" }, x + 50, y + 22) + water(x, y, 42, "#3a6ea5", "#a5d8ff") + new RectBatch().add("#b08968", x, y + 50, 40, 10).toString(),
      feet: { x: x + 20, y: y + 52 },
    }),
  },
  {
    name: "BERLIN",
    ink: "#343a40",
    stamp: { bg: "#f8f9fa", grid: ["...q...", "..qqq..", "sssssss", "SSSSSSS", "s.s.s.s", "s.s.s.s", "s.s.s.s", "sssssss"], colors: { q: "#2f9e44", s: "#c9b28a", S: "#a68b5b" } },
    souvenir: { name: "a pretzel", grid: [".bb.bb.", "b..b..b", "b.bwb.b", "bb...bb", ".bbwbb."], colors: { b: "#b5651d", w: "#f8f9fa" } },
    draw: (x, y) => ({
      bg: sky(x, y, "day") + cloud(x + 8, y + 6, 20) + px(GATE, { q: "#3f8f6a", s: "#d9c49a", S: "#b8a07a" }, x + 54, y + 20) + ground(x, y, 42, "#adb5bd", "#ced4da"),
      feet: { x: x + 24, y: y + 55 },
      friend: { x: x + 42, y: y + 55 },
    }),
  },
];

