import { RectBatch } from "../svg/batch.js";
import { renderPixels, type Grid, type Palette } from "../svg/pixel.js";
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

export const terrainFor = (species: string): Terrain => (Object.hasOwn(TERRAIN, species) ? TERRAIN[species]! : "beach");

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

// ── Ambient life ─────────────────────────────────────────────────────────────

const px = (grid: Grid, palette: Palette, x: number, y: number, scale: number) => renderPixels([{ x: 0, y: 0, grid }], palette, { x, y, scale });

const BEE: Grid = [".ww.", "ykyk", ".yk."];
const PARROT: Grid = [".rr.", "rrwk", "rrry", ".gr.", ".gg.", ".bb."];
const BIRD: Grid = [".kk.", "kkkw", "kkk.", ".y.."];
const WORM: Grid = [".p", "pp", "p.", "pp", ".p"];
const FISH: Grid = ["..oo..", "oooooo", ".oo.oo"];

/**
 * Something alive in each home, drawn behind the pet: waves and a gull at the beach, a bee in
 * the meadow, a parrot in the jungle, a bird on the acacia, a worm on the farm, ripples and a
 * jumping fish in the pond. Returns the drawing and the styles it needs.
 */
export function ambient(species: string, area: Area): { svg: string; css: string } {
  const g = area.ground;
  const left = area.x;
  const right = area.x + area.w;
  switch (terrainFor(species)) {
    case "beach": {
      // The sea on the horizon, foam rolling in and out, and a gull gliding by.
      const foam = [0, 1, 2].map((i) => `<rect class="pf-amb-foam" style="animation-delay:-${i * 1.3}s" x="${left + 20 + i * 62}" y="${g - 3}" width="${22 - i * 3}" height="2" fill="#ffffff"/>`).join("");
      const gull = `<g class="pf-amb-gull"><path class="pf-fa" style="animation-duration:.8s" d="M0 2L3 0L5 2L7 0L10 2" fill="none" stroke="#5b6472" stroke-width="1.4"/><path class="pf-fb" style="animation-duration:.8s" d="M0 0L3 2L5 1L7 2L10 0" fill="none" stroke="#5b6472" stroke-width="1.4"/></g>`;
      return {
        svg: `<g class="pf-amb-sea"><rect x="${left}" y="${g - 9}" width="${area.w}" height="7" fill="#4ea8de"/><rect x="${left}" y="${g - 9}" width="${area.w}" height="1" fill="#9fd4ff"/></g>${foam}<g transform="translate(0 ${area.y + 30})">${gull}</g>`,
        css: `.pf-amb-sea{opacity:calc(.9 - var(--pf-stars) * .35)}
.pf-amb-foam{animation:pf-amb-foam 3.9s ease-in-out infinite}@keyframes pf-amb-foam{0%,100%{transform:translateX(0);opacity:.9}50%{transform:translateX(6px);opacity:.3}}
.pf-amb-gull{animation:pf-amb-gull 26s linear infinite}@keyframes pf-amb-gull{0%{transform:translate(${left - 20}px,6px)}50%{transform:translate(${left + area.w / 2}px,0)}100%{transform:translate(${right + 20}px,8px)}}`,
      };
    }
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
  }
}
