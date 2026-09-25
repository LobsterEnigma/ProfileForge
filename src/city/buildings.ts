import { neonize } from "../color.js";
import type { Rng } from "../random.js";
import { RectBatch } from "../svg/batch.js";
import { escapeXml } from "../svg/escape.js";
import type { LanguageShare } from "../types.js";
import { BASE_Y, BUILDING_W, FLOOR_H, U } from "./layout.js";
import { SNOW, type SeasonLook } from "../world/seasons.js";

export type BuildingStyle = "house" | "classic" | "brick" | "glass" | "setback" | "spire";

/** Everything a building draws into, layered back to front. */
export interface Canvas {
  walls: RectBatch;
  windows: RectBatch;
  nature: RectBatch;
  /** Drawn over walls: snow caps. */
  front: RectBatch;
  extras: string[];
}

export const newCanvas = (): Canvas => ({
  walls: new RectBatch(),
  windows: new RectBatch(),
  nature: new RectBatch(),
  front: new RectBatch(),
  extras: [],
});

export const renderCanvas = (c: Canvas) => `${c.walls}${c.windows}${c.nature}${c.front}${c.extras.join("")}`;

const ON = "var(--pf-window-on)";
const ALT = "var(--pf-window-alt)";
const OFF = "var(--pf-window-off)";
const TRUNK = "#6b4b2a";
const CRANE = "#f5a623";
export const BEACON = "#ff4d4d";
const ROOFS = ["#7a3b2e", "#4f3f63", "#35536b"];

export function pickStyle(floors: number, rng: Rng): BuildingStyle {
  const r = rng();
  if (floors >= 12) return r < 0.25 ? "setback" : r < 0.4 ? "glass" : r < 0.52 ? "spire" : "classic";
  if (floors <= 6) return r < 0.4 ? "brick" : r < 0.48 ? "glass" : "classic";
  return r < 0.15 ? "glass" : r < 0.35 ? "brick" : "classic";
}

function addWindow(c: Canvas, rng: Rng, lit: number, alt: number, x: number, y: number, w: number, h: number): void {
  if (rng() >= lit) {
    c.windows.add(OFF, x, y, w, h);
    return;
  }
  const color = rng() < alt ? ALT : ON;
  if (rng() < 0.04) {
    c.extras.push(
      `<rect class="pf-flicker" style="animation-delay:-${(rng() * 7).toFixed(2)}s;fill:${color}" x="${x}" y="${y}" width="${w}" height="${h}"/>`,
    );
  } else {
    c.windows.add(color, x, y, w, h);
  }
}

export interface BuildingSpec {
  x: number;
  floors: number;
  fill: string;
  style: BuildingStyle;
  /** Share of windows lit, 0..1. */
  lit: number;
  snow: boolean;
  /** Rooftop clutter (antennas, water towers). Off for the landmark and the construction site. */
  roofDetails: boolean;
}

/** Draws one building and returns the y of its roof. */
export function drawBuilding(c: Canvas, rng: Rng, b: BuildingSpec): number {
  const { x, floors, fill, style, lit } = b;
  const top = BASE_Y - floors * FLOOR_H - U;
  const floorY = (f: number) => BASE_Y - (f + 1) * FLOOR_H;

  if (style === "house") return drawHouse(c, rng, b);

  if (style === "setback") {
    // Art-deco: a wide base and a narrower tower on top.
    const base = Math.max(2, Math.round(floors * 0.6));
    const ledge = BASE_Y - base * FLOOR_H;
    c.walls.add(fill, x, ledge, BUILDING_W, BASE_Y - ledge).add(fill, x + 3, top, 8, ledge - top);
    for (let f = 0; f < floors; f++) {
      if (f < base) {
        addWindow(c, rng, lit, 0.12, x + U, floorY(f) + U, 2 * U, 2 * U);
        addWindow(c, rng, lit, 0.12, x + 4 * U, floorY(f) + U, 2 * U, 2 * U);
      } else {
        addWindow(c, rng, lit, 0.12, x + 5, floorY(f) + U, 2 * U, 2 * U);
      }
    }
    if (b.snow) c.front.add(SNOW, x, ledge - 2, 3, 2).add(SNOW, x + 11, ledge - 2, 3, 2).add(SNOW, x + 3, top - 2, 8, 2);
    return top;
  }

  c.walls.add(fill, x, top, BUILDING_W, BASE_Y - top);
  for (let f = 0; f < floors; f++) {
    const y = floorY(f);
    if (style === "brick") {
      // Small, closely spaced windows.
      for (const wx of [x + 2, x + 6, x + 10]) addWindow(c, rng, lit, 0.08, wx, y + U, U, 2 * U);
    } else if (style === "glass") {
      // Floor-to-ceiling glass: windows stack into continuous bands.
      addWindow(c, rng, lit, 0.25, x + U, y, 2 * U, FLOOR_H);
      addWindow(c, rng, lit, 0.25, x + 4 * U, y, 2 * U, FLOOR_H);
    } else {
      addWindow(c, rng, lit, 0.12, x + U, y + U, 2 * U, 2 * U);
      addWindow(c, rng, lit, 0.12, x + 4 * U, y + U, 2 * U, 2 * U);
    }
  }

  if (style === "spire") {
    c.walls.add(fill, x + 2, top - 2, 10, 2).add(fill, x + 4, top - 4, 6, 2).add(fill, x + 6, top - 12, 2, 8);
    if (b.snow) c.front.add(SNOW, x, top - 2, 2, 2).add(SNOW, x + 12, top - 2, 2, 2).add(SNOW, x + 4, top - 6, 6, 2);
    return top;
  }

  if (b.roofDetails && floors >= 3) {
    const roof = rng();
    if (style === "brick" && roof < 0.5) c.walls.add(fill, x + 10, top - 6, 2, 6); // chimney
    else if (roof < 0.22) c.walls.add(fill, x + 10, top - 8, 2, 8); // antenna
    else if (roof < 0.38) c.walls.add(fill, x + 4, top - 7, 6, 4).add(fill, x + 5, top - 3, 1, 3).add(fill, x + 8, top - 3, 1, 3); // water tower
    else if (roof < 0.5) c.walls.add(fill, x + 2, top - 4, 4, 4); // AC unit
  }
  if (b.snow) c.front.add(SNOW, x, top - 2, BUILDING_W, 2);
  return top;
}

function drawHouse(c: Canvas, rng: Rng, b: BuildingSpec): number {
  const { x, floors, fill, lit } = b;
  const wallTop = BASE_Y - (floors === 1 ? 8 : 12);
  const roof = ROOFS[Math.floor(rng() * ROOFS.length)]!;
  c.walls.add(fill, x + 1, wallTop, 12, BASE_Y - wallTop);
  // A stepped, pixel-art pitched roof.
  c.walls.add(roof, x, wallTop - 2, 14, 2).add(roof, x + 2, wallTop - 4, 10, 2).add(roof, x + 4, wallTop - 6, 6, 2).add(roof, x + 6, wallTop - 8, 2, 2);
  if (rng() < 0.5) c.walls.add(roof, x + 10, wallTop - 7, 2, 4); // chimney
  c.walls.add(roof, x + 3, BASE_Y - 5, 3, 5); // door
  addWindow(c, rng, lit, 0.1, x + 8, BASE_Y - 6, 3, 3);
  if (floors === 2) {
    addWindow(c, rng, lit, 0.1, x + 3, BASE_Y - 11, 3, 3);
    addWindow(c, rng, lit, 0.1, x + 8, BASE_Y - 11, 3, 3);
  }
  if (b.snow) {
    for (const [sx, sy] of [[6, 8], [4, 6], [8, 6], [2, 4], [10, 4], [0, 2], [12, 2]] as const) {
      c.front.add(SNOW, x + sx, wallTop - sy, 2, 1);
    }
  }
  return wallTop - 8;
}

/** A quiet week becomes a little park, dressed for the season. */
export function drawPark(c: Canvas, rng: Rng, x: number, look: SeasonLook): void {
  const pick = (colors: string[]) => colors[Math.floor(rng() * colors.length)]!;
  c.nature.add(look.grass, x, BASE_Y - 2, BUILDING_W, 2);
  const kind = rng();
  if (kind < 0.4) {
    const canopy = pick(look.canopy);
    c.nature.add(TRUNK, x + 6, BASE_Y - 8, 2, 6);
    c.nature.add(canopy, x + 3, BASE_Y - 16, 8, 8).add(canopy, x + 4, BASE_Y - 18, 6, 2);
  } else if (kind < 0.65) {
    c.nature.add(TRUNK, x + 6, BASE_Y - 6, 2, 4);
    c.nature.add(look.pine, x + 3, BASE_Y - 12, 8, 6).add(look.pine, x + 4, BASE_Y - 17, 6, 5);
    c.nature.add(look.pineTip, x + 6, BASE_Y - 21, 2, 4);
    if (look.snow) c.nature.add(SNOW, x + 4, BASE_Y - 17, 6, 1).add(SNOW, x + 3, BASE_Y - 12, 8, 1);
  } else if (kind < 0.85) {
    c.nature.add(pick(look.bush), x + 1, BASE_Y - 6, 5, 4).add(pick(look.bush), x + 8, BASE_Y - 5, 4, 3);
  } else if (look.snow) {
    // A snowman instead of a flower bed.
    c.nature.add(SNOW, x + 4, BASE_Y - 8, 6, 6).add(SNOW, x + 5, BASE_Y - 12, 4, 4).add("#f4a261", x + 9, BASE_Y - 11, 2, 1);
  } else {
    c.nature.add(pick(look.bush), x + 1, BASE_Y - 4, 12, 2);
    for (const [fx, color] of [[2, "#ff8fa3"], [6, "#ffd166"], [10, "#c3a6ff"]] as const) {
      c.nature.add(color, x + fx, BASE_Y - 6, 2, 2);
    }
  }
}

const SHORT_NAMES: Record<string, string> = {
  "Jupyter Notebook": "JUPYTER",
  "Vim Script": "VIM",
  "Emacs Lisp": "ELISP",
  "Objective-C": "OBJ-C",
  PowerShell: "PWSH",
  JavaScript: "JS",
  TypeScript: "TS",
};

export function signLabel(language: string): string {
  return (SHORT_NAMES[language] ?? language).toUpperCase().slice(0, 10);
}

const SIGN_H = 11;

/** A neon sign in your top language's color, centered on `cx`. */
function neonSign(c: Canvas, cx: number, boardTop: number, language: LanguageShare): void {
  const label = signLabel(language.name);
  const color = neonize(language.color);
  const w = Math.round(label.length * 5.4 + 10);
  const left = Math.round(cx - w / 2);
  c.extras.push(
    `<g class="pf-neon" filter="url(#pf-glow)">`,
    `<rect x="${left}" y="${boardTop}" width="${w}" height="${SIGN_H}" rx="2" fill="#0b0b12" fill-opacity=".92" stroke="${color}" stroke-width="1.2"/>`,
    `<text x="${cx}" y="${boardTop + 8}" text-anchor="middle" class="pf-sign" fill="${color}">${escapeXml(label)}</text>`,
    `</g>`,
  );
}

/** The best week's tower: your top language in neon on the roof, and a blinking antenna. */
export function drawLandmark(c: Canvas, x: number, top: number, language: LanguageShare | null): void {
  const cx = x + BUILDING_W / 2;
  let antennaBase = top;

  if (language) {
    const boardTop = top - 17;
    const w = Math.round(signLabel(language.name).length * 5.4 + 10);
    const left = Math.round(cx - w / 2);
    for (const legX of [left + 3, left + w - 5]) {
      c.extras.push(`<rect x="${legX}" y="${boardTop + SIGN_H}" width="2" height="${top - boardTop - SIGN_H}" style="fill:var(--pf-bldg3)"/>`);
    }
    neonSign(c, cx, boardTop, language);
    antennaBase = boardTop;
  }

  c.extras.push(
    `<rect x="${cx - 1}" y="${antennaBase - 14}" width="2" height="14" style="fill:var(--pf-window-off)"/>`,
    `<rect class="pf-beacon" x="${cx - 2}" y="${antennaBase - 18}" width="4" height="4" fill="${BEACON}"/>`,
  );
}

/**
 * This week is still under construction. If it's also your best week ever, the crane
 * is busy lifting your neon sign into place.
 */
export function drawCrane(c: Canvas, x: number, base: number, sign: LanguageShare | null = null): void {
  const mastTop = base - 34;
  const hookX = x - 13;
  const crane = new RectBatch()
    .add(CRANE, x + 9, mastTop, 2, base - mastTop)
    .add(CRANE, x - 16, mastTop, 34, 2)
    .add(CRANE, x + 13, mastTop + 2, 5, 3)
    .add(CRANE, hookX, mastTop + 2, 1, sign ? 8 : 14)
    .add(CRANE, hookX - 2, mastTop + (sign ? 10 : 16), 5, 3);
  c.extras.push(crane.toString(), `<rect class="pf-beacon" x="${x + 8}" y="${mastTop - 4}" width="4" height="4" fill="${BEACON}"/>`);
  if (sign) neonSign(c, hookX + 0.5, mastTop + 14, sign);
}
