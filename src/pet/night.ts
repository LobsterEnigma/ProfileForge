/**
 * Bedtime. A sleeping pet gets a cosy night whatever the theme: an indigo sky with a crescent
 * moon and stars, a lantern glowing at its side, fireflies, and the pet curled on a cushion under
 * a patchwork quilt, nightcap on. Warm and quiet rather than grey.
 */
import { RectBatch } from "../svg/batch.js";
import { outlined, renderPixels, type Grid } from "../svg/pixel.js";
import type { Hat } from "./sprite.js";
import { ZED } from "./sprites.js";

interface Scene {
  x: number;
  y: number;
  w: number;
  h: number;
  ground: number;
}

const r = (n: number) => Math.round(n * 100) / 100;

export const NIGHTCAP: Hat = {
  grid: [
    "........ww",
    "......bbww",
    ".....bwbb.",
    "....bbbw..",
    "...bwbbb..",
    "..bbbwbb..",
    ".bwbbbbwb.",
    "wwwwwwwwww",
  ],
  palette: { b: "#6c7fd8", w: "#f8f9ff" },
  cx: 5,
  sink: 1,
};

const STARS: [number, number, number, number][] = [
  [22, 14, 0, 2], [48, 36, 0.7, 3], [84, 12, 1.3, 2], [120, 30, 0.4, 3], [150, 16, 1.1, 2], [182, 46, 0.2, 2], [36, 62, 1.5, 2], [104, 52, 0.9, 2], [168, 70, 0.3, 2],
];

/** The night sky, drawn over the day sky. */
export function nightSky(s: Scene): string {
  const stars = STARS.map(([x, y, d, size]) => `<rect class="pf-twinkle" style="animation-delay:-${d}s" x="${s.x + x}" y="${s.y + y}" width="${size}" height="${size}" fill="#fff8d6"/>`).join("");
  const mx = s.x + 36;
  const my = s.y + 34;
  // A crescent: a pale disc with a sky-coloured disc bitten out of it.
  const moon =
    `<circle cx="${mx}" cy="${my}" r="22" fill="#fff3c4" opacity=".08"/><circle cx="${mx}" cy="${my}" r="16" fill="#fff3c4" opacity=".12"/>` +
    `<circle cx="${mx}" cy="${my}" r="11" fill="#fff1b8"/><circle cx="${mx + 5}" cy="${my - 3}" r="10" fill="#242a63"/>`;
  return (
    `<defs><linearGradient id="pf-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1e4d"/><stop offset=".7" stop-color="#2e2a66"/><stop offset="1" stop-color="#4a3a78"/></linearGradient>` +
    `<radialGradient id="pf-glow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>` +
    `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="url(#pf-night)"/>${stars}${moon}`
  );
}

/** Dims the ground and props so the night reads, before the pet is drawn. */
export function nightShade(s: Scene): string {
  return `<rect x="${s.x}" y="${s.ground - 60}" width="${s.w}" height="${s.y + s.h - s.ground + 60}" fill="#141640" opacity=".38"/>`;
}

const LANTERN: Grid = outlined(["..k..", ".kkk.", "kyyyk", "kyYyk", "kyyyk", "kkkkk"]);

/** A paper lantern glowing on the ground, and a few fireflies. */
export function lanternAndFireflies(s: Scene): string {
  const lx = s.x + s.w - 34;
  const ly = s.ground - 16;
  const glow = `<circle class="pf-glow" cx="${lx + 7}" cy="${ly + 8}" r="30" fill="url(#pf-glow)"/>`;
  const lantern = renderPixels([{ x: 0, y: 0, grid: LANTERN }], { k: "#3b2a1a", y: "#ffd27a", Y: "#fff3c4", o: "#1a120a" }, { x: lx, y: ly, scale: 2 });
  const flies = [[30, 70, 0], [90, 40, 1.4], [150, 60, 2.2], [60, 96, 0.8]]
    .map(([x, y, d]) => `<rect class="pf-firefly" style="animation-delay:-${d}s" x="${s.x + x!}" y="${s.y + y!}" width="2" height="2" fill="#fff59d"/>`)
    .join("");
  return glow + lantern + flies;
}

/** A plump round cushion for the pet to sleep on (scene coordinates). */
export function cushion(x: number, ground: number, w: number): string {
  const cw = w + 20;
  const cx = x - 10;
  const b = new RectBatch()
    .add("#3e3576", cx + 4, ground - 8, cw - 8, 14)
    .add("#3e3576", cx, ground - 4, cw, 8)
    .add("#8a7ce0", cx + 5, ground - 7, cw - 10, 11)
    .add("#8a7ce0", cx + 1, ground - 3, cw - 2, 5)
    .add("#b3a8f0", cx + 8, ground - 6, cw - 16, 2);
  return b.toString();
}

/**
 * A patchwork quilt over the lower part of a sprite (sprite coordinates, so it breathes along).
 * It comes up to just under the mouth (`chin`, in sprite pixels), so the sleepy face shows.
 */
export function quilt(w: number, h: number, scale: number, chin: number): string {
  const top = Math.max(Math.round(h * 0.62 / scale), chin) * scale;
  const tile = 2 * scale;
  const left = -scale / 2;
  const right = w + scale / 2;
  const bottom = h + scale / 2;
  const b = new RectBatch();
  // Rounded corners: the top row is inset, like fabric draping over a body.
  b.add("#6b2d3a", left + scale, top - scale / 2, right - left - 2 * scale, scale / 2);
  b.add("#6b2d3a", left, top, right - left, bottom - top);
  let row = 0;
  for (let y = top; y < bottom - scale / 2; y += tile, row++) {
    let col = 0;
    const inset = row === 0 ? scale : scale / 2;
    for (let x = left + inset; x < right - inset; x += tile, col++) {
      const light = (row + col) % 2 === 0;
      b.add(light ? "#f4a3a0" : "#e27d7d", r(x), r(y), r(Math.min(tile, right - inset - x)), r(Math.min(tile, bottom - scale / 2 - y)));
    }
  }
  // A soft cream hem along the top.
  b.add("#fff4e6", left + scale, top, right - left - 2 * scale, Math.max(1, scale / 2));
  return b.toString();
}

/** Big white Zs floating up from a sleeping pet (scene coordinates). */
export function bedtimeZs(box: { x: number; y: number; w: number }): string {
  const zed = outlined(ZED);
  return [
    [0.72, -4, 2, 0],
    [0.72, -12, 2.5, 1.1],
    [0.72, -22, 3, 2.2],
  ]
    .map(
      ([fx, dy, s, d]) =>
        `<g class="pf-snooze" style="animation-delay:-${d}s">${renderPixels([{ x: 0, y: 0, grid: zed }], { z: "#ffffff", o: "#2a2d6b" }, { x: r(box.x + box.w * fx! + (s! - 2) * 6), y: r(box.y + dy!), scale: s! })}</g>`,
    )
    .join("");
}

export const NIGHT_CSS = `
.pf-glow{animation:pf-glow 2.8s ease-in-out infinite}
@keyframes pf-glow{0%,100%{opacity:.85}45%{opacity:1}55%{opacity:.7}}
.pf-firefly{animation:pf-firefly 4s ease-in-out infinite}
@keyframes pf-firefly{0%,100%{opacity:.2;transform:translate(0,0)}50%{opacity:1;transform:translate(6px,-8px)}}
.pf-snooze{opacity:0;animation:pf-snooze 3.3s ease-out infinite}
@keyframes pf-snooze{0%{opacity:0;transform:translate(0,4px)}20%{opacity:1}100%{opacity:0;transform:translate(10px,-22px)}}
`;
