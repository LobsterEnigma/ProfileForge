import { pruneSvgStyle } from "../svg/css.js";
import { seeded, type Rng } from "../random.js";
import { RectBatch } from "../svg/batch.js";
import { escapeXml } from "../svg/escape.js";
import { mirror, renderPixels, type Grid, type Palette } from "../svg/pixel.js";
import { stepped } from "../svg/stepped.js";
import { SPRITE_CSS } from "../pet/sprite.js";
import { themeCss, themeFilter } from "../themes.js";
import { drawBuilding, drawCrane, drawLandmark, drawPark, newCanvas, pickStyle, renderCanvas } from "./buildings.js";
import { bats, EVENTS_CSS, fireworks, holidayFor, parkDecor, roofDecor, type Holiday } from "./events.js";
import { CITY_PET_CSS, strollingPet } from "./pet.js";
import { fog, overcast, rain, WEATHER_CSS, weatherFor, type Weather } from "../world/weather.js";
import { moonPhase, moonPhaseName, pixelCircle, pixelMoon } from "./celestial.js";
import { BASE_Y, H, MAX_FLOORS, MIRROR_Y, QUAY_Y, RIGHT_EDGE, ROAD_Y, U, W, WATER_Y } from "./layout.js";
import { fallingParticles, fireflies, litter, LOOKS, SEASON_CSS, seasonFor, type Hemisphere, type Season } from "../world/seasons.js";
import type { CityState, Week } from "./state.js";

export interface RenderOptions {
  theme?: string;
  hideBorder?: boolean;
  /** Pins a season instead of following the date. */
  season?: Season;
  /** Flips the date-based seasons (and the moon) for the southern hemisphere. */
  hemisphere?: Hemisphere;
}

const SANS = "'Segoe UI',Ubuntu,'Helvetica Neue',sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
const SHADES = ["var(--pf-bldg1)", "var(--pf-bldg2)", "var(--pf-bldg3)", "var(--pf-bldg4)", "var(--pf-bldg5)"];

/** Where the sun sets and the moon rides, so the water can reflect them. */
const SUN = { x: 640, y: 122, r: 30 };
const MOON = { x: 700, y: 70, r: 13 };

/** Round wheels with a light hub, so they read against the dark road. */
const CAR: Grid = [
  "...ccccc....",
  "..cwwcwwc...",
  "qccccccccccy",
  "cccccccccccc",
  "cckkcccckkcc",
  ".kggk..kggk.",
  "..kk....kk..",
];
const CAR_COLORS = ["#e63946", "#4ea8de", "#f4a261"];

/** A little ferry with a row of cabin windows, and a sailboat. */
const FERRY: Grid = ["....ss.......", "..wwwwwwwww..", "..wlwlwlwlw..", "rrrrrrrrrrrrr", ".hhhhhhhhhhh."];
const SAILBOAT: Grid = ["...m....", "..sm....", ".ssm....", "sssm....", "...m....", "hhhhhhh.", ".hhhhh.."];
/** A hot-air balloon drifting over the city by day. */
const BALLOON: Grid = ["..rrrr..", ".ryrryr.", "ryrrrryr", "ryrrrryr", ".ryrryr.", "..rrrr..", "...kk...", "...bb..."];

const CSS = `
.pf-twinkle{transform-box:fill-box;transform-origin:center;animation:pf-twinkle 2.2s ease-in-out infinite}
@keyframes pf-twinkle{0%,100%{opacity:.2}50%{opacity:1}}
.pf-night{opacity:var(--pf-stars)}
.pf-day{opacity:calc(1 - var(--pf-stars))}
.pf-beam{opacity:var(--pf-stars)}
.pf-glow{opacity:var(--pf-stars)}
.pf-rim{opacity:calc(.45 - var(--pf-stars) * .25)}
.pf-sunlit{opacity:calc((1 - var(--pf-stars)) * .14)}
.pf-bloom{opacity:calc(var(--pf-stars) * .55)}
.pf-flicker{animation:pf-flicker 7s linear infinite}
@keyframes pf-flicker{0%,84%,100%{opacity:1}85%,93%{opacity:0}}
.pf-beacon{animation:pf-beacon 1.6s steps(1) infinite}
@keyframes pf-beacon{0%{opacity:1}50%{opacity:.15}100%{opacity:.15}}
.pf-strobe{animation:pf-strobe 1.1s steps(1) infinite}
@keyframes pf-strobe{0%{opacity:1}12%{opacity:0}100%{opacity:0}}
.pf-neon{animation:pf-buzz 6s linear infinite}
@keyframes pf-buzz{0%,90%,94%,97%,100%{opacity:1}91%,95%{opacity:.35}}
.pf-search{animation:pf-search 9s ease-in-out infinite alternate}
@keyframes pf-search{0%{transform:rotate(-32deg)}100%{transform:rotate(30deg)}}
.pf-sign{font:700 8px ${MONO};letter-spacing:.06em}
.pf-drive-r{animation:pf-drive-r 14s linear infinite}
.pf-drive-l{animation:pf-drive-l 18s linear infinite}
@keyframes pf-drive-r{0%{transform:translateX(-60px)}100%{transform:translateX(${W + 60}px)}}
@keyframes pf-drive-l{0%{transform:translateX(${W + 60}px)}100%{transform:translateX(-60px)}}
.pf-sail-r{animation:pf-drive-r 70s linear infinite}
.pf-sail-l{animation:pf-drive-l 95s linear infinite}
.pf-bob{animation:pf-bob 2.4s ease-in-out infinite}
@keyframes pf-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(1px)}}
.pf-fly{animation:pf-fly 38s linear infinite}
@keyframes pf-fly{0%{transform:translateX(${W + 40}px)}100%{transform:translateX(-80px)}}
.pf-flock{animation:pf-flock 46s linear infinite}
@keyframes pf-flock{0%{transform:translateX(-60px)}100%{transform:translateX(${W + 60}px)}}
.pf-balloon{animation:pf-balloon 120s linear infinite}
@keyframes pf-balloon{0%{transform:translate(-40px,8px)}50%{transform:translate(${W / 2}px,-6px)}100%{transform:translate(${W + 40}px,4px)}}
.pf-flap-a{animation:pf-flap-a .6s steps(1) infinite}
.pf-flap-b{opacity:0;animation:pf-flap-b .6s steps(1) infinite}
@keyframes pf-flap-a{0%{opacity:1}50%{opacity:0}100%{opacity:0}}
@keyframes pf-flap-b{0%{opacity:0}50%{opacity:1}100%{opacity:1}}
.pf-shoot{animation:pf-shoot 9s ease-out infinite}
@keyframes pf-shoot{0%{transform:translate(0,0);opacity:0}2%{opacity:1}12%{transform:translate(-170px,74px);opacity:0}100%{transform:translate(-170px,74px);opacity:0}}
.pf-ripple{animation:pf-ripple 2.4s steps(8) infinite}
@keyframes pf-ripple{0%{transform:translate(0,0)}100%{transform:translate(-40px,3px)}}
.pf-wave{animation:pf-wave 7s ease-in-out infinite alternate}
@keyframes pf-wave{0%{transform:translateX(-6px)}100%{transform:translateX(6px)}}
.pf-glint{animation:pf-glint 2.6s steps(1) infinite}
@keyframes pf-glint{0%,100%{opacity:.15}30%{opacity:1}60%{opacity:.5}}
.pf-drop{transform-box:fill-box;transform-origin:center;animation:pf-drop 1.6s ease-out infinite}
@keyframes pf-drop{0%{transform:scale(.2);opacity:.9}100%{transform:scale(1.6);opacity:0}}
${SEASON_CSS}
${WEATHER_CSS}
${EVENTS_CSS}
${CITY_PET_CSS}
${SPRITE_CSS}
.pf-title{font:700 18px ${SANS};fill:var(--pf-city-text)}
.pf-sub{font:400 12px ${SANS};fill:var(--pf-city-muted)}
.pf-chip{font:700 10px ${MONO};fill:var(--pf-city-text);letter-spacing:.05em}
.pf-halo{paint-order:stroke;stroke:var(--pf-city-sky-top);stroke-width:3px;stroke-linejoin:round}
@media (prefers-reduced-motion:reduce){.pf *{animation:none!important}}
`;

export function floorsFor(week: Week, maxTotal: number): number {
  if (week.total <= 0 || maxTotal <= 0) return 0;
  // A soft power curve: quiet weeks stay low, busy ones tower, outliers don't flatten the rest.
  const ratio = (week.total / maxTotal) ** 0.6;
  return Math.max(1, Math.round(1 + (MAX_FLOORS - 1) * ratio));
}

/** A week you showed up on more days builds wider: 10px for one day, up to 16px for all seven. */
export function widthFor(week: Week): number {
  return week.activeDays <= 1 ? 10 : week.activeDays <= 3 ? 12 : week.activeDays <= 5 ? 14 : 16;
}

const px = (grid: Grid, palette: Palette, x: number, y: number, scale = U) => renderPixels([{ x: 0, y: 0, grid }], palette, { x, y, scale });

// ── Sky ──────────────────────────────────────────────────────────────────────

function sky(state: CityState, rng: Rng, weather: Weather, south: boolean, retro: boolean): string {
  const base = `<rect width="${W}" height="${H}" fill="url(#pf-sky)"/>`;
  // Bad weather hides the sun, the moon and the stars.
  if (weather !== "clear") return base;

  const stars = new RectBatch();
  const twinkles: string[] = [];
  for (let i = 0; i < 70; i++) {
    const x = Math.round(rng() * (W - 20)) + 10;
    const y = Math.round(rng() * 150) + 6;
    const size = rng() < 0.12 ? 2 : 1;
    if (rng() < 0.22) {
      twinkles.push(`<rect class="pf-twinkle" style="animation-delay:-${(rng() * 3).toFixed(2)}s" x="${x}" y="${y}" width="2" height="2" fill="#fff"/>`);
    } else {
      stars.add(size === 2 ? "#ffffff" : "#c9d6ff", x, y, size, size);
    }
  }
  // A faint Milky Way across the sky: a diagonal band of dust.
  const dust = new RectBatch();
  for (let i = 0; i < 60; i++) {
    const t = rng();
    const x = Math.round(60 + t * 520 + (rng() - 0.5) * 70);
    const y = Math.round(10 + t * 120 + (rng() - 0.5) * 40);
    dust.add("#dfe6ff", x, y, 1, 1);
  }

  const sun = new RectBatch();
  pixelCircle(sun, "var(--pf-celestial)", SUN.x, SUN.y, SUN.r, 4);
  const halo = (r: number, o: number) => `<circle cx="${SUN.x}" cy="${SUN.y}" r="${r}" style="fill:var(--pf-celestial)" opacity="${o}"/>`;
  const moonHalo = `<circle cx="${MOON.x}" cy="${MOON.y}" r="34" style="fill:var(--pf-celestial)" opacity=".05"/><circle cx="${MOON.x}" cy="${MOON.y}" r="22" style="fill:var(--pf-celestial)" opacity=".08"/>`;

  const shootingStar =
    state.currentStreak >= 7
      ? `<g class="pf-shoot"><line x1="560" y1="34" x2="592" y2="20" stroke="url(#pf-tail)" stroke-width="2"/><rect x="558" y="33" width="3" height="3" fill="#fff"/></g>`
      : "";

  return `${base}
<g class="pf-day">${retro ? "" : `<ellipse cx="${SUN.x}" cy="${BASE_Y}" rx="330" ry="90" fill="url(#pf-horizon)"/>${halo(84, 0.1)}${halo(60, 0.18)}`}${sun}</g>
<g class="pf-night"><g opacity=".35">${dust}</g>${stars}${twinkles.join("")}${moonHalo}${pixelMoon(MOON.x, MOON.y, MOON.r, U, moonPhase(state.date), south)}${shootingStar}</g>`;
}

/** Soft two-tone clouds, lit from below by the setting sun, drifting by in daylight. */
function clouds(rng: Rng): string {
  const out: string[] = [];
  for (let i = 0; i < 5; i++) {
    const s = rng() < 0.4 ? 3 : 2;
    const body = new RectBatch()
      .add("#ffffff", 0, 4 * s, 22 * s, 3 * s)
      .add("#ffffff", 4 * s, s, 10 * s, 4 * s)
      .add("#ffffff", 10 * s, 0, 8 * s, 5 * s)
      .add("#ffffff", 16 * s, 2 * s, 5 * s, 3 * s);
    const lit = new RectBatch().add("var(--pf-celestial)", 2 * s, 7 * s, 18 * s, s);
    const y = 70 + Math.round(rng() * 60);
    const delay = Math.round(rng() * 160);
    out.push(`<g class="pf-drift" style="animation-delay:-${delay}s"><g transform="translate(0 ${y})"><g opacity=".75">${body}</g><g opacity=".55">${lit}</g></g></g>`);
  }
  return `<g class="pf-day">${out.join("")}</g>`;
}

/** A plane crossing the sky with its navigation lights; in fair weather, birds and a hot-air balloon. */
function flyers(weather: Weather): string {
  const plane = new RectBatch()
    .add("var(--pf-bldg1)", 0, 2, 18, 3)
    .add("var(--pf-bldg1)", 14, -1, 3, 3)
    .add("var(--pf-bldg1)", 6, 5, 6, 2);
  const flyingPlane = `<g class="pf-fly" style="animation-delay:-14s"><g transform="translate(0 96)">${plane}
<rect class="pf-beacon" x="8" y="7" width="2" height="2" fill="#ff4d4d"/>
<rect class="pf-beacon" style="animation-delay:-.8s" x="-1" y="3" width="2" height="2" fill="#7dff9b"/>
<rect class="pf-strobe" x="16" y="-2" width="2" height="2" fill="#ffffff"/></g></g>`;

  const bird = (dx: number, dy: number) =>
    `<g transform="translate(${dx} ${dy})"><path class="pf-flap-a" d="M0 0L3 3L6 0"/><path class="pf-flap-b" d="M0 3L3 2L6 3"/></g>`;
  const flock = `<g class="pf-flock" style="animation-delay:-20s"><g transform="translate(0 116)" fill="none" stroke="var(--pf-bldg3)" stroke-width="1.3">${bird(0, 0)}${bird(10, 5)}${bird(-9, 6)}${bird(20, 10)}</g></g>`;
  const balloon = `<g class="pf-balloon" style="animation-delay:-38s"><g transform="translate(0 78)">${px(BALLOON, { r: "#e8505b", y: "#ffd166", k: "#5b3a29", b: "#8a5a33" }, 0, 0, 2)}</g></g>`;

  return weather === "clear" ? `${flyingPlane}<g class="pf-day">${flock}${balloon}</g>` : flyingPlane;
}

// ── The far side of the bay ─────────────────────────────────────────────────

/** Hills on the horizon and a hazy far-off city, with a few lights and blinking masts at night. */
function farside(rng: Rng): string {
  const hills = stepped("var(--pf-city-hill)", 0, W, (x) => BASE_Y - Math.round(40 + 16 * Math.sin(x / 90) + 9 * Math.sin(x / 31 + 1)), () => BASE_Y);
  const blocks = new RectBatch();
  const lights = new RectBatch();
  const masts: string[] = [];
  let x = 0;
  while (x < W) {
    const w = 8 + Math.round(rng() * 14);
    const h = 26 + Math.round(rng() ** 1.7 * 62);
    const mast = silhouette(blocks, "var(--pf-city-haze)", rng, x, w, h);
    for (let i = 0; i < Math.round(h / 20); i++) {
      lights.add("var(--pf-window-on)", x + 2 + Math.round(rng() * (w - 4)), BASE_Y - h + 4 + Math.round(rng() * (h - 8)), 1, 1);
    }
    if (mast && masts.length < 4) masts.push(`<rect class="pf-beacon" style="animation-delay:-${(rng() * 1.6).toFixed(2)}s" x="${mast.x}" y="${mast.y - 2}" width="2" height="2" fill="#ff4d4d"/>`);
    x += w + (rng() < 0.3 ? 3 : 0);
  }
  return (
    `<g opacity=".7">${hills}</g><g id="pf-far" opacity=".62">${blocks}</g>` +
    `<rect x="0" y="${BASE_Y - 100}" width="${W}" height="100" fill="url(#pf-farwin)" mask="url(#pf-farmask)"/>` +
    `<g class="pf-night" opacity=".7">${lights}${masts.join("")}</g>${tvTower()}` +
    // Haze settling between the far side and the city.
    `<rect x="0" y="${BASE_Y - 70}" width="${W}" height="70" fill="url(#pf-haze)"/>` +
    midtown(rng)
  );
}

/**
 * A distant tower's outline: a body, sometimes set back halfway up, crowned with a spire, an
 * antenna, steps, a slanted top or a dome. Returns where a mast's warning light goes, if any.
 */
function silhouette(b: RectBatch, fill: string, rng: Rng, x: number, w: number, h: number): { x: number; y: number } | null {
  let tx = x;
  let tw = w;
  const top = BASE_Y - h;
  if (w >= 10 && rng() < 0.35) {
    const lower = Math.round(h * (0.45 + rng() * 0.25));
    const inset = 2 + Math.floor(rng() * (w / 5));
    tx = x + inset;
    tw = w - 2 * inset;
    b.add(fill, x, BASE_Y - lower, w, lower).add(fill, tx, top, tw, h - lower);
  } else b.add(fill, x, top, w, h);
  const cx = tx + Math.floor(tw / 2);
  const crown = rng();
  if (crown < 0.16 && h > 50) {
    b.add(fill, cx - 1, top - 4, 2, 4).add(fill, cx, top - 12, 1, 8); // spire
    return { x: cx - 1, y: top - 12 };
  }
  if (crown < 0.3) {
    b.add(fill, tx + tw - 3, top - 7, 1, 7); // antenna
    return h > 60 ? { x: tx + tw - 4, y: top - 7 } : null;
  }
  if (crown < 0.44 && tw >= 8) b.add(fill, tx + 2, top - 3, tw - 4, 3).add(fill, tx + 4, top - 5, tw - 8, 2); // steps
  else if (crown < 0.56) for (let i = 0; i < tw; i += 2) b.add(fill, tx + i, top - Math.round((tw - i) / 2.5), 2, Math.round((tw - i) / 2.5)); // slant
  else if (crown < 0.64 && tw >= 8) b.add(fill, tx + 2, top - 2, tw - 4, 2).add(fill, tx + 3, top - 4, tw - 6, 2).add(fill, cx - 1, top - 6, 2, 2); // dome
  else if (crown < 0.8) b.add(fill, tx + 1, top - 2, Math.max(2, Math.floor(tw / 3)), 2); // a rooftop box
  return null;
}

/**
 * A middle distance between the far haze and the skyline: towers half-lost in the dusk with
 * faint rows of windows, and at night a sea of small lit windows, floor by floor.
 */
function midtown(rng: Rng): string {
  const blocks = new RectBatch();
  const windows = new RectBatch();
  let x = -4;
  while (x < W) {
    const w = 10 + Math.round(rng() * 14);
    const h = 34 + Math.round(rng() ** 1.4 * 56);
    silhouette(blocks, "var(--pf-bldg2)", rng, x, w, h);
    for (let y = BASE_Y - h + 4; y < BASE_Y - 4; y += 5) {
      if (rng() > 0.34) continue;
      const from = x + 2 + Math.floor(rng() * (w - 4) / 4) * 4;
      const run = 1 + Math.floor(rng() * 4);
      for (let i = 0; i < run && from + i * 4 < x + w - 3; i++) windows.add("var(--pf-window-on)", from + i * 4 + 1, y + 1, 2, 2);
    }
    x += w + (rng() < 0.4 ? 3 : 0);
  }
  return (
    `<g opacity=".72"><g id="pf-mid">${blocks}</g></g>` +
    `<rect class="pf-day" x="0" y="${BASE_Y - 110}" width="${W}" height="110" fill="url(#pf-midwin)" mask="url(#pf-midmask)"/>` +
    `<g class="pf-night" opacity=".42">${windows}</g>` +
    `<rect x="0" y="${BASE_Y - 40}" width="${W}" height="40" fill="url(#pf-haze)" opacity=".6"/>`
  );
}

/**
 * A TV tower on the far side of the city, off to the left: a tapering lattice shaft, an
 * observation deck and a spire. At night the deck's windows glow and red lights blink on the
 * spire, nothing more.
 */
function tvTower(): string {
  const cx = 150;
  const top = BASE_Y - 104;
  const deckY = BASE_Y - 70;
  const shaft = new RectBatch();
  for (let y = deckY + 6; y < BASE_Y; y += 2) {
    const half = Math.round(2 + ((y - deckY) / (BASE_Y - deckY)) * 6);
    shaft.add("var(--pf-city-haze)", cx - half, y, half * 2, 2);
  }
  shaft
    .add("var(--pf-city-haze)", cx - 2, top + 14, 4, deckY - top - 14)
    .add("var(--pf-city-haze)", cx - 9, deckY, 18, 6)
    .add("var(--pf-city-haze)", cx - 6, deckY - 2, 12, 2)
    .add("var(--pf-city-haze)", cx - 5, top + 20, 10, 3)
    .add("var(--pf-city-haze)", cx - 1, top, 2, 14);
  // Cross-bracing on the lower shaft, a shade lighter.
  const lattice = new RectBatch();
  for (let y = deckY + 10; y < BASE_Y - 4; y += 8) lattice.add("#ffffff", cx - 1, y, 2, 1);
  const windows = new RectBatch();
  for (let x = cx - 7; x < cx + 7; x += 3) windows.add("#ffe6a8", x, deckY + 2, 2, 2);
  windows.add("#ffe6a8", cx - 3, top + 21, 2, 1).add("#ffe6a8", cx + 1, top + 21, 2, 1);
  return (
    `<g opacity=".92">${shaft}<g opacity=".08">${lattice}</g></g>` +
    `<g class="pf-night"><g opacity=".8">${windows}</g><rect class="pf-beacon" x="${cx - 1}" y="${top - 2}" width="2" height="2" fill="#ff4d4d"/><rect class="pf-beacon" style="animation-delay:-.8s" x="${cx - 1}" y="${top + 8}" width="2" height="2" fill="#ff4d4d"/></g>`
  );
}

// ── Skyline ──────────────────────────────────────────────────────────────────

function skyline(state: CityState, season: Season, holiday: Holiday | null, weather: Weather): string {
  const canvas = newCanvas();
  const look = LOOKS[season];
  const weeks = state.weeks;
  const maxTotal = Math.max(0, ...weeks.map((w) => w.total));
  const widths = weeks.map(widthFor);
  let x = RIGHT_EDGE - widths.reduce((a, b) => a + b, 0);
  let prevShade = -1;

  weeks.forEach((week, i) => {
    // Seeded per week: a building keeps its look as the year scrolls left.
    const rng = seeded(`${state.login}:${week.start}`);
    const w = widths[i]!;
    const bx = x;
    x += w;
    if (bx + w < 0) return;
    const isCurrent = i === weeks.length - 1;
    const isBest = state.bestWeek?.start === week.start;
    const special = isCurrent || isBest;
    // A quiet week (1–3 contributions) is a little house in the suburbs.
    const quiet = !special && week.total > 0 && week.total <= 3;
    const floors = quiet ? (week.total === 1 ? 1 : 2) : floorsFor(week, maxTotal);

    if (floors === 0) {
      if (isCurrent) drawCrane(canvas, bx, BASE_Y);
      else {
        drawPark(canvas, rng, bx, w, look);
        parkDecor(canvas, rng, bx, w, holiday);
      }
      prevShade = -1;
      return;
    }

    let shade = Math.floor(rng() * SHADES.length);
    if (shade === prevShade) shade = (shade + 1) % SHADES.length;
    prevShade = shade;

    const top = drawBuilding(canvas, rng, {
      x: bx,
      w,
      floors,
      fill: SHADES[shade]!,
      style: special ? "classic" : quiet ? "house" : pickStyle(floors, rng),
      // Busier weeks keep more lights on; fog swallows half of them.
      lit: (0.08 + 0.74 * (week.activeDays / 7)) * (weather === "fog" ? 0.5 : 1),
      snow: look.snow,
      roofDetails: !special,
    });

    if (isCurrent) drawCrane(canvas, bx, top, isBest ? state.topLanguage : null);
    else if (isBest) drawLandmark(canvas, bx, w, top, state.topLanguage);
    else roofDecor(canvas, rng, bx, w, top, holiday);
  });

  // At night the lit windows glow softly.
  return `${renderCanvas(canvas)}<use href="#pf-lit" class="pf-bloom" filter="url(#pf-bloom)"/>`;
}

// ── The quay: sidewalk, lamps, the road and the seawall ─────────────────────

function quay(state: CityState, season: Season, pet: string): string {
  const snowy = LOOKS[season].snow;
  const ground = new RectBatch()
    .add(snowy ? "#e3ebf5" : "var(--pf-window-off)", 0, BASE_Y, W, ROAD_Y - BASE_Y)
    .add("var(--pf-road)", 0, ROAD_Y, W, QUAY_Y - ROAD_Y);
  // The seawall: a pale stone coping, then a stone face dropping to the water, so the
  // bay clearly lies below the road.
  const wall = new RectBatch().add("var(--pf-city-quay)", 0, QUAY_Y, W, WATER_Y - QUAY_Y);
  const coping = new RectBatch().add("#ffffff", 0, QUAY_Y, W, 2);
  // A shadow under the coping's lip, then courses of stone.
  const joints = new RectBatch().add("#000000", 0, QUAY_Y + 2, W, 1).add("#000000", 0, QUAY_Y + 6, W, 1).add("#000000", 0, WATER_Y - 1, W, 1);
  for (let x = 0; x < W; x += 16) joints.add("#000000", x, QUAY_Y + 3, 1, 3).add("#000000", x + 8, QUAY_Y + 7, 1, WATER_Y - QUAY_Y - 7);
  const curb = new RectBatch().add("#ffffff", 0, BASE_Y, W, 1).add("#000000", 0, ROAD_Y, W, 1);
  // A dashed center line splits the two lanes.
  const lane = new RectBatch();
  for (let x = 6; x < W; x += 26) lane.add("#f2e3a8", x, ROAD_Y + 7, 12, 1);
  // Bollards along the coping.
  const bollards = new RectBatch();
  for (let x = 20; x < W; x += 40) bollards.add("var(--pf-road)", x, QUAY_Y - 2, 2, 3);

  const lamps = new RectBatch();
  const glows: string[] = [];
  for (let x = 60; x < W; x += 120) {
    lamps.add("var(--pf-road)", x, BASE_Y - 20, 2, 22).add("var(--pf-road)", x, BASE_Y - 20, 7, 2);
    lamps.add("var(--pf-window-on)", x + 4, BASE_Y - 18, 3, 2);
    glows.push(`<ellipse cx="${x + 5}" cy="${BASE_Y - 6}" rx="13" ry="16" fill="url(#pf-lamp)"/>`);
  }

  // Traffic follows the last two weeks: no commits, empty streets.
  const cars = state.activeDays14 === 0 ? 0 : state.activeDays14 <= 4 ? 1 : state.activeDays14 <= 9 ? 2 : 3;
  const lanes = [
    { dir: "r", y: ROAD_Y - 2, delay: 3 },
    { dir: "l", y: ROAD_Y, delay: 7 },
    { dir: "r", y: ROAD_Y - 2, delay: 10 },
  ];
  const traffic = lanes.slice(0, cars).map(({ dir, y, delay }, i) => {
    const palette = { c: CAR_COLORS[i]!, w: "#bde0fe", k: "#0b0b0f", g: "#c3c8d0", y: "#fff3a0", q: "#ff4d4d" };
    const grid = dir === "r" ? CAR : mirror(CAR);
    const beam =
      dir === "r"
        ? `<path class="pf-beam" d="M24 5L58 1V11Z" fill="url(#pf-beam-r)"/>`
        : `<path class="pf-beam" d="M0 5L-34 1V11Z" fill="url(#pf-beam-l)"/>`;
    return `<g class="pf-drive-${dir}" style="animation-delay:-${delay}s"><g transform="translate(0 ${y})">${beam}${renderPixels([{ x: 0, y: 0, grid }], palette, { scale: U })}</g></g>`;
  });

  return (
    `${ground}<g opacity=".14">${curb}</g><g opacity=".5">${lane}</g>${litter(LOOKS[season], seeded(`litter:${state.login}`))}` +
    `<g class="pf-glow">${glows.join("")}</g>${lamps}${pet}${traffic.join("")}` +
    `${wall}<g opacity=".35">${coping}</g><g opacity=".3">${joints}</g>${bollards}`
  );
}

// ── The bay ──────────────────────────────────────────────────────────────────

function bay(rng: Rng, season: Season, weather: Weather): string {
  const h = H - WATER_Y;
  const water = `<rect x="0" y="${WATER_Y}" width="${W}" height="${h}" fill="url(#pf-water)"/>`;
  // The whole waterfront, upside down, broken into ripples and fading with depth.
  const reflection =
    `<g mask="url(#pf-reflect)" opacity=".6"><use href="#pf-city" transform="matrix(1 0 0 -1 0 ${BASE_Y + MIRROR_Y})"/></g>` +
    // The seawall's own dark reflection, right under it, and water lapping at its foot.
    `<rect x="0" y="${WATER_Y}" width="${W}" height="${MIRROR_Y - WATER_Y}" style="fill:var(--pf-city-quay)" opacity=".55"/>` +
    `<g class="pf-wave" opacity=".3"><rect x="-10" y="${WATER_Y}" width="${W + 20}" height="1" fill="#ffffff"/></g>`;

  // Light on the water: the sun's or the moon's path, and long slow waves.
  const path = (cx: number, color: string, spread: number) => {
    const out: string[] = [];
    for (let i = 0; i < 9; i++) {
      const y = WATER_Y + 3 + i * 5 + Math.round(rng() * 2);
      const w = 6 + Math.round(rng() * spread * (0.4 + i / 12));
      const x = Math.round(cx - w / 2 + (rng() - 0.5) * (6 + i * 2));
      out.push(`<rect class="pf-glint" style="animation-delay:-${(rng() * 2.6).toFixed(2)}s;fill:${color}" x="${x}" y="${y}" width="${w}" height="1"/>`);
    }
    return out.join("");
  };
  const waves = new RectBatch();
  for (let i = 0; i < 26; i++) {
    const y = WATER_Y + 4 + Math.round(rng() * (h - 8));
    waves.add("#ffffff", Math.round(rng() * W), y, 8 + Math.round(rng() * 22), 1);
  }

  // A ferry with its cabin lights, and a sailboat by day.
  const ferry = `<g class="pf-sail-r" style="animation-delay:-22s"><g transform="translate(0 ${WATER_Y + 12})"><g class="pf-bob">${px(FERRY, { s: "#3a3f55", w: "#f1f3f5", l: "var(--pf-window-on)", r: "#c0392b", h: "#23263b" }, 0, 0, 2)}</g><rect x="-10" y="11" width="10" height="1" fill="#ffffff" opacity=".5"/></g></g>`;
  const sailboat = weather !== "clear" ? "" : `<g class="pf-day"><g class="pf-sail-l" style="animation-delay:-60s"><g transform="translate(0 ${WATER_Y + 30})"><g class="pf-bob" style="animation-delay:-1s">${px(SAILBOAT, { s: "#fdfcf7", m: "#6b4b2a", h: "#2c4a5e" }, 0, 0, 2)}</g></g></g></g>`;

  const winter = season === "winter" ? `<rect x="0" y="${WATER_Y}" width="${W}" height="${h}" fill="#eef4fb" opacity=".22"/>` : "";
  const drops =
    weather === "rain"
      ? Array.from({ length: 10 }, () => `<ellipse class="pf-drop" style="animation-delay:-${(rng() * 1.6).toFixed(2)}s" cx="${Math.round(rng() * W)}" cy="${WATER_Y + 6 + Math.round(rng() * (h - 10))}" rx="5" ry="1.5" fill="none" stroke="#dbe7ff" stroke-width=".8"/>`).join("")
      : "";
  const lights =
    weather === "clear"
      ? `<g class="pf-day">${path(SUN.x, "var(--pf-celestial)", 60)}</g><g class="pf-night">${path(MOON.x, "#fff4d6", 26)}</g>`
      : "";

  return (
    `${water}${reflection}` +
    `<g class="pf-wave" opacity=".14">${waves}</g>${lights}${winter}${drops}${ferry}${sailboat}`
  );
}

// ── Heads-up display ─────────────────────────────────────────────────────────

const TROPHY: Grid = ["y.yyy.y", "y.yyy.y", ".yyyyy.", "..yyy..", "...y...", "..yyy..", ".yyyyy."];
const FLAME: Grid = ["...o...", "..oo...", "..ooo..", ".ooyoo.", ".oyyyo.", ".oyyyo.", "..ooo.."];
const STAR: Grid = ["...y...", "..yyy..", "yyyyyyy", ".yyyyy.", "..yyy..", ".yy.yy.", ".y...y."];

/** Stats as little pills with pixel icons, right-aligned under the top edge. */
function chips(state: CityState): string {
  const items: [Grid, string][] = [
    [TROPHY, `BEST WEEK ${state.bestWeek?.total ?? 0}`],
    [FLAME, `STREAK ${state.currentStreak}D`],
    [STAR, `LONGEST ${state.longestStreak}D`],
  ];
  const palette = { y: "#ffd166", o: "#ff7a45" };
  let right = W - 20;
  const out: string[] = [];
  for (const [icon, label] of items.reverse()) {
    const w = Math.round(label.length * 6.1 + 26);
    const x = right - w;
    out.unshift(
      `<g><rect x="${x}" y="20" width="${w}" height="18" rx="9" fill="#0b0f1e" fill-opacity=".38"/>` +
        `${px(icon, palette, x + 7, 24, 1.5)}<text x="${x + 20}" y="32.5" class="pf-chip">${escapeXml(label)}</text></g>`,
    );
    right = x - 6;
  }
  return out.join("");
}

// ── Card ─────────────────────────────────────────────────────────────────────

export function renderCityCard(state: CityState, options: RenderOptions = {}): string {
  const rng = seeded(`city:${state.login}`);
  const season = options.season ?? seasonFor(state.date, options.hemisphere);
  const look = LOOKS[season];
  const holiday = holidayFor(state.date);
  const weather = weatherFor(state.daysSinceLastContribution);
  const current = state.weeks.at(-1);
  const newRecord = !!current && state.bestWeek?.start === current.start && current.total >= 10;
  const celebrating = state.currentStreak >= 30 || newRecord || holiday === "new-year";
  const filter = themeFilter(options.theme);
  const login = escapeXml(state.login);
  const border = options.hideBorder
    ? ""
    : `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" style="stroke:var(--pf-border)"/>`;
  const desc =
    `A pixel city on the water built from ${state.total} contributions, one building per week, in ${season} under a ` +
    `${moonPhaseName(moonPhase(state.date))}${weather === "clear" ? "" : `, ${weather === "rain" ? "in the rain" : "lost in fog"}`}` +
    `${celebrating ? ", with fireworks" : ""}. Best week: ${state.bestWeek?.total ?? 0}. Current streak: ${state.currentStreak} days.`;
  const h = H - WATER_Y;

  return pruneSvgStyle(`<svg xmlns="http://www.w3.org/2000/svg" class="pf" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="pf-title pf-desc">
<title id="pf-title">${login}'s ProfileForge city</title>
<desc id="pf-desc">${escapeXml(desc)}</desc>
<style>${themeCss(options.theme)}${CSS}</style>
<defs>
  <clipPath id="pf-clip"><rect width="${W}" height="${H}" rx="10"/></clipPath>
  <linearGradient id="pf-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" style="stop-color:var(--pf-city-sky-top)"/>
    <stop offset=".72" style="stop-color:var(--pf-city-sky-bottom)"/>
  </linearGradient>
  <radialGradient id="pf-horizon"><stop offset="0" style="stop-color:var(--pf-celestial);stop-opacity:.55"/><stop offset="1" style="stop-color:var(--pf-celestial);stop-opacity:0"/></radialGradient>
  <linearGradient id="pf-water" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" style="stop-color:var(--pf-city-water)"/>
    <stop offset="1" style="stop-color:var(--pf-city-water-deep)"/>
  </linearGradient>
  <linearGradient id="pf-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity=".05"/></linearGradient>
  <pattern id="pf-ripples" width="40" height="3" patternUnits="userSpaceOnUse"><rect x="4" y="2" width="22" height="1" fill="#000"/><rect x="30" y="1" width="7" height="1" fill="#000"/></pattern>
  <mask id="pf-reflect" maskUnits="userSpaceOnUse" x="0" y="${WATER_Y}" width="${W}" height="${h}">
    <rect x="0" y="${WATER_Y}" width="${W}" height="${h}" fill="url(#pf-fade)"/>
    <g class="pf-ripple"><rect x="0" y="${WATER_Y - 3}" width="${W + 40}" height="${h + 6}" fill="url(#pf-ripples)"/></g>
  </mask>
  <radialGradient id="pf-lamp" cy=".2"><stop offset="0" style="stop-color:var(--pf-window-on);stop-opacity:.5"/><stop offset="1" style="stop-color:var(--pf-window-on);stop-opacity:0"/></radialGradient>
  <linearGradient id="pf-searchlight" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff6d0" stop-opacity=".35"/><stop offset="1" stop-color="#fff6d0" stop-opacity="0"/></linearGradient>
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
  <linearGradient id="pf-volume" gradientUnits="userSpaceOnUse" x1="0" y1="70" x2="0" y2="${BASE_Y}"><stop offset="0" stop-color="#fff" stop-opacity=".08"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".34"/></linearGradient>
  <linearGradient id="pf-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--pf-city-sky-bottom);stop-opacity:0"/><stop offset="1" style="stop-color:var(--pf-city-sky-bottom);stop-opacity:.55"/></linearGradient>
  <pattern id="pf-farwin" width="3" height="4" patternUnits="userSpaceOnUse"><rect x="1" y="1" width="1" height="2" fill="#fff" opacity=".13"/></pattern>
  <pattern id="pf-midwin" width="4" height="5" patternUnits="userSpaceOnUse"><rect x="1" y="1" width="2" height="2" fill="#fff" opacity=".1"/></pattern>
  <mask id="pf-farmask" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${BASE_Y}"><use href="#pf-far"/></mask>
  <mask id="pf-midmask" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${BASE_Y}"><use href="#pf-mid"/></mask>
  <mask id="pf-wallmask" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${BASE_Y}"><use href="#pf-walls"/></mask>
  <filter id="pf-bloom" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.5"/></filter>
</defs>
${filter.defs}
<g clip-path="url(#pf-clip)"><g${filter.attr}>
${sky(state, rng, weather, options.hemisphere === "south", options.theme === "gameboy")}
${weather === "clear" ? clouds(rng) : overcast(rng)}
${flyers(weather)}
${bats(holiday)}
${celebrating ? fireworks(rng) : ""}
<g id="pf-city">${farside(rng)}${skyline(state, season, holiday, weather)}</g>
${weather === "clear" ? fireflies(look, rng) : ""}
${quay(state, season, strollingPet(state.pet))}
${bay(rng, season, weather)}
${weather === "rain" && season !== "winter" ? rain(rng) : fallingParticles(look, rng)}
${weather === "fog" ? fog() : ""}
</g></g>
${border}
<text x="24" y="36" class="pf-title pf-halo">${login}'s city</text>
<text x="24" y="56" class="pf-sub pf-halo">${state.total.toLocaleString("en-US")} contributions in the last year</text>
${chips(state)}
</svg>`);
}

