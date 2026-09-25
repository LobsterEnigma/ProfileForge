import type { Rng } from "../random.js";
import { RectBatch } from "../svg/batch.js";
import { H, W } from "../city/layout.js";
import { CITY_AREA, type Area } from "./seasons.js";

/** The sky follows your activity, with the same thresholds as the pet's mood. */
export type Weather = "clear" | "rain" | "fog";

export function weatherFor(daysSinceLastContribution: number): Weather {
  if (daysSinceLastContribution >= 14) return "fog";
  if (daysSinceLastContribution >= 4) return "rain";
  return "clear";
}

export const WEATHER_CSS = `
.pf-drift{animation:pf-drift 160s linear infinite}
@keyframes pf-drift{0%{transform:translateX(-160px)}100%{transform:translateX(${W + 60}px)}}
.pf-rain{animation:pf-rain .8s linear infinite}
@keyframes pf-rain{0%{transform:translate(0,-12px)}100%{transform:translate(-26px,${H + 12}px)}}
.pf-fog{animation:pf-fog 24s ease-in-out infinite alternate}
@keyframes pf-fog{0%{transform:translateX(-50px)}100%{transform:translateX(50px)}}
`;

/** A chunky pixel cloud, roughly 22s × 5s. */
function cloud(batch: RectBatch, fill: string, x: number, y: number, s: number): void {
  batch
    .add(fill, x, y + 4 * s, 22 * s, 4 * s)
    .add(fill, x + 4 * s, y + s, 10 * s, 4 * s)
    .add(fill, x + 10 * s, y, 8 * s, 5 * s)
    .add(fill, x + 16 * s, y + 2 * s, 5 * s, 3 * s);
}

/** A few fair-weather clouds drifting by in daylight. */
export function clouds(rng: Rng): string {
  const out: string[] = [];
  for (let i = 0; i < 4; i++) {
    const batch = new RectBatch();
    cloud(batch, "#ffffff", 0, 0, 2);
    const y = 64 + Math.round(rng() * 70);
    const delay = Math.round(rng() * 160);
    out.push(`<g class="pf-drift" style="animation-delay:-${delay}s"><g transform="translate(0 ${y})" opacity=".7">${batch}</g></g>`);
  }
  return `<g class="pf-day">${out.join("")}</g>`;
}

/** Heavy cloud cover for bad weather, by day and by night. */
export function overcast(rng: Rng): string {
  const batch = new RectBatch();
  for (let x = -30; x < W; x += 70 + Math.round(rng() * 40)) {
    // Low enough to leave the title readable.
    cloud(batch, "#6f7689", x, 58 + Math.round(rng() * 40), 3);
  }
  return `<rect width="${W}" height="${H}" fill="#1b2033" opacity=".28"/><g opacity=".85">${batch}</g>`;
}

export function rain(rng: Rng, area: Area = CITY_AREA): string {
  const drops: string[] = [];
  const count = Math.round((70 * area.w) / W) + 6;
  for (let i = 0; i < count; i++) {
    const x = area.x + Math.round(rng() * (area.w + 40));
    const seconds = (0.55 + rng() * 0.4).toFixed(2);
    const delay = (rng() * 1).toFixed(2);
    drops.push(
      `<rect class="pf-rain" style="animation-duration:${seconds}s;animation-delay:-${delay}s" x="${x}" y="${area.y}" width="1" height="7" fill="#b9d3ff" opacity=".55"/>`,
    );
  }
  return `<g>${drops.join("")}</g>`;
}

/** Low fog rolling through the streets. */
export function fog(area: Area = CITY_AREA): string {
  const bands = [
    { y: area.ground - 84, h: 40, o: 0.35, d: 0 },
    { y: area.ground - 52, h: 44, o: 0.45, d: 8 },
    { y: area.ground - 24, h: 40, o: 0.55, d: 15 },
  ];
  return bands
    .map(
      (b) =>
        `<rect class="pf-fog" style="animation-delay:-${b.d}s" x="${area.x - 60}" y="${b.y}" width="${area.w + 120}" height="${b.h}" fill="url(#pf-fog)" opacity="${b.o}"/>`,
    )
    .join("");
}
