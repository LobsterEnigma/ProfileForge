/**
 * The postcard photo kit: skies, water, ground, hills, mountains and clouds in one shared
 * style, so every destination looks like it came from the same camera. Everything is drawn in
 * photo pixels from the photo's top-left corner (x, y); landmarks are pixel grids at scale 2,
 * the same pixel size as the pet in the picture.
 */
import { RectBatch } from "../../../svg/batch.js";
import { renderPixels, type Grid, type Palette } from "../../../svg/pixel.js";
import { PH, PW } from "./types.js";

export type Sky = "day" | "tropical" | "sunset" | "dusk" | "night" | "desert" | "snow" | "mist";

/** Four bands from the top down: pixel-art skies rather than smooth gradients. */
const SKIES: Record<Sky, [string, string, string, string]> = {
  day: ["#79c2f2", "#9ad2f7", "#bde3fa", "#dcf1fc"],
  tropical: ["#39b5f0", "#6cc9f5", "#a2dcf8", "#d4f0fc"],
  sunset: ["#f47c6a", "#fb9b72", "#ffc182", "#ffe2a8"],
  dusk: ["#3f3a86", "#6d58a8", "#b877ab", "#f0a79c"],
  night: ["#0e1440", "#172058", "#212d6e", "#2d3a80"],
  desert: ["#86c7ee", "#aad7f0", "#f0dbb0", "#f7e8c8"],
  snow: ["#9fc8e6", "#bddbee", "#d9ebf5", "#eef6fb"],
  mist: ["#b9cbd6", "#cad8e0", "#dae4ea", "#e9eff2"],
};

const STARS: [number, number][] = [[6, 4], [18, 12], [30, 3], [44, 9], [58, 5], [70, 14], [82, 6], [90, 18], [12, 22], [52, 20]];

export const px = (grid: Grid, palette: Palette, x: number, y: number, scale = 2) => renderPixels([{ x: 0, y: 0, grid }], palette, { x, y, scale });

/** The sky, filling the photo (anything drawn after covers it). */
export function sky(x: number, y: number, kind: Sky): string {
  const bands = SKIES[kind];
  const b = new RectBatch();
  const h = PH / bands.length;
  bands.forEach((c, i) => b.add(c, x, y + i * h, PW, h + 0.5));
  if (kind === "night" || kind === "dusk") {
    for (const [sx, sy] of kind === "night" ? STARS : STARS.slice(0, 5)) b.add("#fff8d6", x + sx, y + sy, 1, 1);
  }
  return b.toString();
}

export const sun = (x: number, y: number, r = 6, color = "#ffe066") => `<circle cx="${x}" cy="${y}" r="${r + 3}" fill="${color}" opacity=".3"/><circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;

/** A crescent moon: a pale disc with a disc of `sky` bitten out. */
export const moon = (x: number, y: number, skyColor = "#172058") => `<circle cx="${x}" cy="${y}" r="6" fill="#fff1b8"/><circle cx="${x + 3}" cy="${y - 2}" r="5" fill="${skyColor}"/>`;

/** A puffy pixel cloud, `w` wide. */
export function cloud(x: number, y: number, w = 18, color = "#ffffff"): string {
  return new RectBatch()
    .add(color, x, y + 3, w, 4)
    .add(color, x + w * 0.2, y, w * 0.45, 3)
    .add(color, x + w * 0.55, y + 1, w * 0.3, 2)
    .toString();
}

/** A flat band from `top` down to the bottom of the photo, with a lighter edge. */
export function ground(x: number, y: number, top: number, color: string, edge?: string): string {
  const b = new RectBatch().add(color, x, y + top, PW, PH - top);
  if (edge) b.add(edge, x, y + top, PW, 2);
  return b.toString();
}

/** Water from `top` down, with a few glinting ripples. */
export function water(x: number, y: number, top: number, color = "#3a86c8", glint = "#9fd4ff"): string {
  const b = new RectBatch().add(color, x, y + top, PW, PH - top);
  for (const [gx, gy, gw] of [[6, 4, 10], [34, 9, 8], [60, 3, 12], [80, 11, 9], [20, 14, 7]] as const) {
    if (top + gy < PH) b.add(glint, x + gx, y + top + gy, gw, 1);
  }
  return b.toString();
}

/** A rounded hill centred at `cx`, rising `h` above `base`, `w` wide (pixel steps). */
export function hill(x: number, y: number, cx: number, base: number, w: number, h: number, color: string): string {
  const b = new RectBatch();
  for (let i = 0; i < h; i += 2) {
    const t = i / h;
    const half = (w / 2) * Math.sqrt(1 - t * t);
    b.add(color, x + Math.round(cx - half), y + base - i - 2, Math.round(half * 2), 2);
  }
  return b.toString();
}

/** A pointed mountain, optionally snow-capped for the top `cap` pixels. */
export function mountain(x: number, y: number, cx: number, base: number, w: number, h: number, color: string, cap = 0, snow = "#f8fbff"): string {
  const b = new RectBatch();
  for (let i = 0; i < h; i += 2) {
    const half = (w / 2) * (1 - i / h);
    b.add(h - i <= cap ? snow : color, x + Math.round(cx - half), y + base - i - 2, Math.max(2, Math.round(half * 2)), 2);
  }
  return b.toString();
}

/** A row of simple buildings along `base`: [left, width, height, colour] each, with lit windows. */
export function skyline(x: number, y: number, base: number, blocks: [number, number, number, string][], lit = "#ffd166"): string {
  const b = new RectBatch();
  for (const [bx, bw, bh, c] of blocks) {
    b.add(c, x + bx, y + base - bh, bw, bh);
    for (let wy = base - bh + 3; wy < base - 2; wy += 4) for (let wx = bx + 2; wx < bx + bw - 1; wx += 3) if ((wx * 7 + wy * 3) % 5 < 3) b.add(lit, x + wx, y + wy, 1, 1);
  }
  return b.toString();
}
