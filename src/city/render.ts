import { seeded, type Rng } from "../random.js";
import { RectBatch } from "../svg/batch.js";
import { escapeXml } from "../svg/escape.js";
import { mirror, renderPixels, type Grid } from "../svg/pixel.js";
import { SPRITE_CSS } from "../pet/sprite.js";
import { themeCss, themeFilter } from "../themes.js";
import { drawBuilding, drawCrane, drawLandmark, drawPark, newCanvas, pickStyle, renderCanvas } from "./buildings.js";
import { bats, EVENTS_CSS, fireworks, holidayFor, parkDecor, roofDecor, type Holiday } from "./events.js";
import { CITY_PET_CSS, strollingPet } from "./pet.js";
import { clouds, fog, overcast, rain, WEATHER_CSS, weatherFor, type Weather } from "./weather.js";
import { moonPhase, moonPhaseName, pixelCircle, pixelMoon } from "./celestial.js";
import { BASE_Y, BUILDING_W, H, MAX_FLOORS, RIGHT_EDGE, ROAD_Y, U, W } from "./layout.js";
import { fallingParticles, fireflies, LOOKS, SEASON_CSS, seasonFor, type Season } from "./seasons.js";
import type { CityState, Week } from "./state.js";

export interface RenderOptions {
  theme?: string;
  hideBorder?: boolean;
  /** Overrides the date-based (northern hemisphere) season. */
  season?: Season;
}

const SANS = "'Segoe UI',Ubuntu,'Helvetica Neue',sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
const SHADES = ["var(--pf-bldg1)", "var(--pf-bldg2)", "var(--pf-bldg3)"];

const CAR: Grid = [
  "...ccccc....",
  "..cwwcwwc...",
  "qccccccccccy",
  "cccccccccccc",
  ".kk......kk.",
];
const CAR_COLORS = ["#e63946", "#4ea8de", "#f4a261"];

const CSS = `
.pf-twinkle{transform-box:fill-box;transform-origin:center;animation:pf-twinkle 2.2s ease-in-out infinite}
@keyframes pf-twinkle{0%,100%{opacity:.2}50%{opacity:1}}
.pf-night{opacity:var(--pf-stars)}
.pf-day{opacity:calc(1 - var(--pf-stars))}
.pf-beam{opacity:var(--pf-stars)}
.pf-glow{opacity:var(--pf-stars)}
.pf-flicker{animation:pf-flicker 7s linear infinite}
@keyframes pf-flicker{0%,84%,100%{opacity:1}85%,93%{opacity:0}}
.pf-beacon{animation:pf-beacon 1.6s steps(1) infinite}
@keyframes pf-beacon{0%{opacity:1}50%{opacity:.15}100%{opacity:.15}}
.pf-strobe{animation:pf-strobe 1.1s steps(1) infinite}
@keyframes pf-strobe{0%{opacity:1}12%{opacity:0}100%{opacity:0}}
.pf-neon{animation:pf-buzz 6s linear infinite}
@keyframes pf-buzz{0%,90%,94%,97%,100%{opacity:1}91%,95%{opacity:.35}}
.pf-sign{font:700 8px ${MONO};letter-spacing:.06em}
.pf-drive-r{animation:pf-drive-r 14s linear infinite}
.pf-drive-l{animation:pf-drive-l 18s linear infinite}
@keyframes pf-drive-r{0%{transform:translateX(-60px)}100%{transform:translateX(${W + 60}px)}}
@keyframes pf-drive-l{0%{transform:translateX(${W + 60}px)}100%{transform:translateX(-60px)}}
.pf-fly{animation:pf-fly 38s linear infinite}
@keyframes pf-fly{0%{transform:translateX(${W + 40}px)}100%{transform:translateX(-80px)}}
.pf-flock{animation:pf-flock 46s linear infinite}
@keyframes pf-flock{0%{transform:translateX(-60px)}100%{transform:translateX(${W + 60}px)}}
.pf-flap-a{animation:pf-flap-a .6s steps(1) infinite}
.pf-flap-b{opacity:0;animation:pf-flap-b .6s steps(1) infinite}
@keyframes pf-flap-a{0%{opacity:1}50%{opacity:0}100%{opacity:0}}
@keyframes pf-flap-b{0%{opacity:0}50%{opacity:1}100%{opacity:1}}
.pf-shoot{animation:pf-shoot 9s ease-out infinite}
@keyframes pf-shoot{0%{transform:translate(0,0);opacity:0}2%{opacity:1}12%{transform:translate(-170px,74px);opacity:0}100%{transform:translate(-170px,74px);opacity:0}}
${SEASON_CSS}
${WEATHER_CSS}
${EVENTS_CSS}
${CITY_PET_CSS}
${SPRITE_CSS}
.pf-title{font:700 18px ${SANS};fill:var(--pf-city-text)}
.pf-sub{font:400 12px ${SANS};fill:var(--pf-city-muted)}
.pf-stats{font:700 11px ${MONO};fill:var(--pf-city-muted);letter-spacing:.04em}
.pf-halo{paint-order:stroke;stroke:var(--pf-city-sky-top);stroke-width:3px;stroke-linejoin:round}
@media (prefers-reduced-motion:reduce){.pf *{animation:none!important}}
`;

export function floorsFor(week: Week, maxTotal: number): number {
  if (week.total <= 0 || maxTotal <= 0) return 0;
  // A soft power curve: quiet weeks stay low, busy ones tower, outliers don't flatten the rest.
  const ratio = (week.total / maxTotal) ** 0.6;
  return Math.max(1, Math.round(1 + (MAX_FLOORS - 1) * ratio));
}

// ── Sky ──────────────────────────────────────────────────────────────────────

function sky(state: CityState, rng: Rng, weather: Weather): string {
  const stars = new RectBatch();
  const twinkles: string[] = [];
  for (let i = 0; i < 46; i++) {
    const x = Math.round(rng() * (W - 20)) + 10;
    const y = Math.round(rng() * 150) + 8;
    if (rng() < 0.25) {
      twinkles.push(
        `<rect class="pf-twinkle" style="animation-delay:-${(rng() * 3).toFixed(2)}s" x="${x}" y="${y}" width="2" height="2" fill="#fff"/>`,
      );
    } else {
      stars.add("#fff", x, y, 2, 2);
    }
  }

  const sun = new RectBatch();
  pixelCircle(sun, "var(--pf-celestial)", 640, 168, 40, 4);
  const sunGlow = new RectBatch();
  pixelCircle(sunGlow, "var(--pf-celestial)", 640, 168, 60, 4);

  const shootingStar =
    state.currentStreak >= 7
      ? `<g class="pf-shoot"><line x1="560" y1="34" x2="592" y2="20" stroke="url(#pf-tail)" stroke-width="2"/><rect x="558" y="33" width="3" height="3" fill="#fff"/></g>`
      : "";

  // Bad weather hides the sun, the moon and the stars.
  if (weather !== "clear") return `<rect width="${W}" height="${H}" fill="url(#pf-sky)"/>`;

  return `
<rect width="${W}" height="${H}" fill="url(#pf-sky)"/>
<g class="pf-day"><g opacity=".25">${sunGlow}</g>${sun}</g>
<g class="pf-night">${stars}${twinkles.join("")}${pixelMoon(712, 78, 13, U, moonPhase(state.date))}${shootingStar}</g>`;
}

/** A plane crossing the sky with its navigation lights, and birds heading home at dusk. */
function flyers(): string {
  const plane = new RectBatch()
    .add("var(--pf-bldg1)", 0, 2, 18, 3)
    .add("var(--pf-bldg1)", 14, -1, 3, 3)
    .add("var(--pf-bldg1)", 6, 5, 6, 2);
  const flyingPlane = `<g class="pf-fly" style="animation-delay:-14s"><g transform="translate(0 104)">${plane}
<rect class="pf-beacon" x="8" y="7" width="2" height="2" fill="${"#ff4d4d"}"/>
<rect class="pf-beacon" style="animation-delay:-.8s" x="-1" y="3" width="2" height="2" fill="#7dff9b"/>
<rect class="pf-strobe" x="16" y="-2" width="2" height="2" fill="#ffffff"/></g></g>`;

  const bird = (dx: number, dy: number) =>
    `<g transform="translate(${dx} ${dy})"><path class="pf-flap-a" d="M0 0L3 3L6 0"/><path class="pf-flap-b" d="M0 3L3 2L6 3"/></g>`;
  const flock = `<g class="pf-day"><g class="pf-flock" style="animation-delay:-20s"><g transform="translate(0 122)" fill="none" stroke="var(--pf-bldg3)" stroke-width="1.3">${bird(0, 0)}${bird(10, 5)}${bird(-9, 6)}${bird(20, 10)}</g></g></g>`;

  return flyingPlane + flock;
}

// ── Skyline ──────────────────────────────────────────────────────────────────

/** A hazy far-away skyline behind the real buildings, for depth. */
function backdrop(rng: Rng): string {
  const batch = new RectBatch();
  let x = 0;
  while (x < W) {
    const w = 12 + Math.round(rng() * 22);
    const h = 36 + Math.round(rng() * 80);
    batch.add("var(--pf-bldg2)", x, BASE_Y - h, w, h);
    x += w + (rng() < 0.3 ? 4 : 0);
  }
  return `<g opacity=".45">${batch}</g>`;
}

function skyline(state: CityState, season: Season, holiday: Holiday | null, weather: Weather): string {
  const canvas = newCanvas();
  const look = LOOKS[season];
  const weeks = state.weeks;
  const maxTotal = Math.max(0, ...weeks.map((w) => w.total));
  const startX = RIGHT_EDGE - weeks.length * BUILDING_W;
  let prevShade = -1;

  weeks.forEach((week, i) => {
    // Seeded per week: a building keeps its look as the year scrolls left.
    const rng = seeded(`${state.login}:${week.start}`);
    const x = startX + i * BUILDING_W;
    const isCurrent = i === weeks.length - 1;
    const isBest = state.bestWeek?.start === week.start;
    const special = isCurrent || isBest;
    // A quiet week (1–3 contributions) is a little house in the suburbs.
    const quiet = !special && week.total > 0 && week.total <= 3;
    const floors = quiet ? (week.total === 1 ? 1 : 2) : floorsFor(week, maxTotal);

    if (floors === 0) {
      if (isCurrent) drawCrane(canvas, x, BASE_Y);
      else {
        drawPark(canvas, rng, x, look);
        parkDecor(canvas, rng, x, holiday);
      }
      prevShade = -1;
      return;
    }

    let shade = Math.floor(rng() * SHADES.length);
    if (shade === prevShade) shade = (shade + 1) % SHADES.length;
    prevShade = shade;

    const top = drawBuilding(canvas, rng, {
      x,
      floors,
      fill: SHADES[shade]!,
      style: special ? "classic" : quiet ? "house" : pickStyle(floors, rng),
      // Busier weeks keep more lights on; fog swallows half of them.
      lit: (0.08 + 0.74 * (week.activeDays / 7)) * (weather === "fog" ? 0.5 : 1),
      snow: look.snow,
      roofDetails: !special,
    });

    if (isCurrent) drawCrane(canvas, x, top, isBest ? state.topLanguage : null);
    else if (isBest) drawLandmark(canvas, x, top, state.topLanguage);
    else roofDecor(canvas, rng, x, top, holiday);
  });

  return renderCanvas(canvas);
}

// ── Street ───────────────────────────────────────────────────────────────────

function street(state: CityState, season: Season, pet: string): string {
  const snowy = LOOKS[season].snow;
  const road = new RectBatch()
    .add(snowy ? "#e3ebf5" : "var(--pf-window-off)", 0, BASE_Y, W, ROAD_Y - BASE_Y)
    .add("var(--pf-road)", 0, ROAD_Y, W, H - ROAD_Y);
  for (let x = 8; x < W; x += 28) road.add("var(--pf-window-off)", x, 244, 12, 2);

  const lamps = new RectBatch();
  const glows: string[] = [];
  for (let x = 60; x < W; x += 136) {
    lamps.add("var(--pf-road)", x, BASE_Y - 22, 2, 22).add("var(--pf-road)", x, BASE_Y - 22, 7, 2);
    lamps.add("var(--pf-window-on)", x + 4, BASE_Y - 20, 3, 2);
    glows.push(`<ellipse cx="${x + 5}" cy="${BASE_Y - 8}" rx="12" ry="16" fill="url(#pf-lamp)"/>`);
  }

  // Traffic follows the last two weeks: no commits, empty streets.
  const cars = state.activeDays14 === 0 ? 0 : state.activeDays14 <= 4 ? 1 : state.activeDays14 <= 9 ? 2 : 3;
  const lanes = [
    { dir: "r", y: 233, delay: 3 },
    { dir: "l", y: 247, delay: 7 },
    { dir: "r", y: 233, delay: 10 },
  ];
  const traffic = lanes.slice(0, cars).map(({ dir, y, delay }, i) => {
    const palette = { c: CAR_COLORS[i]!, w: "#bde0fe", k: "#111111", y: "#fff3a0", q: "#ff4d4d" };
    const grid = dir === "r" ? CAR : mirror(CAR);
    const beam =
      dir === "r"
        ? `<path class="pf-beam" d="M24 5L58 1V11Z" fill="url(#pf-beam-r)"/>`
        : `<path class="pf-beam" d="M0 5L-34 1V11Z" fill="url(#pf-beam-l)"/>`;
    return `<g class="pf-drive-${dir}" style="animation-delay:-${delay}s"><g transform="translate(0 ${y})">${beam}${renderPixels([{ x: 0, y: 0, grid }], palette, { scale: U })}</g></g>`;
  });

  return `${road}<g class="pf-glow">${glows.join("")}</g>${lamps}${pet}${traffic.join("")}`;
}

// ── Card ─────────────────────────────────────────────────────────────────────

export function renderCityCard(state: CityState, options: RenderOptions = {}): string {
  const rng = seeded(`city:${state.login}`);
  const season = options.season ?? seasonFor(state.date);
  const look = LOOKS[season];
  const holiday = holidayFor(state.date);
  const weather = weatherFor(state.daysSinceLastContribution);
  const current = state.weeks.at(-1);
  const newRecord = !!current && state.bestWeek?.start === current.start && current.total >= 10;
  const celebrating = state.currentStreak >= 30 || newRecord || holiday === "new-year";
  const filter = themeFilter(options.theme);
  const login = escapeXml(state.login);
  const stats = `BEST WEEK ${state.bestWeek?.total ?? 0} · STREAK ${state.currentStreak}D · LONGEST ${state.longestStreak}D`;
  const border = options.hideBorder
    ? ""
    : `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" style="stroke:var(--pf-border)"/>`;
  const desc =
    `A pixel city built from ${state.total} contributions, one building per week, in ${season} under a ` +
    `${moonPhaseName(moonPhase(state.date))}${weather === "clear" ? "" : `, ${weather === "rain" ? "in the rain" : "lost in fog"}`}` +
    `${celebrating ? ", with fireworks" : ""}. Best week: ${state.bestWeek?.total ?? 0}. Current streak: ${state.currentStreak} days.`;

  return `<svg xmlns="http://www.w3.org/2000/svg" class="pf" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="pf-title pf-desc">
<title id="pf-title">${login}'s ProfileForge city</title>
<desc id="pf-desc">${escapeXml(desc)}</desc>
<style>${themeCss(options.theme)}${CSS}</style>
<defs>
  <clipPath id="pf-clip"><rect width="${W}" height="${H}" rx="10"/></clipPath>
  <linearGradient id="pf-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" style="stop-color:var(--pf-city-sky-top)"/>
    <stop offset="1" style="stop-color:var(--pf-city-sky-bottom)"/>
  </linearGradient>
  <radialGradient id="pf-lamp" cy=".2"><stop offset="0" style="stop-color:var(--pf-window-on);stop-opacity:.5"/><stop offset="1" style="stop-color:var(--pf-window-on);stop-opacity:0"/></radialGradient>
  <linearGradient id="pf-beam-r"><stop offset="0" stop-color="#fff3a0" stop-opacity=".55"/><stop offset="1" stop-color="#fff3a0" stop-opacity="0"/></linearGradient>
  <linearGradient id="pf-beam-l" x1="1" x2="0"><stop offset="0" stop-color="#fff3a0" stop-opacity=".55"/><stop offset="1" stop-color="#fff3a0" stop-opacity="0"/></linearGradient>
  <linearGradient id="pf-tail" gradientUnits="userSpaceOnUse" x1="560" y1="34" x2="592" y2="20">
    <stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="pf-fog" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#d7deea" stop-opacity="0"/><stop offset=".5" stop-color="#d7deea"/><stop offset="1" stop-color="#d7deea" stop-opacity="0"/>
  </linearGradient>
  <filter id="pf-glow" x="-30%" y="-60%" width="160%" height="220%">
    <feGaussianBlur stdDeviation="1.6" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
${filter.defs}
<g clip-path="url(#pf-clip)"><g${filter.attr}>
${sky(state, rng, weather)}
${weather === "clear" ? clouds(rng) : overcast(rng)}
${flyers()}
${bats(holiday)}
${celebrating ? fireworks(rng) : ""}
${backdrop(rng)}
${skyline(state, season, holiday, weather)}
${weather === "clear" ? fireflies(look, rng) : ""}
${street(state, season, strollingPet(state.pet))}
${weather === "rain" && season !== "winter" ? rain(rng) : fallingParticles(look, rng)}
${weather === "fog" ? fog() : ""}
</g></g>
${border}
<text x="24" y="36" class="pf-title pf-halo">${login}'s city</text>
<text x="24" y="56" class="pf-sub pf-halo">${state.total.toLocaleString("en-US")} contributions in the last year</text>
<text x="${W - 24}" y="36" text-anchor="end" class="pf-stats pf-halo">${escapeXml(stats)}</text>
</svg>`;
}
