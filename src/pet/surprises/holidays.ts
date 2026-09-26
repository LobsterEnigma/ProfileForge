/**
 * Holidays: each one dresses the pet up and decorates the scene around it.
 */
import { RectBatch } from "../../svg/batch.js";
import type { Grid } from "../../svg/pixel.js";
import { pixelText } from "../../svg/pixelfont.js";
import { newYearFor, zodiacFor, type Holiday } from "../../world/calendar.js";
import { HEART } from "../sprites.js";
import { confetti, drift, fireworks, px, round, text, textSize, type Art, type Ctx } from "./kit.js";
import {
  CANDY_PAIL,
  CANDY_PAIL_PALETTE,
  COFFEE,
  COFFEE_PALETTE,
  glasses,
  heldAt,
  RED_ENVELOPE,
  RED_ENVELOPE_PALETTE,
  SANTA_HAT,
  TOP_HAT,
  WITCH_HAT,
} from "./wear.js";

// ── Christmas ────────────────────────────────────────────────────────────────

const TREE: Grid = [
  ".....g.....",
  "....ggg....",
  "...gggGg...",
  "....ggg....",
  "...ggggg...",
  "..gggggGg..",
  "...ggggg...",
  "..ggggggg..",
  ".gggggggGg.",
  "ggggggggggg",
  ".....b.....",
  ".....b.....",
];
const STAR: Grid = ["..y..", ".yyy.", "yyyyy", ".y.y."];
const LIGHTS: [number, number][] = [[5, 1], [4, 3], [6, 5], [3, 5], [5, 7], [2, 8], [7, 8], [4, 9], [8, 9], [1, 9]];
const XMAS = ["#ff4d4d", "#ffd166", "#7dd3fc", "#ff9ff3"];

const GIFT_RED: Grid = ["..y..y..", "...yy...", "rrryyrrr", "rrryyrrr", "yyyyyyyy", "rrryyrrr", "rrryyrrr"];
const GIFT_BLUE: Grid = [".w..w.", "..ww..", "bbwwbb", "wwwwww", "bbwwbb", "bbwwbb"];

function christmas(c: Ctx): Art {
  const { scene: sc } = c;
  const s = 4;
  const tx = sc.x + 6;
  const ty = sc.ground - TREE.length * s + 2;
  const lights = LIGHTS.map(
    ([col, row], i) => `<rect class="${i % 2 ? "pf-s-blink" : "pf-s-blink2"}" x="${tx + col * s}" y="${ty + row * s}" width="${s - 1}" height="${s - 1}" fill="${XMAS[i % XMAS.length]}"/>`,
  ).join("");
  const star = `<g class="pf-s-twinkle">${px(STAR, { y: "#ffd23f" }, tx + 5.5 * s - 7.5, ty - 4 * 3 + 2, 3)}</g>`;
  const back =
    px(TREE, { g: "#2b8a3e", G: "#51cf66", b: "#7a4a24" }, tx, ty, s) +
    lights +
    star +
    px(GIFT_RED, { r: "#e03131", y: "#ffd166" }, tx + 40, sc.ground - 17, 3) +
    px(GIFT_BLUE, { b: "#4c6ef5", w: "#ffffff" }, tx + 22, sc.ground - 13, 3);
  const snow = drift(c.rng, sc, 12, () => `<rect width="2" height="2" fill="#ffffff" opacity=".9"/>`, { seconds: [7, 11], sway: 8 });
  return {
    back,
    front: snow,
    hat: SANTA_HAT,
    banner: { text: "MERRY CHRISTMAS", color: "#c92a2a", shade: "#6b1010" },
    line: "Merry Christmas! · ho ho ho",
  };
}

// ── Halloween ────────────────────────────────────────────────────────────────

const PUMPKIN: Grid = ["....gg...", "..ooooo..", ".ooOoOoo.", "ooOooooOo", "ooOooooOo", "ooOooooOo", ".ooOoOoo.", "..ooooo.."];
const PUMPKIN_FACE: Grid = [".........", ".........", ".........", "..y...y..", ".yy...yy.", "....y....", ".y.y.y.y.", "..yyyyy.."];
const GHOST: Grid = ["..www..", ".wwwww.", "wwkwkww", "wwwwwww", "wwwkwww", "wwwwwww", "wwwwwww", "w.ww.ww"];
const BAT_UP = "M0 0L3 2L5 1L7 2L10 0L8 4L5 3L2 4Z";
const BAT_DOWN = "M0 4L3 2L5 1L7 2L10 4L8 3L5 4L2 3Z";

function halloween(c: Ctx): Art {
  const { scene: sc } = c;
  const g = sc.ground;
  const moon = `<circle cx="${sc.x + 34}" cy="${sc.y + 50}" r="17" fill="#ffb347" opacity=".25"/><circle cx="${sc.x + 34}" cy="${sc.y + 50}" r="12" fill="#ffc46b"/><circle cx="${sc.x + 30}" cy="${sc.y + 47}" r="2" fill="#f0a63c"/><circle cx="${sc.x + 38}" cy="${sc.y + 54}" r="3" fill="#f0a63c"/>`;
  const bat = (x: number, y: number, d: number) =>
    `<g transform="translate(${x} ${y})"><path class="pf-fa" style="animation-duration:.5s;animation-delay:-${d}s" d="${BAT_UP}"/><path class="pf-fb" style="animation-duration:.5s;animation-delay:-${d}s" d="${BAT_DOWN}"/></g>`;
  const bats = `<g class="pf-s-bats" fill="#1a0f24">${bat(0, sc.y + 40, 0)}${bat(16, sc.y + 50, 0.2)}${bat(30, sc.y + 36, 0.1)}${bat(48, sc.y + 46, 0.3)}</g>`;
  const px0 = sc.x + sc.w - 40;
  const pumpkin = px(PUMPKIN, { o: "#f28c28", O: "#c9621a", g: "#3f7d3a" }, px0, g - 22, 3) + `<g class="pf-s-flicker">${px(PUMPKIN_FACE, { y: "#ffe066" }, px0, g - 22, 3)}</g>`;
  const ghost = `<g class="pf-s-ghost" opacity="0">${px(GHOST, { w: "#f8f9fa", k: "#343a40" }, sc.x + 14, g - 50, 3)}</g>`;
  const held = heldAt(c.species, c.scale, CANDY_PAIL, CANDY_PAIL_PALETTE);
  return {
    css: `.pf-s-bats{animation:pf-s-bats 13s linear infinite}
@keyframes pf-s-bats{from{transform:translateX(${sc.x + sc.w + 10}px)}to{transform:translateX(${sc.x - 70}px)}}
.pf-s-ghost{animation:pf-s-ghost 9s ease-in-out infinite}
@keyframes pf-s-ghost{0%,20%{opacity:0;transform:translate(0,8px)}35%{opacity:.85;transform:translate(4px,-4px)}55%{opacity:.85;transform:translate(10px,0)}72%{opacity:.85;transform:translate(4px,-6px)}85%,100%{opacity:0;transform:translate(0,8px)}}`,
    back: `<rect x="${sc.x}" y="${sc.y}" width="${sc.w}" height="${g - sc.y}" fill="#3b1a5a" opacity=".35"/>${moon}${bats}${ghost}${pumpkin}`,
    hat: WITCH_HAT,
    held: held.svg,
    banner: { text: "TRICK OR TREAT", color: "#e8590c", shade: "#5c2200" },
    line: "Trick or treat! · spooky season",
  };
}

// ── New Year ─────────────────────────────────────────────────────────────────

function newYear(c: Ctx): Art {
  const year = newYearFor(c.state.date);
  return {
    back: fireworks(c.rng, c.scene, ["#ff5c7a", "#ffd166", "#4cc9f0", "#c3a6ff"], 4),
    front: confetti(c.rng, c.scene, 22),
    hat: TOP_HAT,
    banner: { text: `HAPPY ${year}`, color: "#b8860b", shade: "#4d3800" },
    line: `Happy New Year! · hello ${year}`,
  };
}

// ── Lunar New Year ───────────────────────────────────────────────────────────

const LANTERN: Grid = [
  "...yy...",
  ".yyyyyy.",
  ".rrrrrr.",
  "hrrrrrrd",
  "hrrrrrrd",
  "hrryyrrd",
  "hryyyyrd",
  "hrryyrrd",
  "hrrrrrrd",
  ".rrrrrr.",
  ".yyyyyy.",
  "...yy...",
  "..y..y..",
  "..y..y..",
  "..y..y..",
];
const LANTERN_PALETTE = { r: "#e63946", h: "#ff6b6b", d: "#b5202e", y: "#ffd166" };
const COIN: Grid = [".yyy.", "yYyYy", "yy.yy", "yYyYy", ".yyy."];
const CRACKER: Grid = ["y", "r", "r", "r", "y"];

function lunarNewYear(c: Ctx): Art {
  const { scene: sc } = c;
  const animal = zodiacFor(c.state.date);
  const lantern = (x: number, string: number, delay: number) =>
    `<g class="pf-s-swing" style="animation-delay:-${delay}s"><rect x="${x + 11}" y="${sc.y}" width="1" height="${string}" fill="#5b4636"/>${px(LANTERN, LANTERN_PALETTE, x, sc.y + string, 3)}</g>`;
  // A string of firecrackers going off on the ground.
  const crackers = new RectBatch();
  const cx = sc.x + 8;
  const cy = sc.ground + 8;
  for (let i = 0; i < 7; i++) crackers.add("#8a5a33", cx + i * 5, cy + (i % 2), 5, 1);
  let pops = "";
  for (let i = 0; i < 7; i++) {
    pops += px(CRACKER, { y: "#ffd166", r: "#e03131" }, cx + i * 5 + 1, cy - 4 + (i % 2), 2);
    if (i % 2 === 0) {
      const d = round(i * 0.35);
      for (const [dx, dy] of [[-6, -8], [0, -12], [6, -8], [-4, -3], [4, -3]] as const) {
        pops += `<rect class="pf-s-spark" style="animation-duration:1.4s;animation-delay:-${d}s;--dx:${dx}px;--dy:${dy}px" x="${cx + i * 5 + 1}" y="${cy - 6}" width="2" height="2" fill="${dy < -6 ? "#ffd166" : "#ff6b6b"}"/>`;
      }
    }
  }
  const coins = drift(c.rng, sc, 8, () => px(COIN, { y: "#ffd23f", Y: "#e0a800" }, 0, 0, 1.6), { seconds: [6, 10], sway: 6 });
  return {
    back: lantern(sc.x + 6, 34, 0) + lantern(sc.x + sc.w - 30, 40, 1.2) + crackers + pops,
    front: coins,
    held: heldAt(c.species, c.scale, RED_ENVELOPE, RED_ENVELOPE_PALETTE, "pf-s-float").svg,
    banner: { text: `YEAR OF THE ${animal}`, color: "#c92a2a", shade: "#5c0a0a", ink: "#ffd166" },
    line: `Lunar New Year · year of the ${animal}`,
  };
}

// ── Mid-Autumn ───────────────────────────────────────────────────────────────

const RABBIT: Grid = [".x.x...", ".x.x...", ".xxx...", "xxxxxx.", ".xxxxxx", "..x..x."];
const MOONCAKE: Grid = ["..cccccccc..", ".cCcCcCcCcc.", ".cccCCCCccc.", ".dddddddddd.", ".dddddddddd.", "wwwwwwwwwwww", ".wwwwwwwwww."];
const ROUND_LANTERN: Grid = ["..yy..", ".oooo.", "oOoooo", "oOoooo", ".oooo.", "..yy..", "..y..."];

function midAutumn(c: Ctx): Art {
  const { scene: sc } = c;
  const mx = sc.x + sc.w - 38;
  const my = sc.y + 60;
  const moon =
    `<circle cx="${mx}" cy="${my}" r="30" fill="#fff4c2" opacity=".12"/><circle cx="${mx}" cy="${my}" r="25" fill="#fff4c2" opacity=".22"/>` +
    `<circle cx="${mx}" cy="${my}" r="20" fill="#fff1b8"/><circle cx="${mx - 9}" cy="${my - 8}" r="3" fill="#f5e08f"/><circle cx="${mx + 10}" cy="${my + 6}" r="4" fill="#f5e08f"/>` +
    px(RABBIT, { x: "#e3c86b" }, mx - 6, my - 3, 2);
  const lantern = (x: number, y: number, d: number) =>
    `<g class="pf-s-swing" style="animation-delay:-${d}s"><rect x="${x + 5}" y="${sc.y}" width="1" height="${y - sc.y}" fill="#5b4636"/><g class="pf-s-flicker" style="animation-delay:-${d}s">${px(ROUND_LANTERN, { o: "#ff922b", O: "#ffc078", y: "#ffd43b" }, x, y, 2)}</g></g>`;
  const cake = px(MOONCAKE, { c: "#d99a4e", C: "#a8652a", d: "#c07f3a", w: "#f1f3f5" }, sc.x + 12, sc.ground - 12, 2);
  return {
    back: moon + lantern(sc.x + 10, sc.y + 40, 0) + lantern(sc.x + 30, sc.y + 50, 0.8) + cake,
    banner: { text: "HAPPY MID-AUTUMN", color: "#e8590c", shade: "#6b2500", ink: "#fff3bf" },
    line: "Mid-Autumn · mooncakes & a full moon",
  };
}

// ── Valentine's Day ──────────────────────────────────────────────────────────

const BALLOON: Grid = [".rr.rr.", "rhrrrrr", "rhrrrrr", ".rrrrr.", "..rrr..", "...r..."];

function valentines(c: Ctx): Art {
  const { scene: sc, species, scale } = c;
  const w = species.width * scale;
  const h = species.height * scale;
  const hand = { x: w - scale, y: h * 0.55 };
  const bx = w + 2;
  const by = -30;
  const balloon =
    `<g class="pf-s-float"><path d="M${hand.x} ${hand.y}Q${w + 10} ${h * 0.2} ${bx + 10} ${by + 18}" fill="none" stroke="#8d96a0" stroke-width="1"/>` +
    px(BALLOON, { r: "#ff4d6d", h: "#ff9fb2" }, bx, by, 3) +
    `</g>`;
  const hearts = drift(c.rng, sc, 9, () => px(HEART, { p: "#ff8fab" }, 0, 0, 2), { from: sc.ground + 8, fall: -(sc.h - 10), seconds: [6, 10], sway: 10 });
  return {
    back: `<rect x="${sc.x}" y="${sc.y}" width="${sc.w}" height="${sc.ground - sc.y}" fill="#ff8fab" opacity=".12"/>`,
    front: hearts,
    held: balloon,
    banner: { text: "BE MY VALENTINE", color: "#e64980", shade: "#6b0f35" },
    line: "Happy Valentine's Day ♥",
  };
}

// ── π Day ────────────────────────────────────────────────────────────────────

const PIE: Grid = ["..cccccccc..", ".cCcCcCcCcc.", "cccccccccccc", "dddddddddddd", ".dddddddddd."];
const DIGITS = "3.14159265358979323846264338327950288419716939937510";

function piDay(c: Ctx): Art {
  const { scene: sc } = c;
  const s = 2;
  const t = textSize(DIGITS, s);
  const ticker = `<g opacity=".35"><g class="pf-s-ticker" style="--w:${-t.w - 12}px">${text(DIGITS, sc.x + 4, sc.y + 36, s, "#ffffff")}${text(DIGITS, sc.x + 16 + t.w, sc.y + 36, s, "#ffffff")}</g></g>`;
  const x = sc.x + 10;
  const y = sc.ground - 12;
  const flag = `<rect x="${x + 25}" y="${y - 20}" width="1" height="20" fill="#8a5a33"/><rect x="${x + 26}" y="${y - 20}" width="15" height="11" fill="#ffffff"/>${px(pixelText("π"), { x: "#7048e8" }, x + 27.75, y - 18.25, 1.5)}`;
  const steam = [0, 0.8, 1.6].map((d, i) => `<rect class="pf-s-steam" style="animation-delay:-${d}s" x="${x + 8 + i * 8}" y="${y - 5}" width="2" height="3" fill="#ffffff"/>`).join("");
  return {
    css: `.pf-s-ticker{animation:pf-s-ticker 26s linear infinite}@keyframes pf-s-ticker{to{transform:translateX(var(--w))}}`,
    back: ticker + steam + px(PIE, { c: "#f4a259", C: "#c8553d", d: "#adb5bd" }, x, y, 3) + flag,
    banner: { text: "HAPPY π DAY", color: "#7048e8", shade: "#2b1470" },
    line: "Happy π day · 3.14159…",
  };
}

// ── April Fools' ─────────────────────────────────────────────────────────────

function aprilFools(c: Ctx): Art {
  return {
    face: glasses(c.species, c.scale, "disguise"),
    banner: { text: "APRIL FOOLS!", color: "#12b886", shade: "#064d38" },
    line: `Nice disguise, ${c.state.petName}!`,
  };
}

// ── Programmer's Day ─────────────────────────────────────────────────────────

/** A column of 0s and 1s, top to bottom. */
function binaryColumn(bits: string): Grid {
  const rows: string[] = [];
  for (const b of bits) rows.push(...pixelText(b), "...", "...");
  return rows;
}

function programmersDay(c: Ctx): Art {
  const { scene: sc, rng } = c;
  const bs = 1.5;
  // Each bit is 5 pixels plus a 2-pixel gap; the column repeats after 20 bits.
  const span = 20 * 7 * bs;
  // Two columns of bits, drawn once and reused (stacked twice so the fall loops seamlessly).
  const patterns = [0, 1]
    .map((i) => {
      const bits = Array.from({ length: 20 }, () => (rng() < 0.5 ? "0" : "1")).join("");
      return `<g id="pf-s-bits${i}">${px(binaryColumn(bits), { x: "#3fb950" }, 0, 0, bs)}</g>`;
    })
    .join("");
  let rain = `<defs>${patterns}</defs>`;
  for (let x = sc.x + 4, i = 0; x < sc.x + sc.w - 4; x += 16, i++) {
    const t = round(5 + rng() * 5);
    const id = `#pf-s-bits${i % 2}`;
    rain += `<g class="pf-s-code" style="--t:${t}s;animation-delay:-${round(rng() * t)}s"><use href="${id}" x="${x}" y="${sc.y - span}"/><use href="${id}" x="${x}" y="${sc.y}"/></g>`;
  }
  const mug = heldAt(c.species, c.scale, COFFEE, COFFEE_PALETTE);
  const steam = [0, 1.2].map((d, i) => `<rect class="pf-s-steam" style="animation-delay:-${d}s" x="${mug.x + 2 + i * 5}" y="${mug.y - 4}" width="2" height="3" fill="#ffffff"/>`).join("");
  return {
    css: `.pf-s-code{animation:pf-s-code var(--t) linear infinite}@keyframes pf-s-code{from{transform:translateY(0)}to{transform:translateY(${span}px)}}`,
    back: `<rect x="${sc.x}" y="${sc.y}" width="${sc.w}" height="${sc.ground - sc.y}" fill="#0d1117" opacity=".35"/><clipPath id="pf-s-sky"><rect x="${sc.x}" y="${sc.y}" width="${sc.w}" height="${sc.ground - sc.y}"/></clipPath><g clip-path="url(#pf-s-sky)" opacity=".7">${rain}</g>`,
    face: glasses(c.species, c.scale, "nerd"),
    held: mug.svg + steam,
    banner: { text: "PROGRAMMER'S DAY", color: "#1a7f37", shade: "#07300f" },
    line: "Programmer's Day · 256 = 0x100",
  };
}

export const HOLIDAY_ART: Record<Holiday, (c: Ctx) => Art> = {
  "new-year": newYear,
  "lunar-new-year": lunarNewYear,
  valentines,
  "pi-day": piDay,
  "april-fools": aprilFools,
  "programmers-day": programmersDay,
  "mid-autumn": midAutumn,
  halloween,
  christmas,
};
