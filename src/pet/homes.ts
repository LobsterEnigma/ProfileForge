/**
 * Homes for the newer pets: a hot spring, a forest floor, a coral reef, a garden after rain, a
 * pine wood, a tree with a birdhouse, the deep sea and a river. Each has props around the edges (leaving the middle to
 * the pet) and one small living thing.
 */
import { RectBatch } from "../svg/batch.js";
import { outlined, renderPixels, type Grid, type Palette } from "../svg/pixel.js";
import type { Area } from "../world/seasons.js";

export type Home = "onsen" | "forest" | "reef" | "garden" | "pinewood" | "treetop" | "deepsea" | "river";

const px = (grid: Grid, palette: Palette, x: number, y: number, scale: number) => renderPixels([{ x: 0, y: 0, grid }], palette, { x, y, scale });

// ── Pixel art ────────────────────────────────────────────────────────────────

const BAMBOO: Grid = ["g.", "gl", "gg", "Gg", "gg", "gl", "gg", "Gg", "gg", "gl", "gg", "Gg"];
const BAMBOO_LEAF: Grid = ["..ll", "lll.", "l..."];
const YUZU: Grid = outlined([".l.", "yyy", "yYy", ".y."]);

const LOG: Grid = outlined(["bbbbbbbbbbbrr", "bBbbbbBbbbbRr", "bbbbbbbbbbbrr"]);
const MUSHROOM: Grid = outlined(["..rrrr..", ".rwrrwr.", "rrrrrwrr", "rwrrrrrr", "..ssss..", "..ssss..", "..ssss.."]);
const MUSHROOM_SMALL: Grid = outlined([".rr.", "rwrr", ".ss.", ".ss."]);

const CORAL: Grid = [
  "c...c...",
  "c.c.c.c.",
  "ccc.ccc.",
  ".c...c..",
  ".cc.cc..",
  "..ccc...",
  "...c....",
  "...c....",
];
const CLAM: Grid = outlined([".pppp.", "pPpPpp", "pppppp"]);

const BIG_LEAF: Grid = outlined(["...gg..", "..gGgg.", ".ggGggg", "ggGgggg", "gGggggg", ".gggg..", "..s....", "..s...."]);
const TULIP: Grid = ["r.r.r", "rrrrr", ".rrr.", "..g..", ".gg..", "..g..", "..gg.", "..g.."];

const PINE: Grid = outlined(["...g...", "..ggg..", ".gGggg.", "..ggg..", ".ggggg.", "gggGggg", "..ggg..", ".ggggg.", "ggggggg", "...b...", "...b..."]);
const STUMP: Grid = outlined(["wwwww", "bbbbb", "bBbbb", "bbbbb"]);

const BIRDHOUSE: Grid = outlined(["..rr..", ".rrrr.", "rrrrrr", "wwwwww", "wwkkww", "wwkkww", "wwwwww", "..bb..", "..bb..", "..bb..", "..bb..", "..bb.."]);
const TREE: Grid = outlined([
  "....gggggg....",
  "..ggGGggggg...",
  ".gGGggggGggg..",
  "gggggggggGggg.",
  "ggGggggggggggg",
  "gggggGgggGgggg",
  ".gggggggggggg.",
  "..gggggbgggg..",
  "....g.bb.g....",
  "......bb......",
  "......bbb.....",
  "......bb......",
  "......bb......",
  ".....bbbb.....",
]);

// ── Props ────────────────────────────────────────────────────────────────────

export function homeProps(home: Home, area: Area): string {
  const g = area.ground;
  const left = area.x;
  const right = area.x + area.w;
  const b = new RectBatch();
  let art = "";
  switch (home) {
    case "onsen": {
      // Bamboo on the left; a steaming, stone-ringed spring on the right.
      art += px(BAMBOO, { g: "#5aa35a", G: "#2f7a3a", l: "#8fd18f" }, left + 6, g - 36, 3);
      art += px(BAMBOO, { g: "#5aa35a", G: "#2f7a3a", l: "#8fd18f" }, left + 16, g - 28, 3);
      art += px(BAMBOO_LEAF, { l: "#6fbf6a" }, left + 12, g - 40, 3);
      const px0 = right - 62;
      b.add("#8a9099", px0, g + 3, 56, 18).add("#8a9099", px0 + 4, g + 1, 48, 22);
      b.add("#7fd3d8", px0 + 5, g + 5, 46, 14).add("#b6ecee", px0 + 10, g + 7, 16, 2).add("#b6ecee", px0 + 30, g + 12, 12, 2);
      for (const [dx, dy] of [[0, 4], [10, 0], [22, 1], [34, 0], [46, 3], [52, 12], [44, 20], [28, 21], [12, 20], [2, 14]] as const) {
        b.add("#b0b6bf", px0 + dx, g + dy, 6, 4).add("#6b717a", px0 + dx, g + dy + 3, 6, 1);
      }
      break;
    }
    case "forest": {
      art += px(LOG, { b: "#8a5a33", B: "#6b4226", r: "#d9a066", R: "#b07d4a", o: "#3b2616" }, left + 2, g - 9, 3);
      art += px(MUSHROOM, { r: "#e03131", w: "#ffffff", s: "#f1e3c6", o: "#4a1a0c" }, right - 30, g - 24, 3);
      art += px(MUSHROOM_SMALL, { r: "#e03131", w: "#ffffff", s: "#f1e3c6", o: "#4a1a0c" }, right - 44, g - 14, 2);
      for (const [x, y, c] of [[left + 50, g + 12, "#d9822b"], [left + 90, g + 20, "#b5651d"], [right - 70, g + 14, "#e8a45a"], [left + 30, g + 22, "#b5651d"]] as const) {
        b.add(c, x, y, 4, 2).add(c, x + 1, y - 1, 2, 1);
      }
      break;
    }
    case "reef": {
      // Everything is underwater: a blue wash with slanting light, coral, seaweed and a clam.
      art += `<rect class="pf-amb-water" x="${left}" y="${area.y}" width="${area.w}" height="${g - area.y}" fill="#1c7fc4"/>`;
      art += `<g class="pf-amb-rays" fill="#ffffff">${[20, 70, 130].map((x) => `<path d="M${left + x} ${area.y}h14l-40 ${g - area.y}h-14z"/>`).join("")}</g>`;
      art += px(CORAL, { c: "#ff7f9e" }, left + 4, g - 24, 3);
      art += px(CORAL, { c: "#ffb35c" }, left + 22, g - 16, 2);
      art += px(CLAM, { p: "#f7c6d9", P: "#e39bb6", o: "#8a4a64" }, right - 44, g + 8, 2);
      break;
    }
    case "garden": {
      art += px(BIG_LEAF, { g: "#5cb85c", G: "#8fd18f", s: "#3f8f4f", o: "#2c6b3a" }, left + 2, g - 36, 4);
      art += px(TULIP, { r: "#ff6b6b", g: "#3f8f4f" }, right - 36, g - 22, 3);
      art += px(TULIP, { r: "#ffd43b", g: "#3f8f4f" }, right - 20, g - 18, 3);
      b.add("#9fd0ec", left + 60, g + 12, 30, 5).add("#9fd0ec", left + 64, g + 11, 22, 1).add("#d0ebff", left + 66, g + 13, 8, 1);
      break;
    }
    case "pinewood": {
      const pine = { g: "#2f6b3a", G: "#4f9a55", b: "#6b4226", o: "#173a20" };
      art += px(PINE, pine, left - 4, g - 36, 3) + px(PINE, pine, left + 18, g - 26, 2) + px(PINE, pine, right - 26, g - 36, 3);
      art += px(STUMP, { w: "#e9c89a", b: "#8a5a33", B: "#6b4226", o: "#3b2616" }, right - 52, g - 10, 2);
      break;
    }
    case "deepsea": {
      // Deep water: dark, with glowing plankton and a few rocks on the sea floor.
      art += `<rect class="pf-amb-deep" x="${left}" y="${area.y}" width="${area.w}" height="${g - area.y}" fill="#0a3a82"/>`;
      for (const [x, y] of [[20, 30], [60, 18], [150, 40], [180, 22], [110, 60], [36, 76], [170, 84], [90, 34]] as const) {
        art += `<rect class="pf-twinkle" style="animation-delay:-${(x % 7) / 3}s" x="${left + x}" y="${area.y + y}" width="2" height="2" fill="#8ff0ff"/>`;
      }
      b.add("#3b4a5c", left + 6, g - 8, 22, 10).add("#4f6275", left + 10, g - 12, 12, 4).add("#3b4a5c", right - 30, g - 6, 18, 8);
      break;
    }
    case "river": {
      // A river running across the front, stones on its bank and reeds.
      b.add("#4ea8de", left, g + 8, area.w, 14).add("#7cc4f2", left, g + 8, area.w, 2);
      for (const [x, y] of [[8, 5], [34, 4], [150, 5], [184, 3]] as const) b.add("#8a9099", left + x, g + y, 10, 5).add("#b0b6bf", left + x + 2, g + y, 5, 2);
      for (const x of [right - 14, right - 10, right - 6]) b.add("#3f8f4f", x, g - 18, 2, 22).add("#8a5a33", x, g - 22, 2, 5);
      break;
    }
    case "treetop": {
      art += px(TREE, { g: "#4f9a55", G: "#7fc27a", b: "#7a4a24", o: "#24502b" }, left - 14, g - 46, 3);
      art += px(BIRDHOUSE, { r: "#c92a2a", w: "#e9c89a", k: "#3b2616", b: "#8a5a33", o: "#3b2616" }, right - 28, g - 42, 3);
      break;
    }
  }
  return `${b}${art}`;
}

// ── Life ─────────────────────────────────────────────────────────────────────

const LADYBUG: Grid = outlined(["rkr", "rrr"]);
const FISH: Grid = outlined(["y..yy.", "yyyyky", "y..yy."]);
const MOUSE: Grid = outlined(["m.m.", "mmmm", "mkmm", "mmmn"]);
const FEATHER: Grid = [".f", "ff", "f.", "f."];

export function homeAmbient(home: Home, area: Area): { svg: string; css: string } {
  const g = area.ground;
  const left = area.x;
  const right = area.x + area.w;
  switch (home) {
    case "onsen": {
      // Steam curling up from the spring, and a yuzu bobbing in it.
      const steam = [0, 1.2, 2.4].map((d, i) => `<g class="pf-amb-steam" style="animation-delay:-${d}s">${px(["x.", ".x", "x.", ".x", "x."], { x: "#d6e2ee" }, right - 50 + i * 16, g - 8, 3)}</g>`).join("");
      const yuzu = `<g class="pf-amb-bob2">${px(YUZU, { y: "#fcc419", Y: "#ffe066", l: "#51cf66", o: "#8a6a00" }, right - 30, g + 6, 2)}</g>`;
      return {
        svg: steam + yuzu,
        css: `.pf-amb-steam{opacity:0;animation:pf-amb-steam 3.6s ease-out infinite}@keyframes pf-amb-steam{0%{transform:translate(0,0);opacity:0}25%{opacity:.7}100%{transform:translate(4px,-30px);opacity:0}}
.pf-amb-bob2{animation:pf-amb-bob2 2.4s ease-in-out infinite}@keyframes pf-amb-bob2{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px) rotate(8deg)}}`,
      };
    }
    case "forest":
      // A ladybug trundling along the log.
      return {
        svg: `<g class="pf-amb-crawl">${px(LADYBUG, { r: "#e03131", k: "#1a1a1a", o: "#1a1a1a" }, left + 6, g - 13, 2)}</g>`,
        css: `.pf-amb-crawl{animation:pf-amb-crawl 12s ease-in-out infinite alternate}@keyframes pf-amb-crawl{0%,10%{transform:translateX(0)}90%,100%{transform:translateX(26px)}}`,
      };
    case "reef": {
      const bubbles = [0, 1.1, 2.3, 3.2]
        .map((d, i) => `<rect class="pf-amb-rise" style="animation-delay:-${d}s" x="${[left + 30, right - 30, left + 60, right - 60][i]}" y="${g}" width="3" height="3" rx="1.5" fill="none" stroke="#d0ebff" stroke-width="1"/>`)
        .join("");
      const fish = `<g class="pf-amb-swim">${px(FISH, { y: "#ffd43b", k: "#1a1a1a", o: "#8a6a00" }, 0, area.y + 38, 2)}</g>`;
      const weed = [0, 0.8]
        .map((d, i) => `<g class="pf-amb-sway" style="animation-delay:-${d}s">${px(["g", "gg", ".g", "gg", "g.", "gg", ".g", "g", "g"], { g: "#2f9e44" }, right - 22 + i * 8, g - 26 + i * 6, 3)}</g>`)
        .join("");
      return {
        svg: weed + bubbles + fish,
        css: `.pf-amb-water{opacity:calc(.28 + var(--pf-stars) * .12)}.pf-amb-rays{opacity:calc(.1 - var(--pf-stars) * .08)}
.pf-amb-rise{animation:pf-amb-rise 4.4s linear infinite}@keyframes pf-amb-rise{0%{transform:translate(0,0);opacity:0}10%{opacity:1}100%{transform:translate(4px,-110px);opacity:0}}
.pf-amb-swim{animation:pf-amb-swim 14s linear infinite}@keyframes pf-amb-swim{0%{transform:translate(${left - 20}px,0)}50%{transform:translate(${left + area.w / 2}px,-6px)}100%{transform:translate(${right + 10}px,2px)}}
.pf-amb-sway{transform-box:fill-box;transform-origin:50% 100%;animation:pf-amb-sway 3s ease-in-out infinite alternate}@keyframes pf-amb-sway{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}`,
      };
    }
    case "garden":
      // A drop of rain gathers on the big leaf and falls.
      return {
        svg: `<rect class="pf-amb-drip" x="${left + 10}" y="${g - 18}" width="3" height="4" rx="1.5" fill="#7cc4f2"/>`,
        css: `.pf-amb-drip{animation:pf-amb-drip 3.2s ease-in infinite}@keyframes pf-amb-drip{0%,55%{transform:translateY(0);opacity:1}80%{transform:translateY(18px);opacity:1}81%,100%{transform:translateY(18px);opacity:0}}`,
      };
    case "pinewood": {
      // A field mouse peeks out of its hole, the fox's favourite game.
      const hx = right - 70;
      return {
        svg: `<clipPath id="pf-amb-burrow"><rect x="${hx - 2}" y="${g}" width="16" height="12"/></clipPath><rect x="${hx}" y="${g + 10}" width="12" height="3" rx="1" fill="#3b2616"/><g clip-path="url(#pf-amb-burrow)"><g class="pf-amb-peek">${px(MOUSE, { m: "#b8a898", k: "#1a1a1a", n: "#ff8fa3", o: "#5b4636" }, hx + 1, g + 10, 2)}</g></g>`,
        css: `.pf-amb-peek{animation:pf-amb-peek 8s ease-in-out infinite}@keyframes pf-amb-peek{0%,50%,100%{transform:none}58%,78%{transform:translateY(-9px)}}`,
      };
    }
    case "deepsea": {
      // A jellyfish pulsing through the dark.
      const jelly = outlined([".jjj.", "jJjjj", "jjjjj", "j.j.j", "j.j.j"]);
      return {
        svg: `<g class="pf-amb-jelly">${px(jelly, { j: "#f3a6ff", J: "#ffffff", o: "#9b4fb3" }, right - 46, area.y + 40, 2)}</g>`,
        css: `.pf-amb-deep{opacity:calc(.62 + var(--pf-stars) * .13)}
.pf-amb-jelly{animation:pf-amb-jelly 5s ease-in-out infinite}@keyframes pf-amb-jelly{0%,100%{transform:translate(0,0) scale(1,1)}25%{transform:translate(-4px,-10px) scale(1.1,.85)}50%{transform:translate(-6px,-18px) scale(.95,1.08)}75%{transform:translate(-2px,-8px)}}`,
      };
    }
    case "river": {
      // Ripples drift downstream, and so does a leaf.
      const ripples = [0, 1, 2].map((i) => `<rect class="pf-amb-flow" style="animation-delay:-${i * 1.7}s" x="${left}" y="${g + 13 + (i % 2) * 4}" width="10" height="1" fill="#d0ebff"/>`).join("");
      const leaf = `<g class="pf-amb-flow" style="animation-duration:9s;animation-delay:-3s">${px(["..gg", ".ggg", "ggg.", "g..."], { g: "#51cf66" }, left, g + 9, 2)}</g>`;
      return {
        svg: ripples + leaf,
        css: `.pf-amb-flow{animation:pf-amb-flow 5s linear infinite}@keyframes pf-amb-flow{from{transform:translateX(-12px)}to{transform:translateX(${area.w}px)}}`,
      };
    }
    case "treetop":
      // A feather drifts down from the branches.
      return {
        svg: `<g class="pf-amb-feather">${px(FEATHER, { f: "#ffffff" }, left + 24, area.y + 30, 2)}</g>`,
        css: `.pf-amb-feather{animation:pf-amb-feather 9s ease-in-out infinite}@keyframes pf-amb-feather{0%{transform:translate(0,0);opacity:0}10%{opacity:1}30%{transform:translate(12px,26px)}55%{transform:translate(-2px,54px)}80%{transform:translate(10px,82px);opacity:1}95%,100%{transform:translate(4px,96px);opacity:0}}`,
      };
  }
}
