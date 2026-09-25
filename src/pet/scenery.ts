import { RectBatch } from "../svg/batch.js";
import { SNOW, type Area } from "../world/seasons.js";

/**
 * Each species lives somewhere that suits it. The terrain tints the theme's ground and adds a
 * few props around the edges of the scene, leaving the middle to the pet.
 */
export type Terrain = "beach" | "meadow" | "jungle" | "savanna" | "farm" | "pond";

const TERRAIN: Record<string, Terrain> = {
  crab: "beach",
  gopher: "meadow",
  snake: "jungle",
  elephant: "savanna",
  chick: "farm",
  turtle: "pond",
};

export const terrainFor = (species: string): Terrain => TERRAIN[species] ?? "beach";

/** Laid over the theme's ground color; fainter at night so dark themes stay dark. */
const TINT: Record<Terrain, string | null> = {
  beach: null,
  meadow: "#79b865",
  jungle: "#4f9a55",
  savanna: "#cfb25e",
  farm: "#86b862",
  pond: "#79b865",
};

export const SCENERY_CSS = `.pf-tint{opacity:calc(.75 - var(--pf-stars) * .4)}`;

const GREEN = "#3f8f4f";
const DARK_GREEN = "#2c6b3a";
const WOOD = "#8a5a33";
const DRY = "#b8953f";

/** Terrain tint and snow cover, drawn right over the ground. */
export function groundCover(species: string, area: Area, bottom: number, snowy: boolean): string {
  const tint = TINT[terrainFor(species)];
  const h = bottom - area.ground + 3;
  let out = tint ? `<rect class="pf-tint" x="${area.x}" y="${area.ground - 3}" width="${area.w}" height="${h}" fill="${tint}"/>` : "";
  if (snowy) out += `<rect x="${area.x}" y="${area.ground - 3}" width="${area.w}" height="${h}" fill="${SNOW}" opacity=".85"/>`;
  return out;
}

/** Props around the edges of the scene. */
export function props(species: string, area: Area): string {
  const b = new RectBatch();
  const g = area.ground;
  const left = area.x;
  const right = area.x + area.w;

  switch (terrainFor(species)) {
    case "beach":
      // A starfish and a shell in the sand.
      b.add("#f4845f", left + 20, g + 12, 6, 2).add("#f4845f", left + 22, g + 10, 2, 6).add("#f4845f", left + 19, g + 15, 2, 2).add("#f4845f", left + 25, g + 15, 2, 2);
      b.add("#f7c6d9", right - 30, g + 16, 8, 3).add("#f7c6d9", right - 28, g + 14, 4, 2).add("#e39bb6", right - 29, g + 17, 1, 2).add("#e39bb6", right - 25, g + 17, 1, 2);
      break;
    case "meadow":
      // A burrow on the right, grass tufts around.
      b.add("#7a5230", right - 42, g - 6, 30, 6).add("#7a5230", right - 38, g - 10, 22, 4).add("#3a2616", right - 32, g - 6, 10, 6);
      for (const x of [left + 10, left + 34, right - 56, right - 10]) tuft(b, x, g, GREEN);
      break;
    case "jungle":
      // Ferns rising on both sides and a vine hanging from above.
      fern(b, left + 16, g);
      fern(b, right - 16, g);
      for (let y = area.y; y < area.y + 46; y += 6) b.add(DARK_GREEN, left + 40 + ((y / 6) % 2), y, 2, 6);
      b.add(GREEN, left + 37, area.y + 20, 4, 3).add(GREEN, left + 42, area.y + 34, 4, 3);
      break;
    case "savanna":
      // An acacia tree with its flat crown, and dry grass.
      b.add(WOOD, right - 30, g - 40, 4, 40).add(WOOD, right - 36, g - 44, 4, 8).add(WOOD, right - 24, g - 46, 4, 8);
      b.add(DARK_GREEN, right - 52, g - 52, 50, 6).add(DARK_GREEN, right - 46, g - 56, 38, 4);
      for (const x of [left + 12, left + 36, right - 64]) tuft(b, x, g, DRY);
      break;
    case "farm":
      // A wooden fence along the back, grain on the ground.
      for (let x = left + 6; x < right; x += 24) b.add(WOOD, x, g - 18, 4, 18);
      b.add(WOOD, left, g - 14, area.w, 2).add(WOOD, left, g - 7, area.w, 2);
      for (const [x, y] of [[left + 26, g + 10], [left + 44, g + 18], [right - 40, g + 12], [right - 22, g + 20], [left + 70, g + 22]] as const) {
        b.add("#e9c46a", x, y, 2, 2);
      }
      break;
    case "pond":
      // A pond with a lily pad, and reeds at its edge.
      b.add("#5fa8d3", right - 70, g + 6, 56, 14).add("#5fa8d3", right - 64, g + 4, 44, 2).add("#5fa8d3", right - 64, g + 20, 44, 2);
      b.add("#9fd0ec", right - 58, g + 9, 12, 2);
      b.add("#3f8f4f", right - 36, g + 10, 10, 5).add("#ff8fa3", right - 33, g + 9, 3, 2);
      for (const x of [right - 12, right - 8]) b.add(DARK_GREEN, x, g - 16, 2, 22).add(WOOD, x, g - 20, 2, 5);
      break;
  }
  return b.toString();
}

function tuft(b: RectBatch, x: number, ground: number, color: string): void {
  b.add(color, x, ground - 5, 2, 5).add(color, x - 3, ground - 3, 2, 3).add(color, x + 3, ground - 4, 2, 4);
}

/** A tropical fern: fronds fanning out from one base, each a row of leaf segments. */
function fern(b: RectBatch, x: number, ground: number): void {
  const fronds: [number, number, number][] = [
    [-4, -2, 5],
    [-2, -4, 6],
    [0, -5, 6],
    [2, -4, 6],
    [4, -2, 5],
  ];
  for (const [dx, dy, steps] of fronds) {
    for (let j = 1; j <= steps; j++) {
      b.add(j % 2 ? GREEN : DARK_GREEN, x + dx * j - 2, ground + dy * j, 4, 3);
    }
  }
  b.add(DARK_GREEN, x - 1, ground - 4, 3, 4);
}
