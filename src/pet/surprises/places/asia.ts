/** Asia: the Great Wall to Angkor Wat. */
import { RectBatch } from "../../../svg/batch.js";
import { outlined, type Grid } from "../../../svg/pixel.js";
import { cloud, ground, hill, moon, mountain, px, sky, skyline, sun, water } from "./photo.js";
import { PW, type Place } from "./types.js";

const PANDA: Grid = outlined([
  ".kk......kk.",
  "kkkwwwwwwkkk",
  ".kwwwwwwwwk.",
  ".wwkkwwkkww.",
  ".wkkwwwwkkw.",
  ".wwwwkkwwww.",
  "..wwwwwwww..",
  ".kkwwwwwwkk.",
  "kkkwwwwwwkkk",
  "kkwwwwwwwwkk",
  ".kkwwwwwwkk.",
  "..kkk..kkk..",
]);

const PEARL_TOWER: Grid = [
  "....k....",
  "....s....",
  "....s....",
  "...kpk...",
  "..kpPpk..",
  "...kpk...",
  "....s....",
  "....s....",
  "....s....",
  "...sss...",
  "..kpppk..",
  ".kpPpppk.",
  "kpPpppppk",
  "kpppppppk",
  ".kpppppk.",
  "..kpppk..",
  "..s.s.s..",
  "..s.s.s..",
  ".s..s..s.",
  ".s..s..s.",
  "s...s...s",
  "s...s...s",
];

const WARRIOR: Grid = outlined([
  "..hh...",
  ".hhhh..",
  ".ffff..",
  ".fkfk..",
  "..ff...",
  ".aAaA..",
  "aAaAaa.",
  "aaAaAa.",
  "fAaAaf.",
  ".aaaa..",
  ".aAaa..",
  ".l..l..",
  ".l..l..",
  "ll..ll.",
]);
const WARRIOR_COLORS = { h: "#4a3526", f: "#c89a6a", k: "#5b3a22", a: "#9c6b45", A: "#7a4f30", l: "#8a5a33", o: "#3b2616" };

const JUNK: Grid = [
  "....r.....r.....",
  "...rr....rr.....",
  "..rRr...rRr..r..",
  ".rrRr..rrRr.rr..",
  "rrrRr.rrrRrrRr..",
  "rrrRr.rrrRrrRr..",
  ".rrRr..rrRr.rr..",
  "...b.....b...b..",
  "bbbbbbbbbbbbbbbb",
  ".bBbBbBbBbBbBbb.",
  "..bbbbbbbbbbbb..",
];

/** Taipei 101: eight flared segments stacked like a bamboo stalk. */
const TAIPEI_101: Grid = [
  ".....k.....",
  ".....k.....",
  "....kgk....",
  "....ggg....",
  "...ggggg...",
  ...Array.from({ length: 8 }, () => ["..gGgggGg..", "...ggggg...", "...gwgwg..."]).flat(),
  "..ggggggg..",
  ".ggggggggg.",
  "ggggggggggg",
];

const TOKYO_TOWER: Grid = [
  "......o......",
  "......o......",
  ".....ooo.....",
  ".....owo.....",
  ".....ooo.....",
  "....oo.oo....",
  "....o.o.o....",
  "....wwwww....",
  "...oo.o.oo...",
  "...o.o.o.o...",
  "...oo.o.oo...",
  "..ooooooooo..",
  "..wwwwwwwww..",
  "..oo.o.o.oo..",
  "..o.o.o.o.o..",
  ".oo.o.o.o.oo.",
  ".o..o...o..o.",
  "oo..o...o..oo",
  "o...o...o...o",
];

const SEOUL_TOWER: Grid = [
  "...k...",
  "...k...",
  "...k...",
  "...w...",
  "..www..",
  ".wwwww.",
  ".wbbbw.",
  ".wwwww.",
  "..www..",
  ...Array.from({ length: 9 }, () => "...w..."),
  "..www..",
];

const TAJ: Grid = [
  "............k.............",
  "............k.............",
  "...........www............",
  ".........wwwwwww..........",
  "........wwwwwwwww.........",
  "........wwwwwwwww.........",
  ".m.......wwwwwww.......m..",
  ".m........wwwww........m..",
  "mmm..w...wwwwwww...w..mmm.",
  ".m..www.wwwwwwwww.www..m..",
  ".m..www.wwwwwwwww.www..m..",
  ".m.wwwwwwwwwwwwwwwwwww.m..",
  ".m.wsswwwwwaaawwwwwssw.m..",
  ".m.wsswwwwaaaaawwwwssw.m..",
  ".m.wwwwwwwaaaaawwwwwww.m..",
  "mmmwwwwwwwaaaaawwwwwwwmmm.",
  "wwwwwwwwwwwwwwwwwwwwwwwww.",
];

/** Angkor Wat's five lotus-bud towers, the middle one tallest. */
const ANGKOR: Grid = [
  "............t............",
  "...........ttt...........",
  "...........ttt...........",
  "...t......ttttt......t...",
  "..ttt.....ttttt.....ttt..",
  "..ttt....ttTtttt....ttt..",
  ".ttttt...ttTtttt...ttttt.",
  ".ttTtt..tttTttttt..ttTtt.",
  ".ttTtt.t.tttttt.t..ttTtt.",
  "ttttttttttttttttttttttttt",
  "tTtTtTtTtTtTtTtTtTtTtTtTt",
  "ttttttttttttttttttttttttt",
];

/** A torii gate: two posts, a tie beam, and a curved black-topped lintel. */
function torii(b: RectBatch, cx: number, base: number, h: number): void {
  const w = h * 0.9;
  const post = Math.max(1, Math.round(h / 10));
  b.add("#d9480f", cx - w / 2 + w * 0.12, base - h, post, h);
  b.add("#d9480f", cx + w / 2 - w * 0.12 - post, base - h, post, h);
  b.add("#d9480f", cx - w / 2 + w * 0.05, base - h * 0.78, w * 0.9, Math.max(1, post));
  b.add("#d9480f", cx - w / 2, base - h - post, w, post + 1);
  b.add("#2b1e1e", cx - w / 2 - 1, base - h - post * 2, w + 2, post);
}

export const ASIA: Place[] = [
  {
    name: "BEIJING",
    ink: "#c92a2a",
    stamp: { bg: "#fff3d6", grid: ["t.t.t", "ttttt", "twtwt", "ttttt", "ttttt"], colors: { t: "#a67c52", w: "#fff3d6" } },
    souvenir: { name: "hawthorn candy", grid: [".r.", "rRr", ".r.", "rRr", ".r.", "rRr", ".b.", ".b."], colors: { r: "#e03131", R: "#ff8787", b: "#8a5a33" } },
    draw: (x, y) => {
      // The Great Wall climbing a ridge to a watchtower.
      const wall = new RectBatch();
      let wy = 46;
      for (let i = 0; i < 8; i++) {
        const sx = x + 18 + i * 8;
        wall.add("#c9b28a", sx, y + wy, 9, 7).add("#9c8460", sx, y + wy + 6, 9, 1).add("#c9b28a", sx + 1, y + wy - 2, 2, 2).add("#c9b28a", sx + 5, y + wy - 2, 2, 2);
        wy -= 3;
      }
      wall.add("#b39a73", x + 80, y + 14, 14, 20).add("#c9b28a", x + 79, y + 12, 16, 3);
      for (const dx of [79, 83, 87, 91]) wall.add("#c9b28a", x + dx, y + 9, 2, 3);
      wall.add("#5b4636", x + 83, y + 18, 3, 5).add("#5b4636", x + 88, y + 18, 3, 5);
      return {
        bg: sky(x, y, "day") + cloud(x + 10, y + 6, 20) + hill(x, y, 72, 50, 70, 30, "#5ea65e") + hill(x, y, 18, 52, 56, 16, "#79b865") + ground(x, y, 50, "#6fae5f") + wall,
        feet: { x: x + 16, y: y + 57 },
      };
    },
  },
  {
    name: "CHENGDU",
    ink: "#2b8a3e",
    stamp: { bg: "#d3f9d8", grid: [".k.k.", "kwwwk", "wkwkw", "wwkww", ".www."], colors: { k: "#1a1a1a", w: "#ffffff" } },
    souvenir: { name: "a panda plush", grid: [".k.k.", "kwwwk", "wkwkw", "wwkww", "kwwwk", ".k.k."], colors: { k: "#1a1a1a", w: "#ffffff" } },
    draw: (x, y) => {
      const bamboo = new RectBatch();
      for (const [bx, c] of [[4, "#5aa35a"], [14, "#3f8f4f"], [40, "#5aa35a"], [52, "#3f8f4f"], [86, "#5aa35a"], [92, "#3f8f4f"]] as const) {
        bamboo.add(c, x + bx, y, 3, 50);
        for (let ny = 6; ny < 50; ny += 9) bamboo.add("#2c6b3a", x + bx, y + ny, 3, 1);
        bamboo.add("#6fbf6a", x + bx + 3, y + 10 + (bx % 7), 5, 2).add("#6fbf6a", x + bx - 5, y + 22 + (bx % 5), 5, 2);
      }
      const stalk = new RectBatch().add("#8fd18f", x + 60, y + 30, 2, 16).add("#6fbf6a", x + 57, y + 28, 4, 2);
      return {
        bg: sky(x, y, "mist") + bamboo + ground(x, y, 48, "#79b865", "#8cc97a") + px(PANDA, { k: "#1a1a1a", w: "#ffffff", o: "#3b3b3b" }, x + 58, y + 22) + stalk,
        feet: { x: x + 24, y: y + 54 },
      };
    },
  },
  {
    name: "SHANGHAI",
    ink: "#d6336c",
    stamp: { bg: "#1b2156", grid: [".p.", "ppp", ".s.", "ppp", "s.s"], colors: { p: "#ff5c9a", s: "#c3c9e8" } },
    souvenir: { name: "soup dumplings", grid: [".w.w.", "wwwww", "wwwww", "bbbbb", "bBbBb"], colors: { w: "#fff8ef", b: "#c79a5b", B: "#a67c3d" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "night") +
        skyline(x, y, 46, [[34, 8, 20, "#232a52"], [44, 6, 28, "#1c2246"], [52, 10, 16, "#232a52"], [80, 7, 30, "#1c2246"], [88, 8, 22, "#232a52"]], "#ffd6e7") +
        px(PEARL_TOWER, { k: "#2a2f5a", p: "#ff5c9a", P: "#ffc2d9", s: "#c3c9e8" }, x + 62, y + 2) +
        new RectBatch().add("#5c6370", x, y + 44, PW, 4).toString() +
        water(x, y, 48, "#16204a", "#ff8fb8"),
      feet: { x: x + 20, y: y + 47 },
      friend: { x: x + 40, y: y + 47 },
    }),
  },
  {
    name: "GUILIN",
    ink: "#0b7285",
    stamp: { bg: "#e6fcf5", grid: ["..g..g", ".gg.gg", ".gggg.", "gggggg", "bbbbbb"], colors: { g: "#2f9e44", b: "#4dabf7" } },
    souvenir: { name: "a bamboo hat", grid: ["...y...", "..yyy..", ".yYyyy.", "yyyyyyy"], colors: { y: "#e0b861", Y: "#f2d28f" } },
    draw: (x, y) => {
      const raft = new RectBatch();
      for (let i = 0; i < 8; i++) raft.add(i % 2 ? "#c9a36b" : "#a88450", x + 10 + i * 4, y + 50, 4, 4);
      raft.add("#6b4a2a", x + 10, y + 53, 32, 1);
      return {
        bg:
          sky(x, y, "mist") +
          hill(x, y, 22, 46, 20, 36, "#8db89a") + hill(x, y, 50, 46, 22, 26, "#7aa888") + hill(x, y, 76, 46, 20, 40, "#6a9e7a") + hill(x, y, 94, 46, 16, 24, "#8db89a") +
          water(x, y, 44, "#5aa6a0", "#b8e0dc") + raft,
        feet: { x: x + 26, y: y + 51 },
      };
    },
  },
  {
    name: "XI'AN",
    ink: "#a0522d",
    stamp: { bg: "#fff4e6", grid: [".hh.", "hhhh", "ffff", "fkfk", ".ff."], colors: { h: "#4a3526", f: "#c89a6a", k: "#5b3a22" } },
    souvenir: { name: "a mini warrior", grid: [".hh.", ".ff.", "aAaA", "aaAa", ".l.l"], colors: { h: "#4a3526", f: "#c89a6a", a: "#9c6b45", A: "#7a4f30", l: "#8a5a33" } },
    draw: (x, y) => {
      const pit = new RectBatch().add("#c9955f", x, y + 8, PW, 18).add("#b07845", x, y + 26, PW, 34);
      for (let ly = 12; ly < 26; ly += 5) pit.add("#a97a4a", x, y + ly, PW, 1);
      let army = "";
      for (const [wx, base] of [[48, 36], [64, 36], [80, 36], [56, 54], [72, 54], [88, 54]] as const) army += px(WARRIOR, WARRIOR_COLORS, x + wx - 8, y + base - 32);
      return { bg: sky(x, y, "day") + pit + army, feet: { x: x + 22, y: y + 56 } };
    },
  },
  {
    name: "HONG KONG",
    ink: "#c92a2a",
    stamp: { bg: "#fff4e6", grid: ["..r..", ".rRr.", "rrRrr", "..b..", "bbbbb"], colors: { r: "#d9480f", R: "#a8350a", b: "#6b4226" } },
    souvenir: { name: "an egg tart", grid: [".bbbb.", "bYyyYb", "byyyyb", ".bbbb."], colors: { b: "#c68b59", y: "#ffd43b", Y: "#fff3bf" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "night") +
        mountain(x, y, 70, 30, 90, 16, "#1c2246") +
        skyline(x, y, 38, [[0, 8, 22, "#2a3160"], [9, 6, 30, "#232a52"], [16, 9, 18, "#2a3160"], [26, 5, 34, "#1f2550"], [32, 8, 24, "#2a3160"], [41, 7, 28, "#232a52"], [49, 9, 20, "#2a3160"], [59, 6, 32, "#1f2550"], [66, 8, 22, "#2a3160"], [75, 7, 26, "#232a52"], [83, 9, 18, "#2a3160"]], "#9ff0ff") +
        water(x, y, 38, "#101a44", "#ff8fb8") +
        px(JUNK, { r: "#d9480f", R: "#a8350a", b: "#6b4226", B: "#8a5a33" }, x + 58, y + 32) +
        new RectBatch().add("#5b4636", x, y + 50, 40, 4).add("#3b2a1a", x + 4, y + 54, 3, 6).add("#3b2a1a", x + 32, y + 54, 3, 6).toString(),
      feet: { x: x + 20, y: y + 51 },
    }),
  },
  {
    name: "TAIPEI",
    ink: "#2b8a3e",
    stamp: { bg: "#e6fcf5", grid: ["..k..", ".ggg.", ".GgG.", ".ggg.", ".GgG.", "ggggg"], colors: { k: "#3b5b58", g: "#7fbfb5", G: "#a5d8cf" } },
    souvenir: { name: "bubble tea", grid: ["..k..", "wwwww", "wtttw", "wtttw", "wkkkw", ".www."], colors: { k: "#3b2616", w: "#e7f5ff", t: "#d9a066" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "day") + cloud(x + 8, y + 8, 18) +
        hill(x, y, 30, 48, 70, 18, "#6fae7a") + hill(x, y, 88, 48, 50, 14, "#5e9e6a") +
        skyline(x, y, 48, [[40, 8, 12, "#b8c4d0"], [50, 6, 16, "#a5b4c3"], [82, 9, 14, "#b8c4d0"]], "#e7f5ff") +
        px(TAIPEI_101, { k: "#3b5b58", g: "#7fbfb5", G: "#a5d8cf", w: "#e7f5ff" }, x + 60, y + 48 - TAIPEI_101.length * 2) +
        ground(x, y, 48, "#8a9099", "#adb5bd"),
      feet: { x: x + 22, y: y + 54 },
      friend: { x: x + 42, y: y + 54 },
    }),
  },
  {
    name: "TOKYO",
    ink: "#e8590c",
    stamp: { bg: "#fff0f6", grid: ["..w..", ".www.", "bbbbb", "bbbbb"], colors: { w: "#ffffff", b: "#5c7cfa" } },
    souvenir: { name: "a lucky cat", grid: ["w.w.w", "wwwww", "kwkww", "wwrww", "wwwww", ".yyy."], colors: { w: "#ffffff", k: "#1a1a1a", r: "#e03131", y: "#fcc419" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "sunset") + sun(x + 16, y + 16, 5, "#fff3bf") +
        mountain(x, y, 36, 46, 70, 30, "#7c86b8", 10) +
        skyline(x, y, 48, [[0, 10, 8, "#5c4a7a"], [12, 7, 12, "#4a3b66"], [22, 9, 7, "#5c4a7a"], [80, 8, 10, "#4a3b66"], [88, 8, 14, "#5c4a7a"]], "#ffe8a3") +
        px(TOKYO_TOWER, { o: "#ff6b1a", w: "#ffffff" }, x + 54, y + 48 - TOKYO_TOWER.length * 2) +
        ground(x, y, 48, "#6b5a7a"),
      feet: { x: x + 22, y: y + 55 },
      friend: { x: x + 40, y: y + 55 },
    }),
  },
  {
    name: "KYOTO",
    ink: "#d9480f",
    stamp: { bg: "#fff4e6", grid: ["kkkkkk", "rrrrrr", ".r..r.", "rrrrrr", ".r..r.", ".r..r."], colors: { k: "#2b1e1e", r: "#d9480f" } },
    souvenir: { name: "a cup of matcha", grid: ["wgggw", "wgGgw", "wwwww", ".www."], colors: { w: "#f1f3f5", g: "#6aa84f", G: "#9ccc65" } },
    draw: (x, y) => {
      // A tunnel of torii gates up the hill, getting bigger as they come closer.
      const gates = new RectBatch();
      // Receding up a path to the right: small and far, then big and near.
      for (const [cx, base, h] of [[88, 34, 8], [82, 37, 11], [75, 41, 15], [67, 46, 20], [58, 52, 26]] as const) torii(gates, x + cx, y + base, h);
      return {
        bg: sky(x, y, "day") + hill(x, y, 60, 44, 110, 30, "#3f7d4f") + ground(x, y, 44, "#5e9e6a") + new RectBatch().add("#d9c7a8", x + 40, y + 44, 56, 16).add("#d9c7a8", x + 62, y + 36, 30, 8).toString() + gates,
        feet: { x: x + 22, y: y + 56 },
      };
    },
  },
  {
    name: "SEOUL",
    ink: "#5f3dc4",
    stamp: { bg: "#f3f0ff", grid: ["..k..", ".www.", ".wbw.", "..w..", "..w..", ".ggg."], colors: { k: "#343a40", w: "#ffffff", b: "#5c7cfa", g: "#2f9e44" } },
    souvenir: { name: "kimchi", grid: [".bb.", "brrb", "brRb", "brrb", ".bb."], colors: { b: "#8a5a33", r: "#e03131", R: "#ff6b6b" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "dusk") +
        hill(x, y, 68, 50, 70, 26, "#2f5d3a") +
        px(SEOUL_TOWER, { k: "#343a40", w: "#f1f3f5", b: "#91a7ff" }, x + 61, y + 26 - SEOUL_TOWER.length * 2 + 4) +
        skyline(x, y, 54, [[0, 12, 10, "#3b3566"], [14, 8, 16, "#2f2a55"], [24, 10, 8, "#3b3566"], [84, 12, 12, "#2f2a55"]], "#ffd8a8") +
        ground(x, y, 54, "#4a4270"),
      feet: { x: x + 24, y: y + 56 },
      friend: { x: x + 44, y: y + 56 },
    }),
  },
  {
    name: "BALI",
    ink: "#2b8a3e",
    stamp: { bg: "#e6fcf5", grid: ["..w..", ".wyw.", "wyyyw", ".wyw.", "..w.."], colors: { w: "#ffffff", y: "#fcc419" } },
    souvenir: { name: "a frangipani", grid: ["..w..", ".wyw.", "wyyyw", ".wyw.", "..w.."], colors: { w: "#ffffff", y: "#fcc419" } },
    draw: (x, y) => {
      // Rice terraces stepping down the hill, and a split temple gate.
      const terraces = new RectBatch();
      for (let i = 0; i < 6; i++) terraces.add(i % 2 ? "#74c26b" : "#5eaf57", x + 40 - i * 6, y + 26 + i * 5, 80, 5).add("#9ad48f", x + 40 - i * 6, y + 26 + i * 5, 80, 1);
      const gate = new RectBatch();
      for (const side of [0, 1]) {
        const gx = x + (side ? 82 : 64);
        for (let s = 0; s < 5; s++) gate.add(s % 2 ? "#6b5a4a" : "#826d58", gx + (side ? 0 : s), y + 8 + s * 4, 10 - s, 4);
        gate.add("#826d58", gx, y + 28, 10, 20);
      }
      return { bg: sky(x, y, "tropical") + cloud(x + 6, y + 6, 16) + terraces + gate, feet: { x: x + 22, y: y + 56 } };
    },
  },
  {
    name: "SINGAPORE",
    ink: "#c92a2a",
    stamp: { bg: "#1b2156", grid: ["bbbbbb", "t.t.t.", "t.t.t.", "t.t.t."], colors: { b: "#c3c9e8", t: "#8d99c2" } },
    souvenir: { name: "a durian", grid: [".g.g.", "ggggg", "gGgGg", "ggggg", ".ggg."], colors: { g: "#94d82d", G: "#5c940d" } },
    draw: (x, y) => {
      const mbs = new RectBatch();
      for (const tx of [50, 62, 74]) {
        mbs.add("#8d99c2", x + tx, y + 16, 8, 28).add("#aab4d6", x + tx, y + 16, 2, 28);
        for (let wy = 19; wy < 42; wy += 4) mbs.add("#ffe8a3", x + tx + 3, y + wy, 3, 1);
      }
      mbs.add("#c3c9e8", x + 46, y + 12, 42, 3).add("#5c6b99", x + 48, y + 15, 38, 1).add("#c3c9e8", x + 84, y + 11, 6, 2);
      return {
        bg: sky(x, y, "night") + moon(x + 16, y + 12) + mbs + water(x, y, 44, "#101a44", "#ffe8a3"),
        feet: { x: x + 22, y: y + 44 },
        fg: new RectBatch().add("#5c6370", x, y + 44, 40, 3).toString(),
      };
    },
  },
  {
    name: "AGRA",
    ink: "#a61e4d",
    stamp: { bg: "#fff0f6", grid: ["..k..", ".www.", "wwwww", "wwwww", "waaaw", "wwwww"], colors: { k: "#868e96", w: "#ffffff", a: "#d8cbb3" } },
    souvenir: { name: "masala chai", grid: ["..s..", "bbbbb", "bcccb", "bcccb", ".bbb."], colors: { s: "#ffffff", b: "#c68b59", c: "#a0522d" } },
    draw: (x, y) => ({
      bg:
        sky(x, y, "sunset") +
        px(TAJ, { k: "#868e96", w: "#f8f4ec", s: "#e3d9c6", a: "#d8cbb3", m: "#f1ebe0" }, x + 44, y + 4) +
        ground(x, y, 38, "#6fae5f") +
        new RectBatch().add("#7fc8e6", x + 60, y + 40, 20, 20).add("#bfe6f5", x + 64, y + 42, 4, 16).toString(),
      feet: { x: x + 24, y: y + 56 },
    }),
  },
  {
    name: "EVEREST",
    ink: "#1971c2",
    stamp: { bg: "#e7f5ff", grid: ["..w..", ".www.", ".gww.", "gggwg", "ggggg"], colors: { w: "#ffffff", g: "#748ffc" } },
    souvenir: { name: "prayer flags", grid: ["kkkkk", "bwrgy", "bwrgy"], colors: { k: "#5b4636", b: "#1c7ed6", w: "#ffffff", r: "#e03131", g: "#2f9e44", y: "#fcc419" } },
    draw: (x, y) => {
      const flags = new RectBatch();
      const colours = ["#1c7ed6", "#ffffff", "#e03131", "#2f9e44", "#fcc419"];
      for (let i = 0; i < 10; i++) {
        const fx = x + 2 + i * 5;
        const fy = y + 8 + Math.round(Math.sin((i / 9) * Math.PI) * 5);
        flags.add("#5b4636", fx, fy, 5, 1).add(colours[i % 5]!, fx + 1, fy + 1, 3, 4);
      }
      return {
        bg:
          sky(x, y, "day") +
          mountain(x, y, 30, 52, 70, 26, "#8ea3c7", 8) + mountain(x, y, 66, 52, 84, 48, "#6f84ad", 18) + mountain(x, y, 94, 52, 40, 20, "#8ea3c7", 6) +
          ground(x, y, 50, "#eef3f8", "#ffffff") + flags,
        feet: { x: x + 22, y: y + 56 },
      };
    },
  },
  {
    name: "DUBAI",
    ink: "#b8860b",
    stamp: { bg: "#fff9db", grid: ["..s..", "..s..", ".sss.", ".sss.", "sssss"], colors: { s: "#8d99ae" } },
    souvenir: { name: "some dates", grid: ["bb.bb", "bBbbB", ".bb..", ".Bb.."], colors: { b: "#7a4a24", B: "#a0673a" } },
    draw: (x, y) => {
      const burj = new RectBatch();
      const widths = [10, 10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1];
      widths.forEach((w, i) => burj.add(i % 3 ? "#cfd8e3" : "#eef3f8", x + 72 - w, y + 46 - i * 2, w * 2, 2));
      burj.add("#cfd8e3", x + 71, y + 46 - widths.length * 2 - 8, 2, 8);
      return {
        bg: sky(x, y, "desert") + sun(x + 20, y + 12, 5, "#fff3bf") + burj + hill(x, y, 20, 60, 70, 16, "#e8c98f") + hill(x, y, 80, 60, 60, 12, "#dcb877") + ground(x, y, 52, "#e8c98f"),
        feet: { x: x + 26, y: y + 55 },
      };
    },
  },
  {
    name: "ANGKOR WAT",
    ink: "#9c6b30",
    stamp: { bg: "#fff4e6", grid: ["..t..", ".ttt.", "t.t.t", "ttttt", "ttttt"], colors: { t: "#7a5c3a" } },
    souvenir: { name: "a lotus", grid: ["..p..", ".pPp.", "pPpPp", ".ggg."], colors: { p: "#f783ac", P: "#fcc2d7", g: "#2f9e44" } },
    draw: (x, y) => {
      const lotus = new RectBatch();
      for (const [lx, ly] of [[60, 54], [80, 50], [72, 57]] as const) lotus.add("#2f9e44", x + lx - 2, y + ly + 2, 7, 2).add("#f783ac", x + lx, y + ly, 3, 2);
      return {
        bg: sky(x, y, "sunset") + sun(x + 80, y + 14, 6, "#fff3bf") + px(ANGKOR, { t: "#6b4f35", T: "#8a6a4a" }, x + 22, y + 12) + ground(x, y, 36, "#6fae5f") + water(x, y, 44, "#e8a37a", "#ffd8a8") + lotus,
        feet: { x: x + 20, y: y + 44 },
      };
    },
  },
];
