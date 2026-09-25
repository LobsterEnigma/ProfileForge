import type { Rng } from "../random.js";
import { BASE_Y, H, ROAD_Y, W } from "../city/layout.js";

/** Where a world effect is drawn: the whole city, or the pet card's little scene. */
export interface Area {
  x: number;
  y: number;
  w: number;
  /** The y of the ground line. */
  ground: number;
}

export const CITY_AREA: Area = { x: 0, y: 0, w: W, ground: BASE_Y };

export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof SEASONS)[number];

export const HEMISPHERES = ["north", "south"] as const;
export type Hemisphere = (typeof HEMISPHERES)[number];

const OPPOSITE: Record<Season, Season> = { spring: "autumn", summer: "winter", autumn: "spring", winter: "summer" };

/**
 * Meteorological seasons for the date. The south gets them flipped, so a December
 * city there is summer. The `season` param pins one instead.
 */
export function seasonFor(date: string, hemisphere: Hemisphere = "north"): Season {
  const month = Number(date.slice(5, 7));
  const north: Season =
    month >= 3 && month <= 5 ? "spring" : month >= 6 && month <= 8 ? "summer" : month >= 9 && month <= 11 ? "autumn" : "winter";
  return hemisphere === "south" ? OPPOSITE[north] : north;
}

export interface SeasonLook {
  /** Round-tree canopies, one picked per tree. */
  canopy: string[];
  pine: string;
  pineTip: string;
  grass: string;
  bush: string[];
  /** Snow on rooftops and treetops. */
  snow: boolean;
  fireflies: boolean;
  /** `leaf` draws a little diamond so leaves and petals don't read as stars. */
  falling: { colors: string[]; count: number; size: number; minSeconds: number; spin: boolean; shape: "square" | "leaf" } | null;
  /** Colors scattered on the sidewalk: fallen petals or leaves. */
  litter: string[];
}

export const SNOW = "#f2f6ff";

export const LOOKS: Record<Season, SeasonLook> = {
  spring: {
    canopy: ["#ffb7c5", "#ffc8d6", "#f7a1b8"],
    pine: "#24603a",
    pineTip: "#24603a",
    grass: "#4caf6a",
    bush: ["#5fbf7a", "#ffb7c5"],
    snow: false,
    fireflies: false,
    falling: { colors: ["#ffc8d6", "#ffb7c5"], count: 18, size: 3, minSeconds: 9, spin: true, shape: "leaf" },
    litter: ["#ffc8d6", "#ffb7c5"],
  },
  summer: {
    canopy: ["#2f7d4a", "#3a8f57"],
    pine: "#24603a",
    pineTip: "#24603a",
    grass: "#3f9b5a",
    bush: ["#2f7d4a", "#3a8f57"],
    snow: false,
    fireflies: true,
    falling: null,
    litter: [],
  },
  autumn: {
    canopy: ["#e76f51", "#f4a261", "#d62828", "#e9c46a"],
    pine: "#24603a",
    pineTip: "#24603a",
    grass: "#8a9a4a",
    bush: ["#c9723a", "#b5543a"],
    snow: false,
    fireflies: false,
    falling: { colors: ["#e76f51", "#f4a261", "#d62828", "#e9c46a"], count: 24, size: 3, minSeconds: 8, spin: true, shape: "leaf" },
    litter: ["#e76f51", "#f4a261", "#d62828", "#e9c46a"],
  },
  winter: {
    canopy: ["#dde7f0"],
    pine: "#2c5e46",
    pineTip: SNOW,
    grass: "#e3ebf5",
    bush: ["#d5e0ea"],
    snow: true,
    fireflies: false,
    falling: { colors: [SNOW], count: 38, size: 2, minSeconds: 10, spin: false, shape: "square" },
    litter: [],
  },
};

export const SEASON_CSS = `
.pf-fall{animation:pf-fall 10s linear infinite}
.pf-spin{transform-box:fill-box;transform-origin:center}
@keyframes pf-fall{0%{transform:translate(0,-12px) rotate(0)}100%{transform:translate(var(--dx),${H + 12}px) rotate(var(--spin,0deg))}}
.pf-firefly{animation:pf-firefly 3s ease-in-out infinite}
@keyframes pf-firefly{0%,100%{opacity:0;transform:translate(0,0)}50%{opacity:1;transform:translate(var(--dx),-6px)}}
`;

/** Snow, petals or leaves drifting down in front of the city. */
export function fallingParticles(look: SeasonLook, rng: Rng, area: Area = CITY_AREA): string {
  const f = look.falling;
  if (!f) return "";
  const out: string[] = [];
  const count = Math.round((f.count * area.w) / W) + 4;
  for (let i = 0; i < count; i++) {
    const x = area.x + Math.round(rng() * area.w);
    const seconds = f.minSeconds + rng() * 7;
    const delay = rng() * seconds;
    const dx = Math.round((rng() - 0.5) * 80);
    const color = f.colors[Math.floor(rng() * f.colors.length)]!;
    const size = f.size + (rng() < 0.3 ? 1 : 0);
    const spin = f.spin ? `;--spin:${rng() < 0.5 ? "-" : ""}540deg` : "";
    const attrs = `class="pf-fall${f.spin ? " pf-spin" : ""}" style="--dx:${dx}px${spin};animation-duration:${seconds.toFixed(1)}s;animation-delay:-${delay.toFixed(1)}s" fill="${color}"`;
    out.push(
      f.shape === "leaf"
        ? `<path ${attrs} d="${leaf(x, area.y, size)}"/>`
        : `<rect ${attrs} x="${x}" y="${area.y}" width="${size}" height="${size}"/>`,
    );
  }
  return `<g>${out.join("")}</g>`;
}

/** A slanted pixel leaf or petal, `size` 3 or 4 wide (a "+" would read as a sparkle). */
function leaf(x: number, y: number, size: number): string {
  return size >= 4 ? `M${x} ${y}h2v1h2v2h-2v-1h-1v-1h-1z` : `M${x} ${y}h2v1h1v1h-2v-1h-1z`;
}

/** Fallen petals or leaves scattered along the sidewalk and the curb. */
export function litter(look: SeasonLook, rng: Rng): string {
  if (look.litter.length === 0) return "";
  const out: string[] = [];
  for (let i = 0; i < 46; i++) {
    const x = Math.round(rng() * W);
    const y = BASE_Y + Math.round(rng() * (ROAD_Y - BASE_Y + 2));
    const color = look.litter[Math.floor(rng() * look.litter.length)]!;
    out.push(`<rect x="${x}" y="${y}" width="${rng() < 0.5 ? 2 : 3}" height="1" fill="${color}"/>`);
  }
  return `<g opacity=".85">${out.join("")}</g>`;
}

/** Summer nights: a few fireflies drifting over the parks and street. */
export function fireflies(look: SeasonLook, rng: Rng, area: Area = CITY_AREA): string {
  if (!look.fireflies) return "";
  const out: string[] = [];
  const count = Math.max(4, Math.round((12 * area.w) / W));
  for (let i = 0; i < count; i++) {
    const x = Math.round(area.x + 12 + rng() * (area.w - 24));
    const y = Math.round(area.ground - 30 + rng() * 26);
    const dx = Math.round((rng() - 0.5) * 16);
    out.push(
      `<rect class="pf-firefly" style="--dx:${dx}px;animation-delay:-${(rng() * 3).toFixed(1)}s;animation-duration:${(2.4 + rng() * 2).toFixed(1)}s" x="${x}" y="${y}" width="2" height="2" fill="#dfff6b"/>`,
    );
  }
  return `<g class="pf-night">${out.join("")}</g>`;
}
