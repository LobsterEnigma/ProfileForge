/**
 * The far side of each home, between the sky and the ground: rolling hills, a jungle canopy,
 * Kilimanjaro over the savanna, a red barn across the fields, Mount Fuji behind the hot spring,
 * layered pines, a garden hedge, reef rocks... Farther layers are paler (aerial perspective), so
 * the pet always stands out in front. At night a blue shade, cut to their shapes, turns them
 * into soft silhouettes.
 *
 * Most layers are skylines: a height for every 2px column, filled down to the ground, drawn as
 * one stepped path each, which keeps the card small.
 */
import { RectBatch } from "../svg/batch.js";
import { renderPixels, type Grid, type Palette } from "../svg/pixel.js";
import { stepped } from "../svg/stepped.js";
import type { Area, Season } from "../world/seasons.js";
import type { Terrain } from "./scenery.js";

export const BACKDROP_CSS = `.pf-bd-n{opacity:calc(var(--pf-stars) * .72)}`;

/** Top of a layer at column x (px from the scene's left edge), or undefined where it's empty. */
type Top = (x: number) => number | undefined;

const snap = (y: number) => Math.round(y / 2) * 2;

const band = (area: Area, fill: string, top: Top, bottom: (x: number, top: number) => number) => stepped(fill, area.x, area.w, top, bottom);

/** A layer filled down to the ground, with an optional one-pixel lighter rim along its top. */
function skyline(area: Area, top: Top, fill: string, rim?: string): string {
  return band(area, fill, top, () => area.ground + 2) + (rim ? band(area, rim, top, (_, t) => t + 1) : "");
}

/** Rolling hills: `height(x)` above the ground. */
const hills = (area: Area, height: (x: number) => number): Top => (x) => {
  const h = Math.round(height(x));
  return h > 0 ? area.ground - h : undefined;
};

/** Round crowns merged into a treeline: each [cx, cy, r] in scene px, filled down to the ground. */
const treeline = (area: Area, crowns: readonly (readonly [number, number, number])[]): Top => (x) => {
  let top: number | undefined;
  const cx0 = area.x + x + 1;
  for (const [cx, cy, r] of crowns) {
    const dx = Math.abs(cx0 - cx);
    if (dx > r) continue;
    const t = snap(cy - Math.sqrt(r * r - dx * dx));
    top = top === undefined ? t : Math.min(top, t);
  }
  return top;
};

/** Pines as narrow stepped triangles: each [cx, height]. */
const pines = (area: Area, trees: readonly (readonly [number, number])[], base: number): Top => (x) => {
  let top: number | undefined;
  const cx0 = area.x + x + 1;
  for (const [cx, h] of trees) {
    const t = snap(base - h + Math.abs(cx0 - cx) * 2.4);
    if (t < base) top = top === undefined ? t : Math.min(top, t);
  }
  return top;
};

/** A single round crown as pixel rows, for trees that stand apart. */
function crown(b: RectBatch, fill: string, cx: number, cy: number, r: number): void {
  for (let dy = -r; dy <= r; dy += 2) {
    const half = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)) / 2) * 2;
    if (half > 0) b.add(fill, cx - half, cy + dy, half * 2, 2);
  }
}

/** Deterministic wobble for spacing things out. */
const jitter = (i: number, span: number) => (((i * 37 + 11) % 17) / 16) * span;

/** Crowns spaced every `step` px across the scene, bobbing up by up to `wobble`. */
function row(area: Area, from: number, step: number, cy: number, r: number, wobble: number, seed = 0): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0, x = from; x < area.w + r; i++, x += step) out.push([area.x + x, cy - Math.round(jitter(i + seed, wobble)), r]);
  return out;
}

const px = (grid: Grid, palette: Palette, x: number, y: number) => renderPixels([{ x: 0, y: 0, grid }], palette, { x, y, scale: 2 });

const BARN: Grid = [
  "...RRRR...",
  "..RRRRRR..",
  ".RRRRRRRR.",
  "rrrrrrrrrr",
  "rwrrwwrrwr",
  "rrrrwwrrrr",
  "rrrrwwrrrr",
];
const SILO: Grid = [".ss.", "ssss", "sSss", "sSss", "sSss", "sSss", "sSss"];

/** Water from the top of the scene to the sea floor, hiding the sky. */
function water(area: Area, [top, bottom]: readonly [string, string]): string {
  return (
    `<defs><linearGradient id="pf-bd-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>` +
    `<rect x="${area.x}" y="${area.y}" width="${area.w}" height="${area.ground - area.y + 2}" fill="url(#pf-bd-water)"/>`
  );
}

/** A mountain's snowy cap: a band hanging from the summit line. */
function snowcap(area: Area, top: Top, depth: (x: number) => number): string {
  return band(area, "#f4f7fb", (x) => (depth(x) > 1 ? top(x) : undefined), (x, t) => t + Math.round(depth(x)));
}

/** Seasons over the far hills: a warm autumn tint, snow in winter. */
const SEASON_WASH: Partial<Record<Season, { fill: string; opacity: number }>> = {
  autumn: { fill: "#e0892f", opacity: 0.32 },
  winter: { fill: "#f1f5fa", opacity: 0.62 },
};

export function backdrop(terrain: Terrain, area: Area, night: boolean, season?: Season): string {
  const g = area.ground;
  const L = area.x;
  const W = area.w;
  const b = new RectBatch();
  let art = "";

  switch (terrain) {
    case "meadow":
    case "river": {
      // Two ranges of rolling hills, the nearer one dotted with little trees.
      art += skyline(area, hills(area, (x) => 15 + 6 * Math.sin(x / 23) + 3 * Math.sin(x / 9 + 1)), "#c7e0b3", "#dcedc9");
      const near = (x: number) => 7 + 4 * Math.sin(x / 31 + 2) + 2 * Math.sin(x / 11);
      art += skyline(area, hills(area, near), "#a4cd8b", "#b9dba2");
      for (const [x, r] of [[26, 4], [34, 3], [150, 5], [172, 4]] as const) {
        const cy = g - Math.round(near(x)) - r;
        b.add("#7a5a3a", L + x - 1, cy + r - 1, 2, 4);
        crown(b, "#74b163", L + x, cy, r);
      }
      break;
    }

    case "jungle":
      // A far canopy of round crowns with tall emergent trees, and a nearer, darker one.
      art += skyline(area, treeline(area, row(area, -6, 14, g - 28, 11, 14)), "#9fcca5");
      art += skyline(area, treeline(area, row(area, 2, 17, g - 13, 9, 8, 3)), "#6db27a");
      break;

    case "savanna": {
      // Kilimanjaro off to the right, flat-topped and snow-capped, and flat acacias far across the grass.
      const peak = 150;
      const kili = (x: number) => {
        const d = Math.abs(x - peak);
        return d < 14 ? 40 - (d > 10 ? (d - 10) * 2 : 0) : Math.max(0, 32 - (d - 14) * 0.5);
      };
      const top = hills(area, kili);
      art += skyline(area, top, "#c9bdac", "#dbd1c2");
      art += snowcap(area, top, (x) => {
        const d = Math.abs(x - peak);
        return d < 11 ? 5 + ((x * 7) % 3) : d < 17 ? 2 + (x % 4 === 0 ? 1 : 0) : 0;
      });
      art += skyline(area, () => g - 3, "#dcc882");
      for (const [x, w] of [[24, 16], [58, 12], [186, 18]] as const) {
        b.add("#8f7f55", L + x - 1, g - 12, 2, 10).add("#8f7f55", L + x - w / 2, g - 14, w, 3).add("#8f7f55", L + x - w / 2 + 3, g - 16, w - 6, 2);
      }
      break;
    }

    case "farm":
      // Green hills, a golden wheat field in front, and a red barn and silo far off.
      art += skyline(area, hills(area, (x) => 14 + 5 * Math.sin(x / 27 + 0.5)), "#c3dca2", "#d5e8ba");
      art += skyline(area, hills(area, (x) => 6 + 2 * Math.sin(x / 17)), "#e8d58f", "#f2e3a8");
      art += px(BARN, { R: "#9b3b33", r: "#c4574c", w: "#f4ede0" }, L + 150, g - 30) + px(SILO, { s: "#b8c2cc", S: "#9aa6b2" }, L + 172, g - 30);
      break;

    case "pond":
      // A soft treeline across the water meadow, bushes in front.
      art += skyline(area, hills(area, (x) => 8 + 3 * Math.sin(x / 19)), "#c6dfb4");
      art += skyline(area, treeline(area, row(area, -4, 12, g - 16, 8, 6)), "#a3cd93");
      art += skyline(area, treeline(area, [40, 52, 120, 134].map((x) => [L + x, g - 6, 6] as const)), "#7eb86c");
      break;

    case "onsen": {
      // Mount Fuji off to the right, its snowy cap ragged at the edge; a low wood in front.
      const peak = 158;
      const top = hills(area, (x) => (Math.abs(x - peak) < 6 ? 58 : Math.max(0, 62 - Math.abs(x - peak) * 0.72)));
      art += skyline(area, top, "#aebfd8", "#c3d0e4");
      art += snowcap(area, top, (x) => Math.max(0, 18 - Math.abs(x - peak) * 0.55) + ((x * 5) % 4));
      art += skyline(area, treeline(area, row(area, -2, 11, g - 9, 6, 4)), "#93c083");
      break;
    }

    case "forest": {
      // Two layers of broadleaf trees, the far one pale; trunks show under the near canopy.
      art += skyline(area, treeline(area, row(area, -6, 15, g - 32, 11, 8)), "#b2d2a2");
      const near = row(area, 6, 24, g - 24, 11, 6, 5);
      art += skyline(area, treeline(area, near), "#7fb56e");
      for (const [cx] of near) b.add("#6d8f55", cx - 2, g - 12, 4, 14);
      break;
    }

    case "garden":
      // A clipped hedge along the back, and a white picket fence in front of it.
      art += skyline(area, hills(area, (x) => 20 + (x % 16 < 8 ? 1 : 0) + Math.round(Math.sin(x / 5) * 1.2)), "#8cc275", "#a4d18c");
      for (let x = 4; x < W; x += 12) b.add("#f4f1ea", L + x, g - 14, 4, 16).add("#f4f1ea", L + x + 1, g - 16, 2, 2);
      b.add("#f4f1ea", L, g - 11, W, 2).add("#f4f1ea", L, g - 5, W, 2);
      break;

    case "pinewood": {
      // Blue mountains, then rows of pines, paler the farther they are.
      art += skyline(area, hills(area, (x) => 26 + 9 * Math.sin(x / 21 + 1) + 4 * Math.sin(x / 7)), "#c5d4de", "#d6e1e9");
      const far: [number, number][] = [];
      for (let i = 0, x = -2; x < W + 8; i++, x += 9) far.push([L + x, 24 + Math.round(jitter(i, 12))]);
      const near: [number, number][] = [];
      for (let i = 0, x = 4; x < W + 8; i++, x += 14) near.push([L + x, 16 + Math.round(jitter(i + 4, 8))]);
      art += skyline(area, pines(area, far, g), "#a4c4b3");
      art += skyline(area, pines(area, near, g + 2), "#79a58a");
      break;
    }

    case "treetop":
      // High up in the canopy: a sea of treetops below and around, fading into the haze.
      art += skyline(area, treeline(area, row(area, -4, 14, g - 14, 9, 6)), "#bddcaf");
      art += skyline(area, treeline(area, row(area, 4, 18, g - 5, 8, 4, 2)), "#94c783");
      break;

    case "reef": {
      // Underwater: sunlit water instead of sky, and reef rocks crusted with coral fans.
      art += water(area, ["#9ad7f2", "#3f9fd3"]);
      const rock = (x: number) => 14 + 6 * Math.sin(x / 17 + 1) + 3 * Math.sin(x / 6);
      art += skyline(area, hills(area, rock), "#5f9cc2", "#7fb6d4");
      for (const [x, r, c] of [[20, 6, "#e59ab8"], [60, 5, "#f0b27f"], [150, 7, "#d9a0e6"], [182, 5, "#e59ab8"], [100, 4, "#f0b27f"]] as const) {
        crown(b, c, L + x, g - Math.round(rock(x)) - r + 2, r);
      }
      break;
    }

    case "deepsea": {
      // The deep: dark water instead of sky, and tall rock pillars looming in it.
      art += water(area, ["#3a6fb8", "#123a78"]);
      const pillars = [[0, 22, 70], [24, 14, 44], [150, 18, 56], [176, 24, 84]] as const;
      art += skyline(area, (x) => {
        for (const [x0, w, h] of pillars) {
          if (x >= x0 && x < x0 + w) return g - Math.round(h - Math.abs(x - x0 - w / 2) * 0.8 - ((x * 7) % 5));
        }
        return undefined;
      }, "#122c56");
      break;
    }

    case "beach":
      return "";
  }

  // Washes cut to the backdrop's shapes: the season's colour over the land, and at night a
  // blue shade that turns it all into silhouettes.
  const box = `x="${L}" y="${area.y}" width="${W}" height="${g - area.y + 2}"`;
  const wash = season && terrain !== "reef" && terrain !== "deepsea" ? SEASON_WASH[season] : undefined;
  const shade =
    `<mask id="pf-bd-m" style="mask-type:alpha" maskUnits="userSpaceOnUse" ${box}><use href="#pf-bd"/></mask>` +
    (wash ? `<rect mask="url(#pf-bd-m)" ${box} fill="${wash.fill}" opacity="${wash.opacity}"/>` : "") +
    `<rect class="pf-bd-n" mask="url(#pf-bd-m)" ${box} fill="#0e1838"${night ? ` style="opacity:.72"` : ""}/>`;
  return `<g id="pf-bd">${art}${b}</g>${shade}`;
}
