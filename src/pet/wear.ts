/**
 * What the weather and the season put on the pet: a knitted beanie in winter, an umbrella in
 * the rain, now and then an autumn leaf that lands on its head and blows away, and little
 * puffs of dust when a happy pet lands from a bounce.
 */
import { outlined, renderPixels, type Grid } from "../svg/pixel.js";
import type { Hat } from "./sprite.js";
import type { Species } from "./species/types.js";

/** A striped knit beanie with a pompom, for winter. */
export const BEANIE: Hat = {
  grid: outlined(["...ww...", "...ww...", "..rrrr..", ".rrrrrr.", ".wwwwww.", "rrrrrrrr", "cccccccc"]),
  palette: { w: "#f8f9fa", r: "#e03131", c: "#c92a2a", o: "#5c1414" },
  sink: 2,
};

/** Canopy of a little umbrella, drawn at the pet's own pixel size so it matches the sprite. */
const UMBRELLA: Grid = [
  "......bbbb......",
  "...bbbBbbBbbb...",
  ".bbBbbbbbbbbbBb.",
  "bBbbbbbbbbbbbbBb",
  "bbbbbbbbbbbbbbbb",
  "b..b...b...b...b",
];

export const WEAR_CSS = `
.pf-drip{animation:pf-drip 1.2s linear infinite}
@keyframes pf-drip{0%{transform:translateY(0);opacity:0}20%{opacity:.9}100%{transform:translateY(10px);opacity:0}}
.pf-leaf{opacity:0;animation:pf-leaf 14s ease-in-out infinite}
@keyframes pf-leaf{0%{opacity:0;transform:translate(-18px,-46px) rotate(-60deg)}8%{opacity:1}14%{transform:translate(8px,-30px) rotate(30deg)}20%{transform:translate(-6px,-14px) rotate(-30deg)}26%,62%{opacity:1;transform:translate(0,0) rotate(0)}70%{opacity:1;transform:translate(26px,-18px) rotate(80deg)}76%,100%{opacity:0;transform:translate(52px,-34px) rotate(160deg)}}
.pf-dust{opacity:0;transform-box:fill-box;transform-origin:center;animation:pf-dust .9s ease-out infinite}
@keyframes pf-dust{0%,68%{opacity:0;transform:translate(0,0) scale(.4)}72%{opacity:.8}100%{opacity:0;transform:translate(var(--dx),-3px) scale(1.4)}}
`;

/**
 * An umbrella held over the pet, its shaft beside the head rather than across the face, with
 * raindrops running off the rim. Sprite coordinates at `scale`.
 */
export function umbrella(species: Species, scale: number): string {
  const w = species.width * scale;
  const canopyW = UMBRELLA[0]!.length * scale;
  const cx = Math.min(w - scale, Math.round(w * 0.64));
  const x = cx - canopyW / 2;
  const rimY = (species.crownAnchor.y - 3) * scale;
  const y = rimY - UMBRELLA.length * scale;
  const canopy = renderPixels([{ x: 0, y: 0, grid: UMBRELLA }], { b: "#4c6ef5", B: "#91a7ff" }, { x, y, scale });
  const shaft = `<rect x="${cx - scale / 2}" y="${rimY - scale}" width="${scale}" height="${Math.round(species.height * 0.45 * scale) - rimY}" fill="#5c3d2e"/>`;
  const hook = `<rect x="${cx - scale / 2}" y="${Math.round(species.height * 0.45 * scale)}" width="${2 * scale}" height="${scale}" fill="#5c3d2e"/>`;
  const drips = [0, 0.4, 0.8]
    .map((d, i) => `<rect class="pf-drip" style="animation-delay:-${d}s" x="${x + [0, canopyW - 2, canopyW / 2 + 12][i]!}" y="${rimY}" width="2" height="3" fill="#a5d8ff"/>`)
    .join("");
  return `${shaft}${hook}${canopy}${drips}`;
}

/** A leaf that drifts down, rests on the pet's head for a while, then blows away. */
export function autumnLeaf(species: Species, scale: number, color: string): string {
  const leaf = renderPixels([{ x: 0, y: 0, grid: ["..ll", ".lll", "lll.", "s..."] }], { l: color, s: "#6b4b2a" }, { x: 0, y: 0, scale: 2 });
  const x = species.crownAnchor.x * scale - 4;
  const y = (species.crownAnchor.y - 2) * scale - 6;
  return `<g transform="translate(${x} ${y})"><g class="pf-leaf">${leaf}</g></g>`;
}

/** Two puffs of dust at the feet, timed to the happy bounce's landing. */
export function landingDust(w: number, h: number): string {
  return [
    [w * 0.2, -5],
    [w * 0.8, 5],
  ]
    .map(([x, dx]) => `<rect class="pf-dust" style="--dx:${dx}px" x="${x! - 3}" y="${h - 4}" width="6" height="4" rx="2" fill="#e9dcc3"/>`)
    .join("");
}
