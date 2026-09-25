/**
 * Little bits of life on top of the sprite: glancing eyes, emote bubbles, a daily trick and
 * each species' signature move. Everything is CSS on a shared 12s cycle, picked
 * deterministically, so a card rendered twice on the same day is byte-identical.
 */
import { seeded } from "../random.js";
import { RectBatch } from "../svg/batch.js";
import { renderPixels, type Grid, type Layer } from "../svg/pixel.js";
import type { Mood, Trick } from "../types.js";
import type { Species } from "./species/types.js";
import { FX_PALETTE, HEART } from "./sprites.js";

// ── Glancing ─────────────────────────────────────────────────────────────────

/** Moves every pupil (`k`) one pixel into the eye white (`w`) next to it. */
function shiftPupils(grid: Grid, dir: 1 | -1): Grid {
  return grid.map((row) => {
    const px = [...row];
    const order = dir === -1 ? px.keys() : [...px.keys()].reverse();
    for (const i of order) {
      if (px[i] === "k" && px[i + dir] === "w") [px[i], px[i + dir]] = [px[i + dir]!, px[i]!];
    }
    return px.join("");
  });
}

/** The open eyes looking to one side, or null when the pupils have nowhere to go. */
export function glance(eyes: Layer[]): Layer[] | null {
  for (const dir of [-1, 1] as const) {
    const moved = eyes.map((l) => ({ ...l, grid: shiftPupils(l.grid, dir) }));
    if (moved.some((l, i) => l.grid.join() !== eyes[i]!.grid.join())) return moved;
  }
  return null;
}

// ── Anchors ──────────────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}

const width = (l: Layer) => Math.max(...l.grid.map((r) => r.length));

/** Where the eyes, mouth and top of the head are, in sprite pixels. */
export function anchors(species: Species): { eyes: Point[]; mouth: Point; top: number } {
  const eyes = species.eyes.open.filter((l) => /[kw]/.test(l.grid.join(""))).map((l) => ({ x: l.x + width(l) / 2, y: l.y + l.grid.length / 2 }));
  const mouthLayers = [species.mouths.smile, species.mouths.neutral, species.mouths.frown].find((m) => m.length) ?? [];
  const mouth = mouthLayers.length
    ? {
        x: (Math.min(...mouthLayers.map((l) => l.x)) + Math.max(...mouthLayers.map((l) => l.x + width(l)))) / 2,
        y: Math.max(...mouthLayers.map((l) => l.y + l.grid.length)),
      }
    : { x: species.width / 2, y: species.height * 0.7 };
  const top = Math.min(...species.eyes.open.map((l) => l.y));
  return { eyes, mouth, top };
}

// ── Emote bubbles ────────────────────────────────────────────────────────────

const GLYPHS = {
  question: ["xxx", "..x", ".xx", "...", ".x."],
  note: ["..xx", "..x.", "..x.", "xxx.", "xx.."],
  bang: [".x.", ".x.", ".x.", "...", ".x."],
} satisfies Record<string, Grid>;

export type Emote = keyof typeof GLYPHS;

/** A speech bubble with a pixel glyph, its bottom-left corner at (x, y). */
export function emoteBubble(emote: Emote, x: number, y: number, cls: string, style = ""): string {
  const glyph = GLYPHS[emote];
  const w = glyph[0]!.length * 2 + 8;
  const h = 18;
  return `<g class="${cls}"${style ? ` style="${style}"` : ""}><rect x="${x}" y="${y - h}" width="${w}" height="${h - 4}" rx="4" fill="#ffffff" stroke="#1f2328" stroke-width="1"/><rect x="${x + 3}" y="${y - 5}" width="3" height="3" fill="#ffffff" stroke="#1f2328" stroke-width="1"/>${renderPixels([{ x: 0, y: 0, grid: glyph }], { x: "#1f2328" }, { x: x + 4, y: y - h + 2, scale: 2 })}</g>`;
}

// ── Tricks ───────────────────────────────────────────────────────────────────

export const TRICKS: Trick[] = ["dance", "twirl", "heart-eyes", "sneeze", "tongue", "signature"];

/** Each species' own move. */
const SIGNATURE: Record<string, "bubbles" | "dig" | "hiss" | "spray" | "peck" | "zoomies"> = {
  crab: "bubbles",
  gopher: "dig",
  snake: "hiss",
  elephant: "spray",
  chick: "peck",
  turtle: "zoomies",
};

/** Today's trick: the same all day, a different one tomorrow. The signature move comes up most. */
export function trickFor(date: string, login: string): Trick {
  const pool: Trick[] = ["signature", "signature", "dance", "twirl", "heart-eyes", "sneeze", "tongue"];
  return pool[Math.floor(seeded(`trick:${login}:${date}`)() * pool.length)]!;
}

/** Tricks play between 70% and 88% of a 12s cycle. */
export const BEHAVIOR_CSS = `
.pf-eo{animation:pf-eo 7s steps(1) infinite}
.pf-eg{opacity:0;animation:pf-eg 7s steps(1) infinite}
.pf-es{opacity:0;animation:pf-es 7s steps(1) infinite}
@keyframes pf-eo{0%{opacity:1}38%{opacity:0}52%{opacity:1}90%{opacity:0}95%{opacity:1}100%{opacity:1}}
@keyframes pf-eg{0%{opacity:0}38%{opacity:1}52%{opacity:0}100%{opacity:0}}
@keyframes pf-es{0%{opacity:0}90%{opacity:1}95%{opacity:0}100%{opacity:0}}
.pf-emote{opacity:0;transform-box:fill-box;transform-origin:0 100%;animation:pf-emote 9s ease-out infinite}
@keyframes pf-emote{0%,40%{opacity:0;transform:scale(.3)}43%,51%{opacity:1;transform:scale(1)}54%,100%{opacity:0;transform:scale(1)}}
.pf-emote-fast{opacity:0;transform-box:fill-box;transform-origin:0 100%;animation:pf-emote-fast 3.6s ease-out infinite}
@keyframes pf-emote-fast{0%{opacity:0;transform:scale(.3)}8%,40%{opacity:1;transform:scale(1)}50%,100%{opacity:0}}
.pf-show{opacity:0;animation:pf-show 12s steps(1) infinite}
@keyframes pf-show{0%{opacity:0}70%{opacity:1}88%{opacity:0}100%{opacity:0}}
.pf-flick{opacity:0;animation:pf-flick 12s steps(1) infinite}
@keyframes pf-flick{0%{opacity:0}70%{opacity:1}73%{opacity:0}76%{opacity:1}79%{opacity:0}82%{opacity:1}85%,100%{opacity:0}}
.pf-dance{transform-box:fill-box;transform-origin:50% 100%;animation:pf-dance 12s linear infinite}
@keyframes pf-dance{0%,70%,88%,100%{transform:rotate(0)}72%,76%,80%,84%{transform:rotate(-10deg)}74%,78%,82%,86%{transform:rotate(10deg)}}
.pf-twirl{transform-box:fill-box;transform-origin:center;animation:pf-twirl 12s steps(1) infinite}
@keyframes pf-twirl{0%{transform:scaleX(1)}72%{transform:scaleX(-1)}75%{transform:scaleX(1)}78%{transform:scaleX(-1)}81%{transform:scaleX(1)}100%{transform:scaleX(1)}}
.pf-sneeze{transform-box:fill-box;transform-origin:50% 100%;animation:pf-sneeze 12s ease-in-out infinite}
@keyframes pf-sneeze{0%,70%,100%{transform:scale(1)}76%{transform:scale(1.05,.88)}79%{transform:scale(.95,1.08)}84%{transform:scale(1)}}
.pf-peck{transform-box:fill-box;transform-origin:50% 100%;animation:pf-peck 12s ease-in-out infinite}
@keyframes pf-peck{0%,70%,88%,100%{transform:rotate(0)}73%,79%,85%{transform:rotate(16deg)}76%,82%{transform:rotate(0)}}
.pf-zoom{animation:pf-zoom 12s ease-in-out infinite}
@keyframes pf-zoom{0%,70%,100%{transform:translateX(0)}75%{transform:translateX(44px)}81%{transform:translateX(-44px)}87%{transform:translateX(0)}}
.pf-burst{opacity:0;animation:pf-burst 12s ease-out infinite}
@keyframes pf-burst{0%,71%{transform:translate(0,0);opacity:0}72%,82%{opacity:1}88%{transform:translate(var(--dx),var(--dy));opacity:0}100%{opacity:0}}
`;

interface Particle {
  dx: number;
  dy: number;
  delay: number;
}

function burst(from: Point, color: string, size: number, particles: Particle[], round = false): string {
  return particles
    .map(
      (p) =>
        `<rect class="pf-burst" style="--dx:${p.dx}px;--dy:${p.dy}px;animation-delay:${p.delay}s" x="${from.x - size / 2}" y="${from.y - size / 2}" width="${size}" height="${size}"${round ? ` rx="${size / 2}" fill="none" stroke="${color}" stroke-width="1"` : ` fill="${color}"`}/>`,
    )
    .join("");
}

const fan = (n: number, spread: number, rise: number) =>
  Array.from({ length: n }, (_, i) => ({ dx: Math.round((i / (n - 1) - 0.5) * spread), dy: -rise - (i % 2) * 6, delay: (i % 3) * 0.15 }));

export interface TrickLayers {
  /** Class for the group wrapping the whole sprite. */
  bodyClass: string;
  /** Drawn over the sprite, in sprite coordinates. */
  overlay: string;
}

/** The markup for today's trick, for a sprite drawn at `scale`. */
export function trickLayers(trick: Trick, species: Species, scale: number): TrickLayers {
  const a = anchors(species);
  const at = (p: Point) => ({ x: p.x * scale, y: p.y * scale });
  const mouth = at(a.mouth);
  const w = species.width * scale;
  const h = species.height * scale;

  switch (trick) {
    case "dance":
      return { bodyClass: "pf-dance", overlay: emoteBubble("note", w - 6, a.top * scale - 2, "pf-show") };
    case "twirl":
      return { bodyClass: "pf-twirl", overlay: "" };
    case "heart-eyes": {
      const hs = Math.max(1, Math.round(scale * 0.75));
      const hearts = a.eyes
        .map((e) => at(e))
        .map((e) => renderPixels([{ x: 0, y: 0, grid: HEART }], FX_PALETTE, { x: e.x - (5 * hs) / 2, y: e.y - 2 * hs, scale: hs }))
        .join("");
      return { bodyClass: "", overlay: `<g class="pf-show">${hearts}</g>` };
    }
    case "sneeze":
      return {
        bodyClass: "pf-sneeze",
        overlay: emoteBubble("bang", w - 6, a.top * scale - 2, "pf-show") + burst(mouth, "#8ec5ea", Math.max(2, scale * 0.75), fan(5, 50, 6)),
      };
    case "tongue":
      return {
        bodyClass: "",
        overlay: `<rect class="pf-show" x="${mouth.x - scale}" y="${mouth.y}" width="${2 * scale}" height="${2 * scale}" rx="${scale / 2}" fill="#e63946"/>`,
      };
    case "signature":
      return signature(SIGNATURE[species.id] ?? "bubbles", mouth, w, h, scale);
  }
}

function signature(move: (typeof SIGNATURE)[string], mouth: Point, w: number, h: number, scale: number): TrickLayers {
  switch (move) {
    case "bubbles":
      return { bodyClass: "", overlay: burst(mouth, "#dff4ff", 2 * scale, fan(4, 30, 34), true) };
    case "dig":
      return { bodyClass: "pf-sneeze", overlay: burst({ x: w / 2, y: h - scale }, "#7a5230", scale, fan(6, 70, 14)) };
    case "hiss": {
      const fork = new RectBatch()
        .add("#e63946", mouth.x - scale / 2, mouth.y, scale, 2 * scale)
        .add("#e63946", mouth.x - 1.5 * scale, mouth.y + 2 * scale, scale, scale)
        .add("#e63946", mouth.x + 0.5 * scale, mouth.y + 2 * scale, scale, scale);
      return { bodyClass: "", overlay: `<g class="pf-flick">${fork}</g>` };
    }
    case "spray":
      // From the tip of the trunk, up in a fountain.
      return { bodyClass: "", overlay: burst({ x: w / 2, y: h - 2 * scale }, "#4ea8de", Math.max(2, scale), fan(7, 96, 84)) };
    case "peck": {
      const seeds = new RectBatch();
      for (const dx of [-3, 2, 6]) seeds.add("#e9c46a", w / 2 + dx * scale, h - scale / 2, scale / 2 + 1, scale / 2 + 1);
      return { bodyClass: "pf-peck", overlay: `<g class="pf-show">${seeds}</g>` };
    }
    case "zoomies": {
      const lines = new RectBatch();
      for (const y of [0.35, 0.55, 0.75]) lines.add("#8d96a0", -4 * scale, h * y, 3 * scale, Math.max(1, scale / 2));
      return { bodyClass: "pf-zoom", overlay: `<g class="pf-show">${lines}</g>` };
    }
  }
}

/** Idle and happy pets have the energy for tricks and emotes. */
export const playful = (mood: Mood) => mood === "happy" || mood === "idle";
