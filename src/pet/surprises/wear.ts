/**
 * Things a pet can wear or carry: hats sit on the crown anchor, glasses are fitted to each
 * species' eyes, and held items hang by its side. All sizes follow the sprite's own pixels.
 */
import type { Grid } from "../../svg/pixel.js";
import { anchors, eyeBoxes } from "../behavior.js";
import type { Species } from "../species/types.js";
import type { Hat } from "../sprite.js";
import { px, round } from "./kit.js";

// ── Hats ─────────────────────────────────────────────────────────────────────

export const SANTA_HAT: Hat = {
  grid: [
    "....rrrr.....",
    "..rrrrrrrr...",
    ".rrRrrrrrrr..",
    ".rRrrrrrr.rr.",
    ".rrrrrrrr..ww",
    "rrrrrrrrr..ww",
    "wwwwwwwwww...",
    "wwWwwwWwww...",
  ],
  palette: { r: "#e03131", R: "#ff6b6b", w: "#ffffff", W: "#dfe6ee" },
  cx: 5,
  sink: 2,
};

export const WITCH_HAT: Hat = {
  grid: [
    "........kk...",
    ".......kkk...",
    "......kkk....",
    ".....kKkk....",
    ".....kKkkk...",
    "....kKkkkk...",
    "....oooyoo...",
    "kkkkkkkkkkkkk",
  ],
  palette: { k: "#3d2a5c", K: "#6a4c93", o: "#f28c28", y: "#ffd166" },
  cx: 6.5,
  sink: 1,
};

export const TOP_HAT: Hat = {
  grid: [
    "..kkkkk..",
    "..kKkkk..",
    "..kKkkk..",
    "..kKkkk..",
    "..yyyyy..",
    "kkkkkkkkk",
  ],
  palette: { k: "#1f2328", K: "#4b5563", y: "#ffd166" },
  sink: 1,
};

export const PARTY_HAT: Hat = {
  grid: [
    "...w...",
    "..wWw..",
    "...p...",
    "..pyp..",
    "..ypy..",
    ".pypyp.",
    ".ypypy.",
    "pypypyp",
  ],
  palette: { p: "#ff5c9a", y: "#ffd166", w: "#ffffff", W: "#4cc9f0" },
  sink: 1,
};

// ── Glasses ──────────────────────────────────────────────────────────────────

type Look = "shades" | "nerd" | "disguise";

/**
 * Glasses fitted to the species' eyes: shades, taped-up nerd frames, or the full fake
 * nose-and-moustache disguise. Side-view pets get a single lens with an arm to the back.
 */
export function glasses(species: Species, scale: number, look: Look): string {
  const eyes = eyeBoxes(species);
  if (!eyes.length) return "";
  const s = scale;
  const out: string[] = [];
  const frame = look === "shades" ? "#111418" : "#1f2328";
  const lenses = eyes.map((e) => ({ x: (e.x - 0.5) * s, y: (e.y - 0.25) * s, w: (e.w + 1) * s, h: (e.h + 0.5) * s }));
  const lw = Math.max(1, s / 2);

  for (const l of lenses) {
    if (look === "shades") {
      out.push(`<rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="${s / 2}" fill="${frame}"/>`);
      out.push(`<rect class="pf-s-glint" x="${l.x + s / 2}" y="${l.y + s / 2}" width="${Math.max(1, s / 2)}" height="${Math.max(1, s / 2)}" fill="#ffffff"/>`);
    } else {
      out.push(`<rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="${s / 3}" fill="#ffffff" fill-opacity=".18" stroke="${frame}" stroke-width="${lw}"/>`);
    }
  }
  const first = lenses[0]!;
  const last = lenses[lenses.length - 1]!;
  if (lenses.length > 1) {
    // The bridge; nerds mend theirs with tape.
    const bx = first.x + first.w;
    const by = first.y + s / 2;
    out.push(`<rect x="${bx}" y="${by}" width="${last.x - bx}" height="${lw}" fill="${frame}"/>`);
    if (look === "nerd") out.push(`<rect x="${round(bx + (last.x - bx) / 2 - s / 2)}" y="${by - s / 3}" width="${s}" height="${lw + (2 * s) / 3}" fill="#f4f1e8"/>`);
  } else {
    // One lens on a side-view head: an arm back to the ear.
    out.push(`<rect x="${first.x - 3 * s}" y="${first.y + s / 2}" width="${3 * s}" height="${lw}" fill="${frame}"/>`);
  }

  if (look === "disguise") {
    const a = anchors(species);
    const side = lenses.length === 1;
    // Bushy eyebrows over each lens.
    for (const l of lenses) out.push(`<rect x="${l.x}" y="${l.y - s}" width="${l.w}" height="${s * 0.75}" fill="#2b1b12"/>`);
    // A big pink nose where the lenses meet (ahead of the eye for side-view pets).
    const nx = side ? last.x + last.w - s / 2 : (first.x + last.x + last.w) / 2 - 1.25 * s;
    const ny = first.y + first.h - s / 2;
    out.push(`<rect x="${round(nx)}" y="${round(ny)}" width="${2.5 * s}" height="${2 * s}" rx="${s}" fill="#f4a3a3"/>`);
    out.push(`<rect x="${round(nx + s / 2)}" y="${round(ny + s / 3)}" width="${s * 0.75}" height="${s / 2}" fill="#fff" opacity=".6"/>`);
    // And a moustache over the mouth.
    const mx = side ? nx - s / 2 : a.mouth.x * s - 2.5 * s;
    const my = Math.max(ny + 2 * s, (a.mouth.y - 1.5) * s);
    out.push(`<path d="M${round(mx)} ${round(my + s)}q${1.25 * s} ${-1.5 * s} ${2.5 * s} 0q${1.25 * s} ${-1.5 * s} ${2.5 * s} 0v${s / 2}q${-1.25 * s} ${-s / 2} ${-2.5 * s} 0q${-1.25 * s} ${-s / 2} ${-2.5 * s} 0z" fill="#2b1b12"/>`);
  }
  return out.join("");
}

// ── Held things ──────────────────────────────────────────────────────────────

/** Something small drawn by the pet's side (its right, or ahead of a side-view pet). */
export function heldAt(species: Species, scale: number, grid: Grid, palette: Record<string, string>, cls = ""): { svg: string; x: number; y: number; w: number; h: number } {
  const s = Math.max(2, Math.round((scale * 3) / 4));
  const w = grid[0]!.length * s;
  const h = grid.length * s;
  const x = species.width * scale - w / 2;
  const y = species.height * scale - h - scale;
  const svg = `<g${cls ? ` class="${cls}"` : ""}>${px(grid, palette, x, y, s)}</g>`;
  return { svg, x, y, w, h };
}

export const RED_ENVELOPE: Grid = ["rrrrr", "rdddr", "rrdrr", "ryyyr", "rryrr", "rrrrr", "rrrrr"];
export const RED_ENVELOPE_PALETTE = { r: "#e03131", d: "#b02525", y: "#ffd166" };

export const CANDY_PAIL: Grid = [".k..k.", "..kk..", "oooooo", "oyoyoo", "oooyoo", "oyyyoo", ".oooo."];
export const CANDY_PAIL_PALETTE = { k: "#3b2a1a", o: "#f28c28", y: "#3b1d00" };

export const COFFEE: Grid = ["cccc..", "bbbbb.", "bbbb.b", "bwbbb.", "bbbb..", ".bb..."];
export const COFFEE_PALETTE = { c: "#6f4e37", b: "#2f81f7", w: "#ffffff" };
