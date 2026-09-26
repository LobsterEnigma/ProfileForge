/**
 * Little bits of life on top of the sprite: glancing eyes, emote bubbles, and tricks: four a
 * day (including, often, the species' signature move), taking turns over a 48s loop. Picked
 * deterministically, so a card rendered twice on the same day is byte-identical.
 */
import { seeded } from "../random.js";
import { RectBatch } from "../svg/batch.js";
import { renderPixels, type Grid, type Layer } from "../svg/pixel.js";
import type { Mood, Trick } from "../types.js";
import type { Species } from "./species/types.js";
import { COMMIT, FX_PALETTE, HEART } from "./sprites.js";
import { pixelText } from "../svg/pixelfont.js";

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

/** Both pupils slide towards the nose (a side-view pet's single eye looks ahead). */
export function crossEyes(eyes: Layer[], spriteWidth: number): Layer[] {
  return eyes.map((l) => {
    if (!/k/.test(l.grid.join("")) || !/w/.test(l.grid.join(""))) return l;
    const centre = l.x + width(l) / 2;
    return { ...l, grid: shiftPupils(l.grid, centre < spriteWidth / 2 || eyes.length === 1 ? 1 : -1) };
  });
}

// ── Anchors ──────────────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}

const width = (l: Layer) => Math.max(...l.grid.map((r) => r.length));

export interface PixelBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The whites and pupils of each open eye, in sprite pixels (for glasses and disguises). */
export function eyeBoxes(species: Species): PixelBox[] {
  const boxes: PixelBox[] = [];
  for (const l of species.eyes.open) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    l.grid.forEach((row, y) =>
      [...row].forEach((c, x) => {
        if (c !== "k" && c !== "w") return;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }),
    );
    if (x1 >= 0) boxes.push({ x: l.x + x0, y: l.y + y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
  }
  return boxes.sort((a, b) => a.x - b.x);
}

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
  return bubble(GLYPHS[emote], x, y, cls, style);
}

/** A speech bubble around any pixel grid (a glyph, or a word from pixelText). */
export function bubble(glyph: Grid, x: number, y: number, cls: string, style = ""): string {
  const w = glyph[0]!.length * 2 + 8;
  const h = 18;
  return `<g class="${cls}"${style ? ` style="${style}"` : ""}><rect x="${x}" y="${y - h}" width="${w}" height="${h - 4}" rx="4" fill="#ffffff" stroke="#1f2328" stroke-width="1"/><rect x="${x + 3}" y="${y - 5}" width="3" height="3" fill="#ffffff" stroke="#1f2328" stroke-width="1"/>${renderPixels([{ x: 0, y: 0, grid: glyph }], { x: "#1f2328" }, { x: x + 4, y: y - h + 2, scale: 2 })}</g>`;
}

// ── Tricks ───────────────────────────────────────────────────────────────────

export const TRICKS: Trick[] = [
  "dance",
  "twirl",
  "heart-eyes",
  "sneeze",
  "tongue",
  "backflip",
  "moonwalk",
  "dizzy",
  "kiss",
  "juggle",
  "hiccup",
  "magic",
  "jump-rope",
  "selfie",
  "bug-hunt",
  "item-get",
  "bubblegum",
  "sing",
  "signature",
];

/** Each species' own move. */
const SIGNATURE: Record<string, "bubbles" | "dig" | "hiss" | "spray" | "peck" | "zoomies"> = {
  crab: "bubbles",
  gopher: "dig",
  snake: "hiss",
  elephant: "spray",
  chick: "peck",
  turtle: "zoomies",
};

/**
 * Tricks play in the still moments of the pet's day: four windows spread over two 24s days,
 * so a card shows four different tricks before it repeats.
 */
export const TRICK_PERIOD = 48;
export const TRICK_STARTS = [8.4, 20.4, 32.4, 44.4] as const;
const TRICK_WINDOW = 2.16;

/** Today's four tricks, all different: the same all day, new ones tomorrow. Often one is the species' own. */
export function tricksFor(date: string, login: string): Trick[] {
  const rng = seeded(`trick:${login}:${date}`);
  const pool: Trick[] = TRICKS.filter((t) => t !== "signature");
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  const picks = pool.slice(0, 4);
  if (rng() < 0.7) picks[Math.floor(rng() * 4)] = "signature";
  return picks;
}

/** The first of today's tricks. */
export const trickFor = (date: string, login: string): Trick => tricksFor(date, login)[0]!;

/** Eyes and emotes: not tied to tricks. Previews shift the tricks and the day with --pf-t0. */
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
.pf-stars{transform-box:fill-box;transform-origin:center;animation:pf-orbit-stars 1.2s linear infinite}
@keyframes pf-orbit-stars{from{transform:rotate(0)}to{transform:rotate(360deg)}}
`;

/**
 * Trick animations, written for a 12s cycle with the trick between 70% and 88% (the old
 * single-trick timing, easy to read). `windowed` stretches each one onto its own window of
 * the 48s trick period.
 */
const ANIMS = {
  show: { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}70%{opacity:1}88%{opacity:0}100%{opacity:0}" },
  late: { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}76%{opacity:1}88%{opacity:0}100%{opacity:0}" },
  early: { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}70%{opacity:1}77%{opacity:0}100%{opacity:0}" },
  flick: { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}70%{opacity:1}73%{opacity:0}76%{opacity:1}79%{opacity:0}82%{opacity:1}85%,100%{opacity:0}" },
  dance: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "linear", frames: "0%,70%,88%,100%{transform:rotate(0)}72%,76%,80%,84%{transform:rotate(-10deg)}74%,78%,82%,86%{transform:rotate(10deg)}" },
  twirl: { props: "transform-box:fill-box;transform-origin:center", timing: "steps(1)", frames: "0%{transform:scaleX(1)}72%{transform:scaleX(-1)}75%{transform:scaleX(1)}78%{transform:scaleX(-1)}81%{transform:scaleX(1)}100%{transform:scaleX(1)}" },
  sneeze: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-in-out", frames: "0%,70%,100%{transform:scale(1)}76%{transform:scale(1.05,.88)}79%{transform:scale(.95,1.08)}84%{transform:scale(1)}" },
  peck: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-in-out", frames: "0%,70%,88%,100%{transform:rotate(0)}73%,79%,85%{transform:rotate(16deg)}76%,82%{transform:rotate(0)}" },
  zoom: { props: "", timing: "ease-in-out", frames: "0%,70%,100%{transform:translateX(0)}75%{transform:translateX(44px)}81%{transform:translateX(-44px)}87%{transform:translateX(0)}" },
  burst: { props: "opacity:0", timing: "ease-out", frames: "0%,71%{transform:translate(0,0);opacity:0}72%,82%{opacity:1}88%{transform:translate(var(--dx),var(--dy));opacity:0}100%{opacity:0}" },
  backflip: { props: "transform-box:fill-box;transform-origin:center", timing: "ease-in-out", frames: "0%,70%,88%,100%{transform:none}72%{transform:scale(1.12,.84)}76%{transform:translateY(-34px) rotate(-180deg)}80%{transform:translateY(-8px) rotate(-360deg)}82%{transform:scale(1.14,.82)}85%{transform:none}" },
  moonwalk: { props: "", timing: "linear", frames: "0%,70%,100%{transform:none}72%{transform:translate(-5px,-1px)}74%{transform:translate(-10px,0)}76%{transform:translate(-15px,-1px)}78%{transform:translate(-20px,0)}80%{transform:translate(-25px,-1px)}82%{transform:translate(-30px,0)}86%{transform:translate(-8px,-6px)}88%{transform:none}" },
  dizzy: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-in-out", frames: "0%,70%,100%{transform:none}71.5%,74.5%{transform:scaleX(-1)}73%,76%{transform:none}78%,82%{transform:rotate(-8deg)}80%,84%{transform:rotate(8deg)}87%{transform:none}" },
  kiss: { props: "opacity:0;transform-box:fill-box;transform-origin:center", timing: "ease-out", frames: "0%,72%{opacity:0;transform:scale(.3)}74%{opacity:1;transform:scale(.6)}86%{opacity:1;transform:translate(34px,-40px) scale(1.7)}88%,100%{opacity:0;transform:translate(34px,-40px) scale(1.7)}" },
  pucker: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-in-out", frames: "0%,70%,77%,100%{transform:none}72%,74%{transform:scale(.94,1.06) translateY(-2px)}" },
  juggle: { props: "opacity:0", timing: "ease-in-out", frames: "0%,69.9%{opacity:0;transform:none}70%{opacity:1;transform:none}73%{transform:translate(var(--jx),-22px)}76%{transform:none}79%{transform:translate(var(--jx),-22px)}82%{transform:none}85%{transform:translate(var(--jx),-22px)}88%{opacity:1;transform:none}88.1%,100%{opacity:0}" },
  hiccup: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-out", frames: "0%,70%,100%{transform:none}73%{transform:translateY(-7px) scale(.96,1.05)}74.5%{transform:none}78%{transform:translateY(-7px) scale(.96,1.05)}79.5%{transform:none}83%{transform:translateY(-7px) scale(.96,1.05)}84.5%{transform:none}" },
  vanish: { props: "", timing: "steps(1)", frames: "0%{opacity:1}73%{opacity:0}83.5%{opacity:1}100%{opacity:1}" },
  poof: { props: "opacity:0;transform-box:fill-box;transform-origin:center", timing: "ease-out", frames: "0%,72.4%{opacity:0;transform:scale(.2)}73%{opacity:1;transform:scale(1)}77%{opacity:0;transform:scale(1.5)}82.9%{opacity:0;transform:scale(.2)}83.5%{opacity:1;transform:scale(1)}87.5%,100%{opacity:0;transform:scale(1.5)}" },
  tada: { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}84%{opacity:1}88%{opacity:0}100%{opacity:0}" },
  hop: { props: "", timing: "ease-in-out", frames: "0%,70%,76%,82%,88%,100%{transform:none}73%,79%,85%{transform:translateY(-10px)}" },
  "rope-up": { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}70%{opacity:1}73%{opacity:0}76%{opacity:1}79%{opacity:0}82%{opacity:1}85%{opacity:0}100%{opacity:0}" },
  "rope-down": { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}73%{opacity:1}76%{opacity:0}79%{opacity:1}82%{opacity:0}85%{opacity:1}88%{opacity:0}100%{opacity:0}" },
  pose: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-out", frames: "0%,70%,88%,100%{transform:none}73%,85%{transform:rotate(-7deg) scale(1.04)}" },
  flash: { props: "opacity:0", timing: "ease-out", frames: "0%,77.9%{opacity:0}78%{opacity:.9}81%,100%{opacity:0}" },
  crawl: { props: "opacity:0", timing: "linear", frames: "0%,69.9%{opacity:0;transform:translateX(44px)}70%{opacity:1;transform:translateX(44px)}78%{opacity:1;transform:translateX(0)}79.5%,100%{opacity:0;transform:translateX(0)}" },
  pounce: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-in-out", frames: "0%,70%,76%,100%{transform:none}77%{transform:scale(1.1,.85)}78.5%{transform:translate(14px,-14px)}80%{transform:translate(20px,0) scale(1.12,.84)}84%{transform:translate(20px,0)}88%{transform:none}" },
  fixed: { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}80%{opacity:1}88%{opacity:0}100%{opacity:0}" },
  raise: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-out", frames: "0%,70%,88%,100%{transform:none}72%{transform:scale(1.06,.9)}74%,86%{transform:translateY(-4px) scale(.97,1.05)}" },
  lift: { props: "opacity:0", timing: "ease-out", frames: "0%,72.9%{opacity:0;transform:translateY(10px)}73%{opacity:1;transform:translateY(10px)}76%,86%{opacity:1;transform:none}88%,100%{opacity:0;transform:none}" },
  gum: { props: "opacity:0;transform-box:fill-box;transform-origin:0 50%", timing: "ease-in", frames: "0%,71.9%{opacity:0;transform:scale(0)}72%{opacity:1;transform:scale(.2)}82%{opacity:1;transform:scale(1.6)}83%{opacity:1;transform:scale(1.8)}83.1%,100%{opacity:0;transform:scale(1.8)}" },
  pop: { props: "opacity:0", timing: "ease-out", frames: "0%,83%{opacity:0;transform:translate(0,0)}83.2%{opacity:1}88%{opacity:0;transform:translate(var(--dx),var(--dy))}100%{opacity:0}" },
  sway: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-in-out", frames: "0%,70%,88%,100%{transform:none}74%,82%{transform:rotate(-5deg)}78%,86%{transform:rotate(5deg)}" },
  note: { props: "opacity:0", timing: "ease-out", frames: "0%,70%{opacity:0;transform:translate(0,0)}72%{opacity:1}88%{opacity:0;transform:translate(var(--dx),-30px)}100%{opacity:0}" },
} satisfies Record<string, { props: string; timing: string; frames: string }>;

type Anim = keyof typeof ANIMS;

const r3 = (n: number) => +n.toFixed(3);

/** Moves a 12s/70–88% keyframe list onto a window starting at `start` in the 48s period. */
function windowed(frames: string, start: number): string {
  const g0 = (start / TRICK_PERIOD) * 100;
  const g1 = ((start + TRICK_WINDOW) / TRICK_PERIOD) * 100;
  const map = (p: number) => (p <= 70 ? (p / 70) * g0 : p <= 88 ? g0 + ((p - 70) / 18) * (g1 - g0) : g1 + ((p - 88) / 12) * (100 - g1));
  return frames.replace(/([\d.]+)%/g, (_, p: string) => `${r3(map(Number(p)))}%`);
}

interface Particle {
  dx: number;
  dy: number;
  delay: number;
}

const fan = (n: number, spread: number, rise: number) =>
  Array.from({ length: n }, (_, i) => ({ dx: Math.round((i / (n - 1) - 0.5) * spread), dy: -rise - (i % 2) * 6, delay: (i % 3) * 0.15 }));

export interface TrickLayers {
  /** Class for the group wrapping the whole sprite. */
  bodyClass: string;
  /** Behind the sprite, inside the body group (sprite coordinates). */
  under: string;
  /** Over the sprite, inside the body group. */
  overlay: string;
  /** Over the sprite, but not moved by the body (sprite coordinates). */
  beside: string;
  css: string;
}

/**
 * The markup for a trick, for a sprite drawn at `scale`, playing in window `slot` (its class
 * and keyframe names carry the slot, so four tricks can share a card).
 */
export function trickLayers(trick: Trick, species: Species, scale: number, slot = 0): TrickLayers {
  const start = TRICK_STARTS[slot % TRICK_STARTS.length]!;
  const css = new Map<string, string>();
  const k = (anim: Anim) => {
    const cls = `pf-k${slot}-${anim}`;
    if (!css.has(cls)) {
      const { props, timing, frames } = ANIMS[anim];
      css.set(cls, `.${cls}{${props ? `${props};` : ""}animation:${cls} ${TRICK_PERIOD}s ${timing} var(--pf-t0,0s) infinite}@keyframes ${cls}{${windowed(frames, start)}}`);
    }
    return cls;
  };
  const burst = (from: Point, color: string, size: number, particles: Particle[], round = false, anim: Anim = "burst") =>
    particles
      .map(
        (p) =>
          `<rect class="${k(anim)}" style="--dx:${p.dx}px;--dy:${p.dy}px;animation-delay:calc(var(--pf-t0,0s) + ${p.delay}s)" x="${from.x - size / 2}" y="${from.y - size / 2}" width="${size}" height="${size}"${round ? ` rx="${size / 2}" fill="none" stroke="${color}" stroke-width="1"` : ` fill="${color}"`}/>`,
      )
      .join("");
  const px = (grid: Grid, palette: Record<string, string>, x: number, y: number, s: number) => renderPixels([{ x: 0, y: 0, grid }], palette, { x, y, scale: s });

  const a = anchors(species);
  const at = (p: Point) => ({ x: p.x * scale, y: p.y * scale });
  const mouth = at(a.mouth);
  const w = species.width * scale;
  const h = species.height * scale;
  const top = a.top * scale;
  const layers = (bodyClass: string, overlay = "", under = "", beside = ""): TrickLayers => ({ bodyClass, overlay, under, beside, css: [...css.values()].join("\n") });
  const say = (text: string, cls: Anim) => bubble(pixelText(text), w - 6, top - 2, k(cls));

  switch (trick) {
    case "dance": {
      const body = k("dance");
      return layers(body, emoteBubble("note", w - 6, top - 2, k("show")));
    }
    case "twirl":
      return layers(k("twirl"));
    case "heart-eyes": {
      const hs = Math.max(1, Math.round(scale * 0.75));
      const hearts = a.eyes.map((e) => at(e)).map((e) => px(HEART, FX_PALETTE, e.x - (5 * hs) / 2, e.y - 2 * hs, hs)).join("");
      return layers("", `<g class="${k("show")}">${hearts}</g>`);
    }
    case "sneeze": {
      const body = k("sneeze");
      return layers(body, emoteBubble("bang", w - 6, top - 2, k("show")) + burst(mouth, "#8ec5ea", Math.max(2, scale * 0.75), fan(5, 50, 6)));
    }
    case "tongue":
      return layers("", `<rect class="${k("show")}" x="${mouth.x - scale}" y="${mouth.y}" width="${2 * scale}" height="${2 * scale}" rx="${scale / 2}" fill="#e63946"/>`);
    case "backflip":
      // No bubble: the overlay turns with the body, and the flip speaks for itself.
      return layers(k("backflip"));
    case "moonwalk": {
      const body = k("moonwalk");
      return layers(body, emoteBubble("note", w - 6, top - 2, k("show")));
    }
    case "dizzy": {
      // Little stars circling over its head once it's spun itself silly.
      const star = ["..y..", ".yyy.", "..y.."];
      const stars = [0, 1, 2]
        .map((i) => {
          const angle = (i / 3) * Math.PI * 2;
          return px(star, { y: "#ffd43b" }, w / 2 + Math.cos(angle) * 16 - 7.5, top - 6 + Math.sin(angle) * 5 - 4.5, 3);
        })
        .join("");
      const body = k("dizzy");
      return layers(body, `<g class="${k("late")}"><g class="pf-stars">${stars}</g></g>`);
    }
    case "kiss": {
      const body = k("pucker");
      return layers(body, `<g class="${k("kiss")}">${px(HEART, FX_PALETTE, mouth.x - 5, mouth.y - 6, 2)}</g>`);
    }
    case "juggle": {
      const balls = (["#ff6b6b", "#ffd43b", "#4dabf7"] as const)
        .map((color, i) => {
          const x = w / 2 + (i - 1) * 12 - 4;
          return `<rect class="${k("juggle")}" style="--jx:${(1 - i) * 12}px;animation-delay:calc(var(--pf-t0,0s) + ${i * 0.36}s)" x="${x}" y="${top - 10}" width="8" height="8" rx="4" fill="${color}" stroke="#1f2328" stroke-width="1"/>`;
        })
        .join("");
      return layers("", balls);
    }
    case "hiccup": {
      const body = k("hiccup");
      return layers(body, "", "", say("HIC!", "show"));
    }
    case "magic": {
      // Poof: gone in a puff of smoke, and back again. Ta-da!
      const body = k("vanish");
      const puffs = [[0.5, 0.5, 7], [0.2, 0.35, 5], [0.8, 0.35, 5], [0.3, 0.8, 5], [0.7, 0.8, 5]]
        .map(([fx, fy, r]) => `<circle class="${k("poof")}" cx="${w * fx!}" cy="${h * fy!}" r="${r! * (scale / 2)}" fill="#e9ecef" stroke="#adb5bd" stroke-width="1"/>`)
        .join("");
      return layers(body, "", "", puffs + say("TA-DA!", "tada"));
    }
    case "jump-rope": {
      const body = k("hop");
      const s = scale;
      const rope = (y: number, cls: string) => `<path class="${cls}" d="M${-2 * s} ${h * 0.55}Q${w / 2} ${y} ${w + 2 * s} ${h * 0.55}" fill="none" stroke="#8a5a33" stroke-width="2"/>`;
      return layers(body, rope(h + 4 * s, k("rope-down")), rope(-4 * s, k("rope-up")));
    }
    case "selfie": {
      const body = k("pose");
      const flash = `<rect class="${k("flash")}" x="${-w * 2}" y="${-h * 3}" width="${w * 5}" height="${h * 5}" fill="#ffffff"/>`;
      return layers(body, "", "", say("CHEESE", "early") + flash);
    }
    case "bug-hunt": {
      // A bug crawls in; the pet pounces on it. Fixed!
      const bug = px(["k.k.k", ".ggg.", "gGgGg", ".ggg.", "k.k.k"], { k: "#1f2328", g: "#2f9e44", G: "#8ce99a" }, w / 2 + 16, h - 15, 3);
      const body = k("pounce");
      return layers(body, "", "", `<g class="${k("crawl")}">${bug}</g>` + bubble(pixelText("FIXED!"), w + 6, top - 2, k("fixed")));
    }
    case "item-get": {
      // Holding a fresh commit up high, like a hero finding treasure.
      const body = k("raise");
      const cs = Math.max(2, scale);
      const item = px(COMMIT, FX_PALETTE, w / 2 - 2 * cs, top - 6 * cs, cs);
      const sparkles = [[-3, 0], [5, -1], [-2, -4], [4.5, -4.5]].map(([dx, dy]) => px(["..s..", ".sss.", "..s.."], FX_PALETTE, w / 2 + dx! * cs - 5, top - 5 * cs + dy! * cs, 2)).join("");
      return layers(body, `<g class="${k("lift")}">${item}${sparkles}</g>`);
    }
    case "bubblegum": {
      const r = 2 * scale;
      const gum = `<circle class="${k("gum")}" cx="${mouth.x + r}" cy="${mouth.y - scale}" r="${r}" fill="#ff8fc7" stroke="#e64980" stroke-width="1"/>`;
      return layers("", gum + burst({ x: mouth.x + 3 * r, y: mouth.y - scale }, "#ff8fc7", Math.max(2, scale / 2), fan(6, 40, 10), false, "pop"));
    }
    case "sing": {
      const body = k("sway");
      const notes = [0, 1, 2]
        .map((i) => `<g class="${k("note")}" style="--dx:${6 + i * 6}px;animation-delay:calc(var(--pf-t0,0s) + ${i * 0.45}s)">${px(["..xx", "..x.", "..x.", "xxx.", "xx.."], { x: "#1f2328" }, mouth.x + 4, mouth.y - 10, 2)}</g>`)
        .join("");
      const open = `<rect class="${k("show")}" x="${mouth.x - scale}" y="${mouth.y - scale}" width="${2 * scale}" height="${2 * scale}" rx="${scale}" fill="#3b1d1d"/>`;
      return layers(body, open, "", notes);
    }
    case "signature":
      return signature(SIGNATURE[species.id] ?? "bubbles");
  }

  function signature(move: (typeof SIGNATURE)[string]): TrickLayers {
    switch (move) {
      case "bubbles":
        return layers("", burst(mouth, "#dff4ff", 2 * scale, fan(4, 30, 34), true));
      case "dig":
        return layers(k("sneeze"), burst({ x: w / 2, y: h - scale }, "#7a5230", scale, fan(6, 70, 14)));
      case "hiss": {
        const fork = new RectBatch()
          .add("#e63946", mouth.x - scale / 2, mouth.y, scale, 2 * scale)
          .add("#e63946", mouth.x - 1.5 * scale, mouth.y + 2 * scale, scale, scale)
          .add("#e63946", mouth.x + 0.5 * scale, mouth.y + 2 * scale, scale, scale);
        return layers("", `<g class="${k("flick")}">${fork}</g>`);
      }
      case "spray":
        // From the tip of the trunk, up in a fountain.
        return layers("", burst({ x: w / 2, y: h - 2 * scale }, "#4ea8de", Math.max(2, scale), fan(7, 96, 84)));
      case "peck": {
        const seeds = new RectBatch();
        for (const dx of [-3, 2, 6]) seeds.add("#e9c46a", w / 2 + dx * scale, h - scale / 2, scale / 2 + 1, scale / 2 + 1);
        const body = k("peck");
        return layers(body, `<g class="${k("show")}">${seeds}</g>`);
      }
      case "zoomies": {
        const lines = new RectBatch();
        for (const y of [0.35, 0.55, 0.75]) lines.add("#8d96a0", -4 * scale, h * y, 3 * scale, Math.max(1, scale / 2));
        const body = k("zoom");
        return layers(body, `<g class="${k("show")}">${lines}</g>`);
      }
    }
  }
}

/** Idle and happy pets have the energy for tricks and emotes. */
export const playful = (mood: Mood) => mood === "happy" || mood === "idle";
