import { RectBatch } from "../svg/batch.js";
import { stepped } from "../svg/stepped.js";
import { renderPixels, type Grid, type Palette } from "../svg/pixel.js";
import { SNOW, type Area } from "../world/seasons.js";
import { beachAmbient, beachProps } from "./beach.js";
import { homeAmbient, homeProps, type Home } from "./homes.js";

/**
 * Each species lives somewhere that suits it. The terrain tints the theme's ground and adds a
 * few props around the edges of the scene, leaving the middle to the pet.
 */
export type Terrain = "beach" | "meadow" | "jungle" | "savanna" | "farm" | "pond" | Home;

const TERRAIN: Record<string, Terrain> = {
  crab: "beach",
  gopher: "meadow",
  snake: "jungle",
  elephant: "savanna",
  chick: "farm",
  turtle: "pond",
  capybara: "onsen",
  hedgehog: "forest",
  octopus: "reef",
  snail: "garden",
  fox: "pinewood",
  swift: "treetop",
  squid: "deepsea",
  otter: "river",
};

export const terrainFor = (species: string): Terrain => (Object.hasOwn(TERRAIN, species) ? TERRAIN[species]! : "beach");

/** Laid over the theme's ground color; fainter at night so dark themes stay dark. */
const TINT: Record<Terrain, string | null> = {
  beach: "#e9cf98",
  meadow: "#79b865",
  jungle: "#4f9a55",
  savanna: "#cfb25e",
  farm: "#86b862",
  pond: "#79b865",
  onsen: "#8cbf73",
  forest: "#6fa55a",
  reef: null,
  garden: "#7cc36a",
  pinewood: "#6f9e5c",
  treetop: "#7fb366",
  deepsea: null,
  river: "#7fb366",
};

export const SCENERY_CSS = `.pf-tint{opacity:calc(.75 - var(--pf-stars) * .4)}`;

const GREEN = "#3f8f4f";
const DARK_GREEN = "#2c6b3a";
const WOOD = "#8a5a33";
const DRY = "#b8953f";

/** How tall each 2px blade of grass along the ground's edge stands. */
const BLADES = [1, 3, 2, 0, 1, 4, 2, 1, 0, 2, 3, 1, 0, 1, 2, 5, 1, 0, 2, 1, 3, 0, 1, 2];

/**
 * The ground's top edge, terrain tint and snow cover, drawn right over the ground. Grassy homes
 * get a fringe of blades; sandy ones a gently bumpy line.
 */
export function groundCover(species: string, area: Area, bottom: number, snowy: boolean): string {
  const terrain = terrainFor(species);
  const tint = TINT[terrain];
  const g = area.ground;
  const h = bottom - g;
  // The beach's edge is under the sea; grassy homes get blades, the rest a gently bumpy line.
  const blades = tint && terrain !== "beach";
  const top = blades ? (x: number) => g - 2 - BLADES[(x / 2) % BLADES.length]! : (x: number) => (x % 16 < 8 ? g - 3 : undefined);
  let out = stepped("var(--pf-ground)", area.x, area.w, top, () => g + 1);
  if (tint) out += `<g class="pf-tint"><rect x="${area.x}" y="${g}" width="${area.w}" height="${h}" fill="${tint}"/>${blades ? stepped(tint, area.x, area.w, top, () => g) : ""}</g>`;
  if (snowy) out += `<g opacity=".85"><rect x="${area.x}" y="${g - 2}" width="${area.w}" height="${h + 2}" fill="${SNOW}"/></g>`;
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
      return beachProps(area);
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
    default:
      return homeProps(terrainFor(species) as Home, area);
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

// ── Ambient life ─────────────────────────────────────────────────────────────

const px = (grid: Grid, palette: Palette, x: number, y: number, scale: number) => renderPixels([{ x: 0, y: 0, grid }], palette, { x, y, scale });

const BEE: Grid = [".ww.", "ykyk", ".yk."];
const PARROT: Grid = [".rr.", "rrwk", "rrry", ".gr.", ".gg.", ".bb."];
const BIRD: Grid = [".kk.", "kkkw", "kkk.", ".y.."];
const WORM: Grid = [".p", "pp", "p.", "pp", ".p"];
const FISH: Grid = ["..oo..", "oooooo", ".oo.oo"];

/**
 * Something alive in each home, drawn behind the pet: the sea and a gull at the beach, a bee in
 * the meadow, a parrot in the jungle, a bird on the acacia, a worm on the farm, ripples and a
 * jumping fish in the pond. Returns the drawing and the styles it needs.
 */
export function ambient(species: string, area: Area, night = false): { svg: string; css: string } {
  const g = area.ground;
  const left = area.x;
  const right = area.x + area.w;
  switch (terrainFor(species)) {
    case "beach":
      return beachAmbient(area, night);
    case "meadow": {
      const bee = `<g class="pf-amb-bee"><g class="pf-fa" style="animation-duration:.2s">${px(BEE, { w: "#e7f5ff", y: "#ffd43b", k: "#343a40" }, 0, 0, 2)}</g><g class="pf-fb" style="animation-duration:.2s">${px(BEE.slice(1), { w: "#e7f5ff", y: "#ffd43b", k: "#343a40" }, 0, 2, 2)}</g></g>`;
      return {
        svg: `<g transform="translate(${right - 40} ${g - 26})">${bee}</g>`,
        css: `.pf-amb-bee{animation:pf-amb-bee 7s ease-in-out infinite}@keyframes pf-amb-bee{0%,100%{transform:translate(0,0)}20%{transform:translate(-14px,-8px)}40%{transform:translate(-4px,-16px)}60%{transform:translate(12px,-6px)}80%{transform:translate(4px,4px)}}`,
      };
    }
    case "jungle":
      return {
        svg: `<g transform="translate(${right - 22} ${g - 40})"><g class="pf-amb-bob">${px(PARROT, { r: "#e03131", w: "#ffffff", k: "#1f2328", y: "#ffd43b", g: "#2f9e44", b: "#1c7ed6" }, 0, 0, 3)}</g></g>`,
        css: `.pf-amb-bob{transform-box:fill-box;transform-origin:50% 100%;animation:pf-amb-bob 5s steps(1) infinite}@keyframes pf-amb-bob{0%,60%{transform:none}64%{transform:rotate(-12deg)}72%{transform:none}76%{transform:rotate(-12deg)}84%,100%{transform:none}}`,
      };
    case "savanna":
      // A little bird hopping along the acacia's crown.
      return {
        svg: `<g transform="translate(${right - 44} ${g - 64})"><g class="pf-amb-hop">${px(BIRD, { k: "#5c3d2e", w: "#ffffff", y: "#f59f00" }, 0, 0, 2)}</g></g>`,
        css: `.pf-amb-hop{animation:pf-amb-hop 6s ease-in-out infinite}@keyframes pf-amb-hop{0%,30%{transform:none}35%{transform:translate(6px,-4px)}40%,65%{transform:translate(12px,0)}70%{transform:translate(6px,-4px)}75%,100%{transform:none}}`,
      };
    case "farm":
      // A worm peeks out of the ground now and then.
      return {
        svg: `<clipPath id="pf-amb-soil"><rect x="${left + 50}" y="${g}" width="12" height="16"/></clipPath><rect x="${left + 52}" y="${g + 14}" width="8" height="2" fill="#6b4226"/><g clip-path="url(#pf-amb-soil)"><g class="pf-amb-worm">${px(WORM, { p: "#f783ac" }, left + 54, g + 14, 2)}</g></g>`,
        css: `.pf-amb-worm{transform-box:fill-box;transform-origin:50% 100%;animation:pf-amb-worm 9s ease-in-out infinite}@keyframes pf-amb-worm{0%,55%,100%{transform:none}62%,80%{transform:translateY(-10px)}70%{transform:translateY(-10px) rotate(8deg)}}`,
      };
    case "pond": {
      const cx = right - 50;
      const cy = g + 13;
      const ripple = (d: number) => `<ellipse class="pf-amb-ripple" style="animation-delay:-${d}s" cx="${cx}" cy="${cy}" rx="8" ry="2.5" fill="none" stroke="#d0ebff" stroke-width="1"/>`;
      return {
        svg: `${ripple(0)}${ripple(1.5)}<g class="pf-amb-fish">${px(FISH, { o: "#ff922b" }, cx - 6, cy - 2, 2)}</g>`,
        css: `.pf-amb-ripple{transform-box:fill-box;transform-origin:center;animation:pf-amb-ripple 3s ease-out infinite}@keyframes pf-amb-ripple{0%{transform:scale(.3);opacity:.9}100%{transform:scale(1.6);opacity:0}}
.pf-amb-fish{opacity:0;transform-box:fill-box;transform-origin:center;animation:pf-amb-fish 8s ease-in-out infinite}@keyframes pf-amb-fish{0%,70%{opacity:0;transform:translate(-8px,4px) rotate(-40deg)}72%{opacity:1}80%{transform:translate(0,-14px) rotate(0)}88%{opacity:1;transform:translate(8px,2px) rotate(40deg)}90%,100%{opacity:0;transform:translate(8px,4px) rotate(40deg)}}`,
      };
    }
    default:
      return homeAmbient(terrainFor(species) as Home, area);
  }
}
