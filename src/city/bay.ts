/**
 * Life on the bay: a ferry with two decks of cabin windows (lit at night) and a white wake, a
 * sailboat rocking under full sail by day; and in winter, a frozen bay instead: ice with cracks
 * and snowdrifts, a polar bear and her cub padding across, and a seal popping up at a fishing hole.
 */
import { renderPixels, type Grid, type Palette } from "../svg/pixel.js";
import { W } from "./layout.js";

const px = (grid: Grid, palette: Palette, x = 0, y = 0, scale = 2) => renderPixels([{ x: 0, y: 0, grid }], palette, { x, y, scale });

/** Keeps only the pixels of `ch`, for layers drawn apart (lit windows, sails). */
const only = (grid: Grid, ch: string): Grid => grid.map((row) => row.replace(new RegExp(`[^${ch}]`, "g"), "."));

export const BAY_CSS = `
.pf-ferry{animation:pf-ferry 80s linear infinite}
@keyframes pf-ferry{0%{transform:translateX(-70px)}100%{transform:translateX(${W + 70}px)}}
.pf-sloop{animation:pf-sloop 110s linear infinite}
@keyframes pf-sloop{0%{transform:translateX(${W + 40}px)}100%{transform:translateX(-50px)}}
.pf-rock{transform-box:fill-box;transform-origin:50% 100%;animation:pf-rock 3.2s ease-in-out infinite}
@keyframes pf-rock{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg) translateY(1px)}}
.pf-heave{animation:pf-heave 2.6s ease-in-out infinite}
@keyframes pf-heave{0%,100%{transform:translateY(0)}50%{transform:translateY(1px)}}
.pf-wake{animation:pf-wake 1.4s steps(2) infinite}
@keyframes pf-wake{0%{opacity:.8}100%{opacity:.35}}
.pf-bear{animation:pf-bear 150s linear infinite}
@keyframes pf-bear{0%{transform:translateX(-60px)}100%{transform:translateX(${W + 40}px)}}
.pf-seal{animation:pf-seal 9s ease-in-out infinite}
@keyframes pf-seal{0%,52%,100%{transform:translateY(9px)}60%,86%{transform:translateY(0)}}
`;

// ── The ferry ────────────────────────────────────────────────────────────────

/** A little harbour ferry, facing right: funnel, bridge, two decks, navy hull, red waterline. */
const FERRY: Grid = [
  "...............k..........",
  "...cc..........kff........",
  "...bb..........k..........",
  "...cc....wwwwwwwwwww......",
  "...cc....wlwlwlwlwwgg.....",
  "..kkkkkkkkkkkkkkkkkkkkk...",
  "..wwwwwwwwwwwwwwwwwwwwww..",
  "..wlwwlwwlwwlwwlwwlwwlww..",
  "nnnnnnnnnnnnnnnnnnnnnnnnnN",
  ".nnnnnnnnnnnnnnnnnnnnnnnn.",
  "..rrrrrrrrrrrrrrrrrrrrrr..",
];
const FERRY_COLORS: Palette = {
  k: "#2b2d42",
  c: "#f4a261",
  b: "#2b2d42",
  f: "#e63946",
  w: "#f8f9fa",
  l: "#8ecae6",
  g: "#5c7ea6",
  n: "#1d3557",
  N: "#274b7a",
  r: "#e63946",
};

export function ferry(y: number): string {
  const art =
    px(FERRY, FERRY_COLORS) +
    // At night the cabins glow and the masthead light shines.
    `<g class="pf-night">${px(only(FERRY, "l"), { l: "var(--pf-window-on)" })}<rect x="30" y="-2" width="2" height="2" fill="#fffbe6"/><rect x="50" y="16" width="2" height="2" fill="#7dff9b"/></g>`;
  // A wake of foam trailing behind, and the boat's own faint reflection.
  const wake = `<g class="pf-wake"><rect x="-18" y="21" width="16" height="1" fill="#ffffff" opacity=".7"/><rect x="-30" y="22" width="12" height="1" fill="#ffffff" opacity=".4"/><rect x="-10" y="20" width="10" height="1" fill="#ffffff"/></g>`;
  return (
    `<g class="pf-ferry" style="animation-delay:-26s"><g transform="translate(0 ${y})">${wake}` +
    `<g class="pf-heave"><g id="pf-ferry-art">${art}</g></g>` +
    `<use href="#pf-ferry-art" transform="matrix(1 0 0 -1 0 44)" opacity=".18"/></g></g>`
  );
}

// ── The sailboat ─────────────────────────────────────────────────────────────

/** A sloop heading left: a jib in front, a mainsail shaded towards the leech, a pennant up top. */
const SLOOP: Grid = [
  ".......kf.....",
  ".......kff....",
  "......sks.....",
  "......sksS....",
  ".....ssksSS...",
  ".....ssksSSS..",
  "....sssksSSSS.",
  "....sssksSSSS.",
  "...ssssksSSSSS",
  "..sssssksSSSSS",
  ".......k......",
  ".hhhhhhhhhhhhh",
  "hbbbbbbbbbbbbh",
  ".hhhhhhhhhhhh.",
  "..hhhhhhhhhh..",
];

export function sailboat(y: number): string {
  const art = px(SLOOP, { k: "#5b4636", f: "#e63946", s: "#fdfcf7", S: "#dfe7ef", h: "#f8f9fa", b: "#3a86c8" });
  const wake = `<g class="pf-wake"><rect x="30" y="29" width="12" height="1" fill="#ffffff" opacity=".7"/><rect x="40" y="30" width="10" height="1" fill="#ffffff" opacity=".4"/></g>`;
  return `<g class="pf-day"><g class="pf-sloop" style="animation-delay:-70s"><g transform="translate(0 ${y})">${wake}<g class="pf-rock">${art}</g></g></g></g>`;
}

// ── Winter: the frozen bay ───────────────────────────────────────────────────

/** A polar bear walking right, in two strides. */
const BEAR: Grid = [
  "............oo.",
  "...ooooooooowwo",
  "..owwwwwwwwwwwwo",
  ".owwwwwwwwwwwwkwk",
  ".owwwwwwwwwwwwwo",
  "owwWwwwwwwwwwwo.",
  "oWWWWWWWWWWWWo..",
];
const BEAR_LEGS_A: Grid = [".oWo..oWo..oWo.oWo", ".oo...oo....oo..oo"];
const BEAR_LEGS_B: Grid = ["..oWo.oWo...oWooWo.", "..oo...oo....oo.oo."];
const CUB: Grid = ["......oo", "..ooooowo", ".owwwwwkwk", "owwwwwwwo", "oWWWWWWo."];
const CUB_LEGS_A: Grid = [".oo.oo.oo", "........."];
const CUB_LEGS_B: Grid = ["..oo.oo.oo", ".........."];
const BEAR_COLORS: Palette = { o: "#8a97a8", w: "#fbfcfd", W: "#dde5ee", k: "#1a1a1a" };

function walker(body: Grid, legsA: Grid, legsB: Grid, x: number, y: number, speed: number): string {
  const legY = y + body.length * 2 - 2;
  return (
    px(body, BEAR_COLORS, x, y) +
    `<g class="pf-fa" style="animation-duration:${speed}s">${px(legsA, BEAR_COLORS, x, legY)}</g>` +
    `<g class="pf-fb" style="animation-duration:${speed}s">${px(legsB, BEAR_COLORS, x, legY)}</g>`
  );
}

/**
 * The bay frozen over: pale ice with cracks and drifts over the water (its reflection dimmed to a
 * sheen), a polar bear and her cub padding across, and a seal peeking out of a fishing hole.
 */
export function frozenBay(top: number, height: number): string {
  const ice =
    `<rect x="0" y="${top}" width="${W}" height="${height}" fill="url(#pf-ice)"/>` +
    `<g opacity=".55" fill="none" stroke="#9fb4cc" stroke-width="1">` +
    `<path d="M40 ${top + 12}l18 4l10 -2l16 6M210 ${top + 30}l14 -5l20 3l8 8M420 ${top + 18}l22 4l12 -3M560 ${top + 36}l-14 6l-20 -2M690 ${top + 10}l16 5l14 -1"/></g>` +
    `<g fill="#ffffff" opacity=".7"><ellipse cx="120" cy="${top + 40}" rx="30" ry="3"/><ellipse cx="330" cy="${top + 22}" rx="22" ry="2"/><ellipse cx="610" cy="${top + 44}" rx="36" ry="3"/><ellipse cx="760" cy="${top + 26}" rx="18" ry="2"/></g>`;
  // Night falls over the ice and everything on it, leaving it moonlit rather than dark water.
  // (The class drives the opacity, so the shade's own strength goes on the rect inside.)
  const night = `<g class="pf-night"><rect x="0" y="${top}" width="${W}" height="${height}" fill="#0e1a36" opacity=".4"/></g>`;

  // A fishing hole, and a seal that pops up to look around.
  const hx = 505;
  const hy = top + 30;
  const seal =
    `<ellipse cx="${hx}" cy="${hy}" rx="9" ry="3" fill="#2b3a55"/>` +
    `<clipPath id="pf-hole"><rect x="${hx - 10}" y="${hy - 14}" width="20" height="14"/></clipPath>` +
    `<g clip-path="url(#pf-hole)"><g class="pf-seal">${px(["..ooo..", ".ossso.", "oskssko", "osssnso", ".ossso."], { o: "#4a5568", s: "#8d99ae", k: "#111111", n: "#2b2d42" }, hx - 7, hy - 10)}</g></g>`;

  const bears =
    `<g class="pf-bear" style="animation-delay:-40s"><g transform="translate(0 ${top + 10})">` +
    walker(BEAR, BEAR_LEGS_A, BEAR_LEGS_B, 0, 0, 1.4) +
    walker(CUB, CUB_LEGS_A, CUB_LEGS_B, -26, 6, 1) +
    `</g></g>`;

  return ice + seal + bears + night;
}
