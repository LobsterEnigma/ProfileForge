/** Programmer-land: Localhost, The Cloud, Null Island, Stack Overflow and friends. */
import { RectBatch } from "../../../svg/batch.js";
import { outlined, type Grid } from "../../../svg/pixel.js";
import { px, text } from "../kit.js";
import { PH, PW, type Place } from "./types.js";

const PALM: Grid = ["gg.gg..", ".gggg.g", "gg.bggg", "...b..g", "...b...", "..b....", "..b....", "..b...."];
const KERNEL: Grid = ["..yyyyyyyyyy..", ".yyyyyyyyyyyy.", "yyhhyyyyyyyyyo", "yyhyyyyyyyyyyo", ".yyyyyyyyyyyo.", "..yyyyyyyyyo..", "...yyyyyyyo...", "....yyyyyo....", ".....wwww.....", "......ww......"];
const DUCK: Grid = outlined(["...yyy...", "..yyyyk..", "..yyyyyrr", "..yyyy...", "yyyyyyyy.", "yyyyyyyyy", ".yyyyyyy.", "..yyyyy.."]);
const FLAMES: Grid = ["..r.....r....r...r.....r..", ".rr..r.rrr..rr..rrr..r.rr.", "rryrrrrryrrrryrrryrrrrryrr", "ryyyrryyyyrryyyrryyyrryyyr"];
const QUESTION: Grid = ["xx.", "..x", ".x.", "...", ".x."];

/** Places only a programmer would go. */
export const PROGRAMMER_PLACES: Place[] = [
  {
    name: "NULL ISLAND",
    ink: "#1971c2",
    stamp: { bg: "#d0ebff", grid: ["gg.gg", ".ggg.", "..b..", "..b..", "yyyyy"], colors: { g: "#2f9e44", b: "#8a5a33", y: "#f4d58d" } },
    souvenir: { name: "a coconut", grid: [".bbb.", "bbwbb", "bbbbb", ".bbb."], colors: { b: "#8a5a33", w: "#f1e3c6" } },
    draw: (x, y) => ({
      bg:
        new RectBatch().add("#8fd3ff", x, y, PW, 38).add("#3a86c8", x, y + 38, PW, 22).add("#9fd4ff", x + 8, y + 44, 10, 1).add("#9fd4ff", x + 70, y + 50, 12, 1)
          .add("#f4d58d", x + 18, y + 34, 58, 6).add("#f4d58d", x + 24, y + 32, 46, 2).add("#8a5a33", x + 10, y + 24, 2, 10).add("#ffffff", x + 3, y + 18, 17, 7).toString() +
        `<circle cx="${x + 84}" cy="${y + 10}" r="6" fill="#ffe066"/>` +
        text("0,0", x + 5, y + 19, 1, "#1f2328") +
        px(PALM, { g: "#2f9e44", b: "#8a5a33" }, x + 60, y + 16, 2),
      feet: { x: x + 40, y: y + 34 },
      friend: { x: x + 68, y: y + 34 },
    }),
  },
  {
    name: "LOCALHOST",
    ink: "#2b8a3e",
    stamp: { bg: "#ffe8cc", grid: ["..r..", ".rrr.", "rrrrr", "wwkww", "wwkww"], colors: { r: "#c92a2a", w: "#f8f0e3", k: "#8a5a33" } },
    souvenir: { name: "a keychain", grid: [".yy..", "y..y.", ".yy..", "..y..", "..yy.", "..y.."], colors: { y: "#e0a800" } },
    draw: (x, y) => ({
      bg:
        `<rect x="${x}" y="${y}" width="${PW}" height="44" fill="#ffd8a8"/><circle cx="${x + 14}" cy="${y + 36}" r="8" fill="#ffa94d"/>` +
        new RectBatch().add("#8ce99a", x, y + 44, PW, 16).add("#69db7c", x, y + 44, PW, 2).add("#f8f0e3", x + 54, y + 24, 36, 20).add("#ffffff", x + 56, y + 26, 32, 7)
          .add("#8a5a33", x + 67, y + 34, 8, 10).add("#ffd43b", x + 57, y + 35, 7, 6).add("#ffd43b", x + 79, y + 35, 7, 6).toString() +
        `<path d="M${x + 50} ${y + 24}L${x + 72} ${y + 8}L${x + 94} ${y + 24}Z" fill="#c92a2a"/>` +
        text("127.0.0.1", x + 57, y + 27, 1, "#495057"),
      feet: { x: x + 26, y: y + 46 },
      friend: { x: x + 44, y: y + 47 },
    }),
  },
  {
    name: "THE CLOUD",
    ink: "#1c7ed6",
    stamp: { bg: "#74c0fc", grid: [".ww..", "wwwww", "wwwww"], colors: { w: "#ffffff" } },
    souvenir: { name: "a cloud in a jar", grid: [".kkk.", "gwwwg", "gwwwg", "gwwwg", ".ggg."], colors: { k: "#8a5a33", g: "#a5d8ff", w: "#ffffff" } },
    draw: (x, y) => {
      const leds = [0, 1, 2].map((i) => `<rect class="${i % 2 ? "pf-s-blink" : "pf-s-blink2"}" x="${x + 66}" y="${y + 20 + i * 5}" width="8" height="2" fill="#51cf66"/>`).join("");
      return {
        bg:
          new RectBatch().add("#74c0fc", x, y, PW, 60).add("#a5d8ff", x, y + 30, PW, 30).add("#ffffff", x + 4, y + 42, 88, 18).add("#ffffff", x + 10, y + 35, 36, 8)
            .add("#ffffff", x + 52, y + 33, 34, 10).add("#ffffff", x + 70, y + 8, 18, 5).add("#ffffff", x + 74, y + 5, 10, 3).add("#495057", x + 63, y + 16, 14, 18).add("#343a40", x + 63, y + 16, 14, 2).toString() + leds,
        feet: { x: x + 28, y: y + 38 },
        friend: { x: x + 46, y: y + 40 },
      };
    },
  },
  {
    name: "STACK OVERFLOW",
    ink: "#e8590c",
    stamp: { bg: "#fff4e6", grid: ["ooooo.", "o.o.o.", "ooooo.", ".ooooo", ".o.o.o", ".ooooo"], colors: { o: "#f76707" } },
    souvenir: { name: "a spare box", grid: ["oooooo", "oyyyyo", "oyooyo", "oyyyyo", "oooooo"], colors: { o: "#7a3500", y: "#ffa94d" } },
    draw: (x, y) => {
      let boxes = "";
      for (let i = 0; i < 5; i++) {
        boxes += `<rect x="${x + 60 + (i % 2 ? 3 : -2)}" y="${y + 41 - i * 8}" width="20" height="7" fill="${i % 2 ? "#ffa94d" : "#f76707"}" stroke="#7a3500" stroke-width="1"/>`;
      }
      return {
        bg: new RectBatch().add("#d0ebff", x, y, PW, 48).add("#ced4da", x, y + 48, PW, 12).toString() + boxes + `<g class="pf-s-teeter"><rect x="${x + 64}" y="${y - 3}" width="20" height="7" fill="#f76707" stroke="#7a3500" stroke-width="1"/></g>`,
        feet: { x: x + 26, y: y + 49 },
        friend: { x: x + 46, y: y + 49 },
      };
    },
  },
  {
    name: "PORT 8080",
    ink: "#0b7285",
    stamp: { bg: "#c5f6fa", grid: ["..k..", ".kkk.", "..k..", "k.k.k", ".kkk."], colors: { k: "#0b7285" } },
    souvenir: { name: "an anchor", grid: ["..k..", ".kkk.", "..k..", "k.k.k", ".kkk."], colors: { k: "#495057" } },
    draw: (x, y) => {
      let tower = "";
      for (let i = 0; i < 4; i++) tower += `<rect x="${x + 78}" y="${y + 10 + i * 6}" width="9" height="6" fill="${i % 2 ? "#ffffff" : "#e03131"}"/>`;
      return {
        bg:
          new RectBatch().add("#a5d8ff", x, y, PW, 34).add("#1971c2", x, y + 34, PW, 26).add("#74c0fc", x + 56, y + 44, 12, 1).add("#74c0fc", x + 82, y + 50, 10, 1)
            .add("#8a5a33", x, y + 32, 50, 4).add("#6b4226", x + 4, y + 36, 3, 14).add("#6b4226", x + 44, y + 36, 3, 14).add("#8a5a33", x + 58, y + 22, 2, 12).add("#ffffff", x + 50, y + 15, 19, 8).toString() +
          tower +
          `<rect x="${x + 77}" y="${y + 3}" width="11" height="7" fill="#343a40"/><rect class="pf-s-blink" x="${x + 79}" y="${y + 5}" width="7" height="3" fill="#ffe066"/>` +
          text("8080", x + 52, y + 16.5, 1, "#1f2328"),
        feet: { x: x + 24, y: y + 33 },
      };
    },
  },
  {
    name: "THE KERNEL",
    ink: "#e67700",
    stamp: { bg: "#3b1f5c", grid: [".yyy.", "yyyyy", "yyyyy", ".yyy.", "..w.."], colors: { y: "#ffd43b", w: "#fff9db" } },
    souvenir: { name: "some popcorn", grid: ["w.w.w", "wwwww", "rwrwr", "rwrwr", ".rwr."], colors: { w: "#fff9db", r: "#e03131" } },
    draw: (x, y) => {
      const b = new RectBatch().add("#3b1f5c", x, y, PW, 46).add("#5c3d2e", x, y + 46, PW, 14);
      for (const [sx, sy] of [[6, 8], [24, 20], [40, 6], [88, 12], [92, 34]] as const) b.add("#ffffff", x + sx, y + sy, 1, 1);
      return {
        bg: b + px(KERNEL, { y: "#ffd43b", h: "#fff3bf", o: "#f59f00", w: "#fff9db" }, x + 56, y + 16, 2),
        feet: { x: x + 28, y: y + 47 },
        friend: { x: x + 44, y: y + 48 },
      };
    },
  },
  {
    name: "404 NOT FOUND",
    ink: "#868e96",
    stamp: { bg: "#e9ecef", grid: QUESTION, colors: { x: "#868e96" } },
    souvenir: { name: "nothing (404)", grid: ["kkkkk", "k.x.k", "k..xk", "k.x.k", "kkkkk"], colors: { k: "#868e96", x: "#495057" } },
    // The photo didn't come out: just "404", and a tail at the edge of the frame.
    draw: (x, y) => ({
      bg: `<rect x="${x}" y="${y}" width="${PW}" height="${PH}" fill="#e9ecef"/>` + text("404", x + 26, y + 10, 4, "#adb5bd") + text("NOT FOUND", x + 31, y + 38, 1, "#adb5bd"),
      feet: { x: x + PW + 8, y: y + 58 },
    }),
  },
  {
    name: "/DEV/NULL",
    ink: "#5f3dc4",
    stamp: { bg: "#1a1a2e", grid: [".ooo.", "o...o", "o.k.o", "o...o", ".ooo."], colors: { o: "#845ef7", k: "#ffffff" } },
    souvenir: { name: "an empty bag", grid: ["..k..", ".k.k.", "bbbbb", "b...b", "bbbbb"], colors: { k: "#495057", b: "#adb5bd" } },
    draw: (x, y) => {
      const b = new RectBatch().add("#0b0b14", x, y, PW, PH);
      for (const [sx, sy] of [[8, 6], [20, 40], [44, 8], [86, 20], [80, 52], [12, 54]] as const) b.add("#ffffff", x + sx, y + sy, 1, 1);
      return {
        bg:
          b +
          `<ellipse cx="${x + 62}" cy="${y + 26}" rx="24" ry="7" fill="none" stroke="#ff922b" stroke-width="2" opacity=".85"/>` +
          `<circle cx="${x + 62}" cy="${y + 26}" r="10" fill="#000000" stroke="#845ef7" stroke-width="2"/>` +
          `<path d="M${x + 38} ${y + 26}a24 7 0 0 0 48 0" fill="none" stroke="#ffc078" stroke-width="2"/>`,
        feet: { x: x + 24, y: y + 50 },
      };
    },
  },
  {
    name: "SPAGHETTI CODE",
    ink: "#c92a2a",
    stamp: { bg: "#fff9db", grid: ["yyy..", "y.yyy", "yyy.y", "..yyy", ".rr.."], colors: { y: "#fab005", r: "#a0522d" } },
    souvenir: { name: "a meatball", grid: [".rr.", "rRrr", "rrrr", ".rr."], colors: { r: "#8a4b2a", R: "#b86b40" } },
    draw: (x, y) => {
      const cloth = new RectBatch().add("#ffe3e3", x, y, PW, 38);
      for (let cx = 0; cx < PW; cx += 8) for (let cy = 38; cy < PH; cy += 8) cloth.add((cx + cy) % 16 ? "#ffffff" : "#e03131", x + cx, y + cy, 8, 8);
      const noodles = px(["..yyy.yyyy..", ".yy.yyy..yy.", "yyyy.yy.yyyy", "y.yyyyyyy.yy", ".yyy.yyyyyy."], { y: "#fcc419" }, x + 24, y + 34, 4);
      return {
        bg: cloth + `<ellipse cx="${x + 48}" cy="${y + 50}" rx="36" ry="8" fill="#ffffff" stroke="#ced4da" stroke-width="1"/>` + noodles + `<circle cx="${x + 70}" cy="${y + 38}" r="5" fill="#8a4b2a"/>`,
        feet: { x: x + 42, y: y + 40 },
      };
    },
  },
  {
    name: "THE FIREWALL",
    ink: "#e8590c",
    stamp: { bg: "#fff4e6", grid: ["..r..", ".rr..", ".ryr.", "ryyyr", ".rrr."], colors: { r: "#f03e3e", y: "#ffd43b" } },
    souvenir: { name: "a marshmallow", grid: ["ww...", "ww...", "..b..", "...b.", "....b"], colors: { w: "#fff4e6", b: "#8a5a33" } },
    draw: (x, y) => {
      const wall = new RectBatch().add("#2b1a3a", x, y, PW, 60).add("#3b2a1a", x, y + 50, PW, 10);
      for (let row = 0; row < 4; row++) for (let col = -1; col < 10; col++) wall.add(row % 2 ? "#b33b2b" : "#c9452f", x + col * 10 + (row % 2) * 5, y + 26 + row * 6, 9, 5);
      return {
        bg: wall + `<g class="pf-s-flicker">${px(FLAMES, { r: "#ff6b3b", y: "#ffd43b" }, x - 4, y + 10, 4)}</g>`,
        feet: { x: x + 28, y: y + 58 },
        fg: `<path d="M${x + 44} ${y + 46}L${x + 62} ${y + 30}" stroke="#8a5a33" stroke-width="1.5"/><rect x="${x + 60}" y="${y + 26}" width="5" height="5" rx="1" fill="#fff4e6"/>`,
      };
    },
  },
  {
    name: "HELLO WORLD",
    ink: "#1c7ed6",
    stamp: { bg: "#0b1d3a", grid: [".bbb.", "bgbgb", "bbgbb", "bgbbb", ".bbb."], colors: { b: "#4dabf7", g: "#51cf66" } },
    souvenir: { name: "a snow globe", grid: [".www.", "wbwbw", "wwgww", ".www.", "kkkkk"], colors: { w: "#e7f5ff", b: "#ffffff", g: "#51cf66", k: "#8a5a33" } },
    draw: (x, y) => {
      const b = new RectBatch().add("#0b1d3a", x, y, PW, PH);
      for (const [sx, sy] of [[8, 8], [30, 14], [70, 6], [88, 24], [14, 30], [80, 40]] as const) b.add("#ffffff", x + sx, y + sy, 1, 1);
      return {
        bg:
          b +
          `<circle cx="${x + 48}" cy="${y + 70}" r="34" fill="#4dabf7"/><path d="M${x + 26} ${y + 46}q8 -6 16 0t12 4v14h-28z M${x + 58} ${y + 42}q6 -2 12 4v10h-12z" fill="#51cf66"/>` +
          `<circle cx="${x + 48}" cy="${y + 70}" r="34" fill="none" stroke="#a5d8ff" stroke-width="1"/>`,
        feet: { x: x + 48, y: y + 37 },
      };
    },
  },
  {
    name: "RUBBER DUCK POND",
    ink: "#e67700",
    stamp: { bg: "#c5f6fa", grid: ["..yy.", ".yyyr", "yyyy.", ".yyy."], colors: { y: "#fcc419", r: "#f76707" } },
    souvenir: { name: "a rubber duck", grid: ["..yy.", ".yyyr", "yyyy.", ".yyy."], colors: { y: "#fcc419", r: "#f76707" } },
    draw: (x, y) => ({
      bg:
        new RectBatch().add("#c5f6fa", x, y, PW, 36).add("#4dabf7", x, y + 36, PW, 24).add("#a5d8ff", x + 6, y + 44, 12, 1).add("#a5d8ff", x + 76, y + 50, 12, 1).toString() +
        px(DUCK, { y: "#fcc419", k: "#1a1a1a", r: "#f76707", o: "#8a6a00" }, x + 34, y + 20, 4),
      feet: { x: x + 50, y: y + 28 },
    }),
  },
  {
    name: "THE MAINFRAME",
    ink: "#2b8a3e",
    stamp: { bg: "#e9ecef", grid: ["kkkkk", "kwwwk", "kkkkk", "kgggk", "kgggk"], colors: { k: "#343a40", w: "#ffffff", g: "#adb5bd" } },
    souvenir: { name: "a floppy disk", grid: ["kkkkk", "kwwwk", "kkkkk", "kgggk", "kgggk"], colors: { k: "#1c7ed6", w: "#ffffff", g: "#dee2e6" } },
    draw: (x, y) => {
      const b = new RectBatch().add("#343a40", x, y, PW, 46).add("#212529", x, y + 46, PW, 14);
      let reels = "";
      for (const cx of [52, 72]) {
        b.add("#adb5bd", x + cx - 8, y + 8, 18, 38);
        reels += `<circle cx="${x + cx + 1}" cy="${y + 16}" r="5" fill="#495057" stroke="#dee2e6"/><circle cx="${x + cx + 1}" cy="${y + 28}" r="5" fill="#495057" stroke="#dee2e6"/>`;
        for (let i = 0; i < 3; i++) reels += `<rect class="${i % 2 ? "pf-s-blink" : "pf-s-blink2"}" x="${x + cx - 5 + i * 5}" y="${y + 38}" width="3" height="2" fill="${["#ff6b6b", "#51cf66", "#ffd43b"][i]}"/>`;
      }
      return { bg: b + reels, feet: { x: x + 22, y: y + 56 } };
    },
  },
];
