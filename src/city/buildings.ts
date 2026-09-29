import { neonize } from "../color.js";
import type { Rng } from "../random.js";
import { LineBatch, RectBatch } from "../svg/batch.js";
import { escapeXml } from "../svg/escape.js";
import type { LanguageShare } from "../types.js";
import { BASE_Y, FLOOR_H, U, W } from "./layout.js";
import { SNOW, type SeasonLook } from "../world/seasons.js";

export type BuildingStyle = "house" | "classic" | "brick" | "glass" | "setback" | "spire";

/** Everything a building draws into, layered back to front. */
export interface Canvas {
  walls: RectBatch;
  /** The shadowed side of each building (drawn dark and translucent). */
  shade: RectBatch;
  /** Cornices, ledges and the sunlit edge (drawn light and translucent). */
  light: RectBatch;
  rim: RectBatch;
  /** Tinted glass on curtain-wall towers. */
  glass: RectBatch;
  windows: LineBatch;
  /** Lit windows in three brightnesses (kept apart so they can glow at night). */
  lit: LineBatch;
  dim: LineBatch;
  faint: LineBatch;
  /** Shopfronts glowing along the street at night, and their awnings by day. */
  shops: LineBatch;
  awnings: RectBatch;
  /** The side of each building facing the low sun, warmed at dusk. */
  sunlit: RectBatch;
  /** Fire escapes, railings: dark iron. */
  iron: RectBatch;
  nature: RectBatch;
  /** Drawn over walls: snow caps. */
  front: RectBatch;
  /** Rects that share an animation class, merged into one path per class and colour. */
  classed: Map<string, RectBatch>;
  extras: string[];
}

/** The batch for rects animated with `cls` (e.g. blinking Christmas lights). */
export function classedBatch(c: Canvas, cls: string): RectBatch {
  let batch = c.classed.get(cls);
  if (!batch) c.classed.set(cls, (batch = new RectBatch()));
  return batch;
}

export const newCanvas = (): Canvas => ({
  walls: new RectBatch(),
  shade: new RectBatch(),
  light: new RectBatch(),
  rim: new RectBatch(),
  glass: new RectBatch(),
  windows: new LineBatch(),
  lit: new LineBatch(),
  dim: new LineBatch(),
  faint: new LineBatch(),
  shops: new LineBatch(),
  awnings: new RectBatch(),
  sunlit: new RectBatch(),
  iron: new RectBatch(),
  nature: new RectBatch(),
  front: new RectBatch(),
  classed: new Map(),
  extras: [],
});

/** The whole skyline; lit windows sit in `#pf-lit` so the night can make them glow. */
export const renderCanvas = (c: Canvas) =>
  `<g id="pf-walls">${c.walls}</g><rect x="0" y="0" width="${W}" height="${BASE_Y}" fill="url(#pf-volume)" mask="url(#pf-wallmask)"/><g class="pf-sunlit">${c.sunlit}</g><g opacity=".2">${c.glass}</g><g opacity=".24">${c.shade}</g><g opacity=".13">${c.light}</g><g class="pf-rim">${c.rim}</g>${c.windows}` +
  `<g id="pf-lit">${c.lit}<g opacity=".72">${c.dim}</g><g opacity=".45">${c.faint}</g></g><g class="pf-night"><g opacity=".75">${c.shops}</g></g><g class="pf-day">${c.awnings}</g><g opacity=".85">${c.iron}</g>${c.nature}${c.front}${[...c.classed].map(([cls, b]) => `<g class="${cls}">${b}</g>`).join("")}${c.extras.join("")}`;

const ON = "var(--pf-window-on)";
const ALT = "var(--pf-window-alt)";
const OFF = "var(--pf-window-off)";
const TRUNK = "#6b4b2a";
const CRANE = "#f5a623";
export const BEACON = "#ff4d4d";
const ROOFS = ["#7a3b2e", "#4f3f63", "#35536b"];

export function pickStyle(floors: number, rng: Rng): BuildingStyle {
  const r = rng();
  if (floors >= 11) return r < 0.25 ? "setback" : r < 0.45 ? "glass" : r < 0.58 ? "spire" : "classic";
  if (floors <= 5) return r < 0.4 ? "brick" : r < 0.5 ? "glass" : "classic";
  return r < 0.2 ? "glass" : r < 0.4 ? "brick" : "classic";
}

/** One lit window: mostly warm and bright, some dimmer rooms, now and then a cool office white. */
function light(c: Canvas, rng: Rng, x: number, y: number, w: number, h: number): void {
  const color = rng() < 0.08 ? ALT : ON;
  if (rng() < 0.02) {
    c.extras.push(`<rect class="pf-flicker" style="animation-delay:-${(rng() * 7).toFixed(2)}s;fill:${color}" x="${x}" y="${y}" width="${w}" height="${h}"/>`);
    return;
  }
  const tier = rng();
  (tier < 0.55 ? c.lit : tier < 0.85 ? c.dim : c.faint).add(color, x, y, w, h);
}

/** A single window, lit with probability `lit` (houses and small facades). */
function addWindow(c: Canvas, rng: Rng, lit: number, x: number, y: number, w: number, h: number): void {
  if (rng() < lit) light(c, rng, x, y, w, h);
  else c.windows.add(OFF, x, y, w, h);
}

/** How a facade's windows are cut: width, gap, height and offset within a 6px floor. */
interface Cut {
  ww: number;
  gap: number;
  wh: number;
  dy: number;
  /** A pale sill under each window. */
  sill?: boolean;
}

const CUTS = {
  grid: { ww: 2, gap: 2, wh: 3, dy: 2 },
  pairs: { ww: 3, gap: 2, wh: 3, dy: 2 },
  slit: { ww: 1, gap: 2, wh: 4, dy: 1 },
  ribbon: { ww: 3, gap: 1, wh: 3, dy: 2 },
  curtain: { ww: 2, gap: 0, wh: 4, dy: 1 },
  brick: { ww: 2, gap: 2, wh: 2, dy: 2, sill: true },
} satisfies Record<string, Cut>;

type CutName = keyof typeof CUTS;

/**
 * Windows floor by floor, lit the way real buildings are: some floors dark, some blazing,
 * most with a run of lit rooms, rather than a random scatter.
 */
function facade(c: Canvas, rng: Rng, x: number, w: number, fromFloor: number, toFloor: number, lit: number, cutName: CutName, pilasters = false): void {
  const cut: Cut = CUTS[cutName];
  const step = cut.ww + cut.gap;
  const n = Math.max(1, Math.floor((w - 3 + cut.gap) / step));
  const left = x + Math.floor((w - (n * step - cut.gap)) / 2) + 1;
  // Pilasters: pale piers running up between the window columns.
  if (pilasters && cut.gap >= 2) {
    const y0 = BASE_Y - toFloor * FLOOR_H;
    for (let i = 0; i < n - 1; i++) c.light.add("#fff", left + i * step + cut.ww, y0, 1, (toFloor - fromFloor) * FLOOR_H);
  }
  for (let f = fromFloor; f < toFloor; f++) {
    const y = BASE_Y - (f + 1) * FLOOR_H + cut.dy;
    const r = rng();
    let from = 0;
    let to = -1;
    if (r < lit * 0.45) to = n - 1; // the whole floor is working late
    else if (r < lit * 1.15) {
      from = Math.floor(rng() * n);
      to = Math.min(n - 1, from + Math.floor(rng() * n));
    }
    for (let i = 0; i < n; i++) {
      const wx = left + i * step;
      if (i >= from && i <= to) light(c, rng, wx, y, cut.ww, cut.wh);
      else if (rng() < lit * 0.08) light(c, rng, wx, y, cut.ww, cut.wh); // a lone night owl
      else c.windows.add(OFF, wx, y, cut.ww, cut.wh);
    }
    if (cut.sill) c.light.add("#fff", left - 1, y + cut.wh, n * step - cut.gap + 2, 1);
  }
}

export interface BuildingSpec {
  x: number;
  /** Facade width: busier weeks build wider. */
  w: number;
  floors: number;
  fill: string;
  style: BuildingStyle;
  /** Share of windows lit, 0..1. */
  lit: number;
  snow: boolean;
  /** Rooftop clutter (antennas, water towers). Off for the landmark and the construction site. */
  roofDetails: boolean;
}

/** Shading every block gets: a shadowed left side, a cornice, and the sunlit right edge. */
function shadeBlock(c: Canvas, x: number, top: number, w: number, bottom = BASE_Y): void {
  c.shade.add("#000", x, top, 2, bottom - top);
  c.light.add("#fff", x, top, w, 1);
  c.rim.add("var(--pf-celestial)", x + w - 1, top, 1, bottom - top);
  c.sunlit.add("var(--pf-celestial)", x + w - 4, top, 3, bottom - top);
}

/** Shops along the street: a warm band across the ground floor, lit at night. */
const AWNINGS = ["#e8505b", "#2f9e8f", "#f2a93b", "#6c63d9", "#3a86c8"];

/** Shops along the street: glowing windows at night, a coloured awning by day. */
function shopfront(c: Canvas, rng: Rng, x: number, w: number): void {
  for (let sx = x + 2; sx + 3 <= x + w - 1; sx += 4) c.shops.add(ON, sx, BASE_Y - 4, 3, 3);
  c.awnings.add(AWNINGS[Math.floor(rng() * AWNINGS.length)]!, x + 1, BASE_Y - 6, w - 2, 2);
}

const NEON = ["#ff5c8a", "#4de1ff", "#ffe066", "#8cff66", "#c77dff"];

/** A billboard on the roof: a pale panel by day, glowing neon at night. */
function billboard(c: Canvas, rng: Rng, x: number, w: number, top: number): number {
  const color = NEON[Math.floor(rng() * NEON.length)]!;
  const bw = Math.max(6, w - 4);
  const bx = x + Math.floor((w - bw) / 2);
  c.iron.add("#1b1b26", bx + 1, top - 3, 1, 3).add("#1b1b26", bx + bw - 2, top - 3, 1, 3);
  c.extras.push(
    `<rect x="${bx}" y="${top - 8}" width="${bw}" height="5" fill="#1b1b26"/>`,
    `<g class="pf-neon"><rect x="${bx + 1}" y="${top - 7}" width="${bw - 2}" height="3" fill="${color}" class="pf-night"/><rect x="${bx + 1}" y="${top - 7}" width="${bw - 2}" height="3" fill="#e9e4f0" class="pf-day"/></g>`,
  );
  return top - 8;
}

/** Draws one building and returns the y of its roof. */
export function drawBuilding(c: Canvas, rng: Rng, b: BuildingSpec): number {
  const { x, w, floors, fill, style, lit } = b;
  const top = BASE_Y - floors * FLOOR_H - U;
  const cx = x + Math.floor(w / 2);

  if (style === "house") return drawHouse(c, rng, b);

  if (style === "setback") {
    // Art-deco: a wide base of office floors and a narrower tower on top.
    const base = Math.max(2, Math.round(floors * 0.6));
    const ledge = BASE_Y - base * FLOOR_H;
    const tw = Math.max(6, w - 6);
    const tx = x + Math.floor((w - tw) / 2);
    c.walls.add(fill, x, ledge, w, BASE_Y - ledge).add(fill, tx, top, tw, ledge - top);
    shadeBlock(c, x, ledge, w);
    shadeBlock(c, tx, top, tw, ledge);
    facade(c, rng, x, w, 1, base, lit, "ribbon");
    facade(c, rng, tx, tw, base, floors, lit, "slit");
    shopfront(c, rng, x, w);
    // A stepped crown on top.
    c.walls.add(fill, tx + 2, top - 3, tw - 4, 3);
    if (b.snow) c.front.add(SNOW, x, ledge - 2, tx - x, 2).add(SNOW, tx + tw, ledge - 2, x + w - tx - tw, 2).add(SNOW, tx + 2, top - 5, tw - 4, 2);
    return top - 3;
  }

  c.walls.add(fill, x, top, w, BASE_Y - top);
  shadeBlock(c, x, top, w);

  if (style === "glass") {
    // A curtain wall: tinted glass all over, floor lines, whole bands of offices lit.
    c.glass.add(ALT, x + 2, top + 2, w - 3, BASE_Y - top - 6);
    for (let f = 1; f < floors; f += 1) c.shade.add("#000", x + 2, BASE_Y - f * FLOOR_H, w - 3, 1);
    facade(c, rng, x, w, 1, floors, lit * 0.8, rng() < 0.5 ? "curtain" : "ribbon");
  } else {
    const cut: CutName = style === "brick" ? "brick" : style === "spire" ? "slit" : rng() < 0.5 ? "grid" : "pairs";
    facade(c, rng, x, w, floors > 2 ? 1 : 0, floors, lit, cut, style === "classic");
    // Brick buildings get a ledge every few floors.
    if (style === "brick") for (let f = 3; f < floors; f += 3) c.light.add("#fff", x, BASE_Y - f * FLOOR_H, w, 1);
  }
  if (floors > 2) {
    // A stone base: the ground floor a shade darker, a lit doorway in the middle.
    c.shade.add("#000", x + 2, BASE_Y - FLOOR_H, w - 3, FLOOR_H);
    c.lit.add(ON, cx - 1, BASE_Y - 4, 2, 4);
  }
  if (floors > 2) shopfront(c, rng, x, w);

  if (style === "spire") {
    c.walls.add(fill, x + 2, top - 2, w - 4, 2).add(fill, cx - 3, top - 4, 6, 2).add(fill, cx - 1, top - 12, 2, 8);
    if (b.snow) c.front.add(SNOW, x, top - 2, 2, 2).add(SNOW, x + w - 2, top - 2, 2, 2).add(SNOW, cx - 3, top - 6, 6, 2);
    return top;
  }

  if (style === "glass" && floors >= 8 && rng() < 0.6) {
    // A slanted glass crown, stepping down to the right.
    for (let i = 0; i < w; i += 2) {
      const h = Math.max(0, Math.round((w - i) * 0.5));
      if (h) c.walls.add(fill, x + i, top - h, 2, h);
    }
    c.glass.add(ALT, x + 2, top - Math.round(w * 0.5) + 2, 2, Math.round(w * 0.5) - 2);
    return top - Math.round(w * 0.5);
  }

  if (b.roofDetails && floors >= 3) {
    const roof = rng();
    if (style === "brick" && roof < 0.5) c.walls.add(fill, x + w - 4, top - 6, 2, 6); // chimney
    else if (roof < 0.2) {
      c.walls.add(fill, x + w - 4, top - 8, 2, 8); // antenna, with a red light on tall ones
      if (floors >= 9) c.extras.push(`<rect class="pf-beacon" style="animation-delay:-${(rng() * 1.6).toFixed(2)}s" x="${x + w - 4}" y="${top - 10}" width="2" height="2" fill="${BEACON}"/>`);
    } else if (roof < 0.34) c.walls.add(fill, cx - 3, top - 7, 6, 4).add(fill, cx - 2, top - 3, 1, 3).add(fill, cx + 1, top - 3, 1, 3); // water tower
    else if (roof < 0.46) c.walls.add(fill, x + 2, top - 4, 4, 4); // AC unit
    else if (roof < 0.62) {
      if (floors >= 8) c.walls.add(fill, x + 2, top - 3, w - 4, 3).add(fill, x + 4, top - 5, w - 8, 2); // stepped crown
    } else if (roof < 0.67) return billboard(c, rng, x, w, top);
    else if (roof < 0.8) c.nature.add("#3f8f4f", x + 1, top - 2, w - 2, 2).add("#5cb85c", x + 2, top - 3, 3, 1).add("#5cb85c", x + w - 6, top - 3, 3, 1); // roof garden
  }
  if (b.snow) c.front.add(SNOW, x, top - 2, w, 2);
  return top;
}

function drawHouse(c: Canvas, rng: Rng, b: BuildingSpec): number {
  const { x, w, floors, fill, lit } = b;
  const wallTop = BASE_Y - (floors === 1 ? 8 : 12);
  const roof = ROOFS[Math.floor(rng() * ROOFS.length)]!;
  const cx = x + Math.floor(w / 2);
  c.walls.add(fill, x + 1, wallTop, w - 2, BASE_Y - wallTop);
  shadeBlock(c, x + 1, wallTop, w - 2);
  // A stepped, pixel-art pitched roof.
  const steps = Math.floor(w / 4);
  for (let i = 0; i < steps; i++) c.walls.add(roof, x + i * 2, wallTop - 2 - i * 2, w - i * 4, 2);
  if (rng() < 0.5) c.walls.add(roof, x + w - 4, wallTop - 7, 2, 4); // chimney
  c.walls.add(roof, x + 3, BASE_Y - 5, 3, 5); // door
  addWindow(c, rng, lit, x + w - 6, BASE_Y - 6, 3, 3);
  if (floors === 2) {
    addWindow(c, rng, lit, x + 3, BASE_Y - 11, 3, 3);
    addWindow(c, rng, lit, x + w - 6, BASE_Y - 11, 3, 3);
  }
  if (b.snow) {
    for (let i = 0; i < steps; i++) c.front.add(SNOW, x + i * 2, wallTop - 2 - i * 2, 2, 1).add(SNOW, x + w - i * 2 - 2, wallTop - 2 - i * 2, 2, 1);
    c.front.add(SNOW, cx - 1, wallTop - steps * 2, 2, 1);
  }
  return wallTop - steps * 2;
}

/** A quiet week becomes a little park, dressed for the season. */
export function drawPark(c: Canvas, rng: Rng, x: number, w: number, look: SeasonLook): void {
  const pick = (colors: string[]) => colors[Math.floor(rng() * colors.length)]!;
  const cx = x + Math.floor(w / 2);
  c.nature.add(look.grass, x, BASE_Y - 2, w, 2);
  const kind = rng();
  if (kind < 0.4) {
    const canopy = pick(look.canopy);
    c.nature.add(TRUNK, cx - 1, BASE_Y - 8, 2, 6);
    c.nature.add(canopy, cx - 4, BASE_Y - 16, 8, 8).add(canopy, cx - 3, BASE_Y - 18, 6, 2);
  } else if (kind < 0.65) {
    c.nature.add(TRUNK, cx - 1, BASE_Y - 6, 2, 4);
    c.nature.add(look.pine, cx - 4, BASE_Y - 12, 8, 6).add(look.pine, cx - 3, BASE_Y - 17, 6, 5);
    c.nature.add(look.pineTip, cx - 1, BASE_Y - 21, 2, 4);
    if (look.snow) c.nature.add(SNOW, cx - 3, BASE_Y - 17, 6, 1).add(SNOW, cx - 4, BASE_Y - 12, 8, 1);
  } else if (kind < 0.85) {
    c.nature.add(pick(look.bush), x + 1, BASE_Y - 6, 5, 4).add(pick(look.bush), x + w - 6, BASE_Y - 5, 4, 3);
  } else if (look.snow) {
    // A snowman instead of a flower bed.
    c.nature.add(SNOW, cx - 3, BASE_Y - 8, 6, 6).add(SNOW, cx - 2, BASE_Y - 12, 4, 4).add("#f4a261", cx + 2, BASE_Y - 11, 2, 1);
  } else {
    c.nature.add(pick(look.bush), x + 1, BASE_Y - 4, w - 2, 2);
    for (const [fx, color] of [[2, "#ff8fa3"], [6, "#ffd166"], [10, "#c3a6ff"]] as const) {
      if (fx < w - 2) c.nature.add(color, x + fx, BASE_Y - 6, 2, 2);
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

/**
 * The best week's tower: your top language in neon on the roof, a blinking antenna, and at
 * night two searchlights sweeping the sky.
 */
export function drawLandmark(c: Canvas, x: number, w: number, top: number, language: LanguageShare | null): void {
  const cx = x + Math.floor(w / 2);
  let antennaBase = top;

  // Searchlights, behind everything else on the roof.
  const beam = (delay: number) =>
    `<path class="pf-search" style="transform-origin:${cx}px ${top}px;animation-delay:-${delay}s" d="M${cx - 1} ${top}L${cx - 14} ${top - 150}L${cx + 14} ${top - 150}L${cx + 1} ${top}Z" fill="url(#pf-searchlight)"/>`;
  c.extras.push(`<g class="pf-night">${beam(0)}${beam(4.5)}</g>`);

  if (language) {
    const boardTop = top - 17;
    const sw = Math.round(signLabel(language.name).length * 5.4 + 10);
    const left = Math.round(cx - sw / 2);
    for (const legX of [left + 3, left + sw - 5]) {
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
  // A lattice on the mast, so it reads as steel rather than a stick.
  for (let y = mastTop + 4; y < base - 2; y += 6) crane.add("#c77f0e", x + 9, y, 2, 1);
  c.extras.push(crane.toString(), `<rect class="pf-beacon" x="${x + 8}" y="${mastTop - 4}" width="4" height="4" fill="${BEACON}"/>`);
  if (sign) neonSign(c, hookX + 0.5, mastTop + 14, sign);
}
