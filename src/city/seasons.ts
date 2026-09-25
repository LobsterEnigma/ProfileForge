import type { Rng } from "../random.js";
import { BASE_Y, H, W } from "./layout.js";

export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof SEASONS)[number];

/** Northern-hemisphere meteorological seasons. Use the `season` param to override. */
export function seasonFor(date: string): Season {
  const month = Number(date.slice(5, 7));
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
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
  falling: { colors: string[]; count: number; size: number; minSeconds: number; spin: boolean } | null;
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
    falling: { colors: ["#ffc8d6", "#ffb7c5"], count: 16, size: 2, minSeconds: 9, spin: true },
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
  },
  autumn: {
    canopy: ["#e76f51", "#f4a261", "#d62828", "#e9c46a"],
    pine: "#24603a",
    pineTip: "#24603a",
    grass: "#8a9a4a",
    bush: ["#c9723a", "#b5543a"],
    snow: false,
    fireflies: false,
    falling: { colors: ["#e76f51", "#f4a261", "#d62828"], count: 12, size: 3, minSeconds: 8, spin: true },
  },
  winter: {
    canopy: ["#dde7f0"],
    pine: "#2c5e46",
    pineTip: SNOW,
    grass: "#e3ebf5",
    bush: ["#d5e0ea"],
    snow: true,
    fireflies: false,
    falling: { colors: [SNOW], count: 38, size: 2, minSeconds: 10, spin: false },
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
export function fallingParticles(look: SeasonLook, rng: Rng): string {
  const f = look.falling;
  if (!f) return "";
  const out: string[] = [];
  for (let i = 0; i < f.count; i++) {
    const x = Math.round(rng() * W);
    const seconds = f.minSeconds + rng() * 7;
    const delay = rng() * seconds;
    const dx = Math.round((rng() - 0.5) * 80);
    const color = f.colors[Math.floor(rng() * f.colors.length)]!;
    const size = f.size + (rng() < 0.3 ? 1 : 0);
    const spin = f.spin ? `;--spin:${rng() < 0.5 ? "-" : ""}540deg` : "";
    out.push(
      `<rect class="pf-fall${f.spin ? " pf-spin" : ""}" style="--dx:${dx}px${spin};animation-duration:${seconds.toFixed(1)}s;animation-delay:-${delay.toFixed(1)}s" x="${x}" y="0" width="${size}" height="${size}" fill="${color}"/>`,
    );
  }
  return `<g>${out.join("")}</g>`;
}

/** Summer nights: a few fireflies drifting over the parks and street. */
export function fireflies(look: SeasonLook, rng: Rng): string {
  if (!look.fireflies) return "";
  const out: string[] = [];
  for (let i = 0; i < 12; i++) {
    const x = Math.round(24 + rng() * (W - 48));
    const y = Math.round(BASE_Y - 30 + rng() * 26);
    const dx = Math.round((rng() - 0.5) * 16);
    out.push(
      `<rect class="pf-firefly" style="--dx:${dx}px;animation-delay:-${(rng() * 3).toFixed(1)}s;animation-duration:${(2.4 + rng() * 2).toFixed(1)}s" x="${x}" y="${y}" width="2" height="2" fill="#dfff6b"/>`,
    );
  }
  return `<g class="pf-night">${out.join("")}</g>`;
}
