/**
 * The crab's beach. The sea has depth (haze on the horizon, deep blue far out, turquoise
 * shallows), glints and slow swells; near the shore a wave curls, breaks, and its swash runs up
 * the sand with a lacy foam edge, soaks in and leaves wet sand behind. A palm leans over the
 * left edge, gulls glide by in the day, and at night the moon lays a shimmering path on the water.
 */
import { RectBatch } from "../svg/batch.js";
import { renderPixels, type Grid, type Palette } from "../svg/pixel.js";
import { stepped } from "../svg/stepped.js";
import type { Area } from "../world/seasons.js";

/** The horizon sits this far above the ground line; the sea fills everything in between. */
const HORIZON = 26;

/** Bands of sea from the horizon down: [height, colour]. */
const BANDS: readonly (readonly [number, string])[] = [
  [2, "#b9def2"], // haze where sea meets sky
  [4, "#2c6aa8"],
  [6, "#3180c2"],
  [6, "#3a95d4"],
  [5, "#4aabde"],
  [3, "#72cbe5"], // shallows, reaching the sand
];

/** Glints on the water: [dx, dy below the horizon, width, delay]. Smaller far out. */
const GLINTS: readonly (readonly [number, number, number, number])[] = [
  [30, 4, 2, 0], [96, 3, 2, 1.1], [150, 5, 2, 2.3], [178, 3, 1, 0.6],
  [12, 9, 3, 1.7], [70, 10, 3, 0.3], [128, 8, 3, 2.8], [188, 11, 2, 1.4],
  [44, 15, 4, 2.1], [110, 16, 3, 0.9], [164, 14, 4, 3.2],
  [22, 20, 4, 1.2], [84, 21, 5, 2.6], [146, 20, 4, 0.1],
];

/** Swell lines drifting on the water: [dx, dy, width]. */
const SWELLS: readonly (readonly [number, number, number])[] = [
  [8, 8, 18], [62, 7, 26], [120, 9, 20], [170, 8, 16],
  [26, 14, 24], [92, 13, 30], [150, 15, 22],
  [4, 19, 20], [60, 19, 28], [124, 20, 26], [180, 19, 14],
];

/** How far each 2px column of the breaking crest hangs down, so it isn't a ruler-straight line. */
const LACE = [0, 1, 2, 2, 1, 0, 1, 3, 2, 1, 0, 0, 1, 2, 3, 2, 1, 1, 0, 1, 2, 1, 0, 2];

/** The swash's edge at column x: soft lobes, a long wave and a short one, snapped to pixels. */
const lobe = (x: number, phase: number) => Math.round(2.4 * Math.sin(x / 14 + phase) + 1.2 * Math.sin(x / 5.5 + phase * 2.3));

/** A leaning coconut palm. */
const PALM: Grid = [
  "......lll.........",
  "...llLLLLLll.lll..",
  ".lLLL.lLLLlLLLLLl.",
  "lLL..lLL.cLLl..LLl",
  "L...lL..cCtLL...LL",
  "L..lL....ttlL....L",
  "...L.....Tt.L.....",
  "..L......tt..L....",
  ".........tT.......",
  "........tt........",
  "........Tt........",
  ".......tt.........",
  ".......tT.........",
  "......tt..........",
  "......Tt..........",
  "......tt..........",
  "......tT..........",
  ".....ttt..........",
]
const PALM_COLORS: Palette = { L: "#2b7a3d", l: "#48a854", t: "#9a6b3f", T: "#6f4a2a", c: "#6b4226", C: "#8a5a33" };

const STARFISH: Grid = ["..s..", ".sSs.", "sSSSs", ".s.s.", "s...s"];
const SHELL: Grid = ["..p..", ".pPp.", "pPpPp", "ppppp"];

/** A gull with its wings up, and down. */
const GULL_UP: Grid = ["g.....g", ".w...w.", "..www.."];
const GULL_DOWN: Grid = ["..www..", ".w...w.", "g.....g"];
const GULL_COLORS: Palette = { w: "#f8f9fa", g: "#6c757d" };

const band = (fill: string, left: number, w: number, top: (x: number) => number, bottom: (x: number) => number) => stepped(fill, left, w, top, bottom);

const px = (grid: Grid, palette: Palette, x: number, y: number, scale = 2) => renderPixels([{ x: 0, y: 0, grid }], palette, { x, y, scale });

/** The palm, starfish, shell and sand grains; drawn before the sea so the palm's base sits on sand. */
export function beachProps(area: Area): string {
  const g = area.ground;
  const left = area.x;
  const right = area.x + area.w;
  const grains = new RectBatch();
  // Grains of sand: a darker and a lighter speck here and there.
  for (const [dx, dy, dark] of [
    [14, 8, 1], [40, 22, 0], [58, 12, 1], [76, 26, 0], [102, 18, 1], [124, 28, 1], [140, 10, 0], [158, 24, 1], [184, 14, 0], [192, 28, 1], [30, 30, 1], [88, 8, 0],
  ] as const) {
    grains.add(dark ? "var(--pf-ground-dark)" : "#fff3d6", left + dx, g + dy, 2, dark ? 2 : 1);
  }
  return (
    grains.toString() +
    px(STARFISH, { s: "#f4845f", S: "#f9a47f" }, left + 18, g + 12) +
    px(SHELL, { p: "#f7c6d9", P: "#e39bb6" }, right - 32, g + 16)
  );
}

/** The palm leaning over the sea from the left; drawn after the sea. */
function palm(area: Area): string {
  return px(PALM, PALM_COLORS, area.x - 8, area.ground + 8 - PALM.length * 3, 3);
}

export function beachAmbient(area: Area, night: boolean): { svg: string; css: string } {
  const g = area.ground;
  const left = area.x;
  const w = area.w;
  const top = g - HORIZON;

  // The sea, band by band.
  const sea = new RectBatch();
  let y = top;
  for (const [h, color] of BANDS) {
    sea.add(color, left, y, w, h);
    y += h;
  }
  const swells = new RectBatch();
  for (const [dx, dy, sw] of SWELLS) swells.add(dy < 12 ? "#285f99" : "#3486c4", left + dx, top + dy, sw, 1);
  for (const [dx, dy, sw] of SWELLS) swells.add(dy < 12 ? "#4d9bd6" : "#6cc0e8", left + dx + 3, top + dy + 1, sw - 6, 1);
  const glints = GLINTS.map(
    ([dx, dy, gw, d]) => `<rect class="pf-bch-glint" style="animation-delay:-${d}s" x="${left + dx}" y="${top + dy}" width="${gw}" height="1" fill="#f1fbff"/>`,
  ).join("");
  // At night the water darkens and the moon (over the left of the sky) lays a path of light on it.
  const dark = `<rect class="pf-bch-dark" x="${left}" y="${top}" width="${w}" height="${HORIZON}" fill="#0b1638"${night ? ` style="opacity:.55"` : ""}/>`;
  const moonPath = night
    ? [[3, 8, 0], [5, 6, 0.7], [8, 10, 1.3], [11, 7, 0.4], [14, 12, 1.8], [17, 9, 1.0], [20, 14, 0.2], [23, 10, 1.5]]
        .map(([dy, mw, d]) => `<rect class="pf-bch-glint" style="animation-delay:-${d}s" x="${left + 36 - mw! / 2 + ((dy! * 3) % 5) - 2}" y="${top + dy!}" width="${mw}" height="1" fill="#fff1b8"/>`)
        .join("")
    : "";

  // A wave curls up just off the shore and breaks.
  const crest = new RectBatch();
  for (let x = 0; x < w; x += 2) if (LACE[(x / 2 + 5) % LACE.length] === 3) crest.add("#e3f6fc", left + x, g - 6, 2, 2);
  const crestLine = band("#ffffff", left, w, () => g - 4, (x) => g - 3 + (LACE[(x / 2 + 5) % LACE.length]! > 1 ? 1 : 0));
  const breaker = `<g class="pf-bch-crest">${crestLine}${crest}</g>`;

  // Its swash: a sheet of water whose foamy edge runs up the sand in soft lobes, then soaks away.
  const swash = (reach: number, delay: number, phase: number) => {
    const edge = (x: number) => g + lobe(x, phase);
    const streaks = new RectBatch();
    for (let i = 0; i < 9; i++) {
      const x = Math.round((i * 23 + phase * 17) % (w - 8));
      streaks.add("#f4fcff", left + x, edge(x) - 5 - ((i * 5) % 4), 4 + (i % 3) * 2, 1);
    }
    const sheet = band("#a6e0f0", left, w, () => g - 14, edge);
    const foam = band("#dff4fb", left, w, (x) => edge(x) - 3, (x) => edge(x) - 1) + band("#ffffff", left, w, (x) => edge(x) - 1, (x) => edge(x) + 1);
    // The sand it wets, shaped like the edge at its furthest.
    const wet = band("#5c4a2e", left, w, () => g, (x) => g + Math.max(1, reach + lobe(x, phase)));
    return (
      `<g class="pf-bch-wet" style="animation-delay:-${delay}s">${wet}</g>` +
      `<g clip-path="url(#pf-bch-shore)"><g class="pf-bch-swash" style="--reach:${reach}px;animation-delay:-${delay}s"><g opacity=".55">${sheet}</g>${foam}${streaks}</g></g>`
    );
  };

  const gull = night
    ? ""
    : `<g class="pf-bch-gull-sky" transform="translate(0 ${area.y + 34})"><g class="pf-bch-gull"><g class="pf-fa" style="animation-duration:.9s">${px(GULL_UP, GULL_COLORS, 0, 0)}</g><g class="pf-fb" style="animation-duration:.9s">${px(GULL_DOWN, GULL_COLORS, 0, 0)}</g></g></g>`;

  const surf = `<g class="pf-bch-surf">${swash(9, 0, 0)}${swash(5, 3.6, 2.4)}${breaker}</g>`;
  const svg =
    `<clipPath id="pf-bch-shore"><rect x="${left}" y="${g - 2}" width="${w}" height="${HORIZON}"/></clipPath>` +
    sea + swells + `<g class="pf-bch-drift">${glints}</g>` + dark + moonPath +
    surf + palm(area) + gull;

  const css = `.pf-bch-dark{opacity:calc(var(--pf-stars) * .55)}
.pf-bch-surf{opacity:calc(1 - var(--pf-stars) * .3)}
.pf-bch-gull-sky{opacity:calc(1 - var(--pf-stars))}
.pf-bch-glint{opacity:0;animation:pf-bch-glint 3s steps(1) infinite}
@keyframes pf-bch-glint{0%,100%{opacity:0}20%{opacity:.95}45%{opacity:.4}70%{opacity:0}}
.pf-bch-drift{animation:pf-bch-drift 9s ease-in-out infinite}
@keyframes pf-bch-drift{0%,100%{transform:translateX(0)}50%{transform:translateX(4px)}}
.pf-bch-swash{animation:pf-bch-swash 7.2s infinite}
@keyframes pf-bch-swash{0%{transform:translateY(0);opacity:1;animation-timing-function:cubic-bezier(.2,.7,.3,1)}38%{transform:translateY(var(--reach));opacity:1;animation-timing-function:ease-in-out}55%{transform:translateY(var(--reach));opacity:.9;animation-timing-function:ease-in}92%{transform:translateY(1px);opacity:0}100%{transform:translateY(0);opacity:0}}
.pf-bch-wet{opacity:0;animation:pf-bch-wet 7.2s infinite}
@keyframes pf-bch-wet{0%{opacity:0}35%{opacity:.28}60%{opacity:.26}100%{opacity:0}}
.pf-bch-crest{animation:pf-bch-crest 3.6s ease-in infinite}
@keyframes pf-bch-crest{0%{transform:translateY(-3px);opacity:0}45%{opacity:1}85%{transform:translateY(1px);opacity:1}100%{transform:translateY(2px);opacity:0}}
.pf-bch-gull{animation:pf-bch-gull 28s linear infinite}
@keyframes pf-bch-gull{0%{transform:translate(${left - 20}px,6px)}50%{transform:translate(${left + w / 2}px,0)}100%{transform:translate(${left + w + 20}px,10px)}}`;
  return { svg, css };
}
