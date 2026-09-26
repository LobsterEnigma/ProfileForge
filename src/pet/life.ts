/**
 * A day in the pet's life: a 24-second script per mood (walk, stop, look around, sit, yawn,
 * hop, its species' own move…) written as data and compiled into CSS keyframes. Facing is
 * derived from the walking path, so side-view pets always look where they're going.
 *
 * Today's trick (behavior.ts) plays at 8.4–10.6s and 20.4–22.6s; every script keeps the pet
 * standing still then.
 */
import { seeded } from "../random.js";
import { RectBatch } from "../svg/batch.js";
import { renderPixels, type Grid } from "../svg/pixel.js";
import { pixelText } from "../svg/pixelfont.js";
import type { Mood } from "../types.js";
import { anchors, bubble } from "./behavior.js";
import type { Species } from "./species/types.js";
import type { EyeSwap } from "./sprite.js";
import { bowl } from "./visits.js";
import { COMMIT, FX_PALETTE, HEART, ZED } from "./sprites.js";

export const CYCLE = 24;

export type Span = [from: number, to: number];

interface Script {
  /** Horizontal offset (px) at each time (s); linear in between. */
  path: [t: number, x: number][];
  sits?: Span[];
  hops?: Span[];
  bigJumps?: Span[];
  spins?: Span[];
  shakes?: Span[];
  sniffs?: Span[];
  rolls?: Span[];
  /** When the species does its own thing. */
  act?: Span;
  yawns?: Span[];
  emotes?: { span: Span; glyph: Grid }[];
}

const QUESTION: Grid = ["xx.", "..x", ".x.", "...", ".x."];
const NOTE: Grid = ["..xx", "..x.", "..x.", "xxx.", "xx.."];
const BANG: Grid = ["x", "x", "x", ".", "x"];
const DOTS: Grid = [".....", ".....", ".....", ".....", "x.x.x"];

/** What a content pet might say instead of a ? or a ♪, picked fresh every day (short, so bubbles fit). */
const CHATTER = ["LGTM", "WIP", "TODO", "404", "YAY", "GG", "BRB", "NICE", "+1", "DONE", "OK!", "HI!", "LOL", "CODE"];

/**
 * Each mood has a couple of routines; the date picks today's. Every routine keeps the pet
 * standing still from 8.4–10.6s and 20.4–22.6s, when today's trick plays.
 */
export const SCRIPTS: Record<Mood, Script[]> = {
  idle: [
    {
      path: [[0, -34], [3, 10], [11, 10], [14, 34], [16, 34], [19, -20], [22.6, -20], [24, -34]],
      sits: [[6, 8]],
      yawns: [[6.4, 7.6]],
      act: [14.2, 16],
      hops: [[19.2, 20.2]],
      emotes: [
        { span: [3.4, 5.6], glyph: QUESTION },
        { span: [19, 20.3], glyph: NOTE },
      ],
    },
    // The explorer: sniffs something out on the right, dashes back, naps on the left.
    {
      path: [[0, 0], [2.5, 30], [5.5, 30], [7, -10], [11, -10], [13, -34], [18, -34], [20, 0], [24, 0]],
      sniffs: [[2.8, 4.1]],
      hops: [[5.6, 6.9]],
      sits: [[13.3, 15.8]],
      yawns: [[13.6, 14.8]],
      act: [16.1, 17.9],
      emotes: [
        { span: [4.1, 5.4], glyph: BANG },
        { span: [18.2, 19.8], glyph: NOTE },
      ],
    },
  ],
  happy: [
    {
      path: [[0, -34], [6, 34], [8.2, 34], [11, 34], [12.5, -34], [13.4, -34], [15, 20], [17, 20], [20.3, -10], [22.6, -10], [24, -34]],
      spins: [[6.2, 7.8]],
      bigJumps: [[15.2, 16.6]],
      emotes: [{ span: [15, 17], glyph: NOTE }],
    },
    // Zoomies: laps across the scene, then jumps for joy on both sides.
    {
      path: [[0, 0], [1.5, 34], [3, -34], [4.5, 34], [6, 0], [11, 0], [12, 20], [14, 20], [16, -30], [18, -30], [20, 0], [24, 0]],
      spins: [[6.2, 7.8]],
      bigJumps: [[12.2, 13.6], [16.2, 17.6]],
      emotes: [
        { span: [12, 14], glyph: pixelText("♥") },
        { span: [16, 17.8], glyph: NOTE },
      ],
    },
  ],
  hungry: [
    {
      path: [[0, -24], [6, 0], [9, 0], [12, 8], [24, 8]],
      shakes: [[6.2, 8.6]],
      sniffs: [[12.2, 14.4]],
      sits: [[15, 24]],
      emotes: [
        { span: [6.2, 8.6], glyph: pixelText("GRR") },
        { span: [14.6, 17.4], glyph: DOTS },
      ],
    },
    // Searching: wanders off looking for food, finds nothing, trudges back to the bowl.
    {
      path: [[0, 8], [2, 8], [5, -26], [12, -26], [15, 8], [24, 8]],
      sits: [[0, 1.8], [15.6, 24]],
      sniffs: [[5.3, 7]],
      shakes: [[10, 11.6]],
      emotes: [
        { span: [7.2, 9.4], glyph: QUESTION },
        { span: [10, 11.6], glyph: pixelText("GRR") },
      ],
    },
  ],
  sleeping: [
    {
      path: [[0, 0], [24, 0]],
      rolls: [[16, 16.8]],
    },
  ],
};

const pct = (t: number) => `${+((t / CYCLE) * 100).toFixed(3)}%`;

/** Keyframes that show something only during `spans` (steps). */
function showKeyframes(name: string, spans: Span[]): string {
  const frames = ["0%{opacity:0}"];
  for (const [a, b] of spans) frames.push(`${pct(a)}{opacity:1}`, `${pct(b)}{opacity:0}`);
  frames.push("100%{opacity:0}");
  return `@keyframes ${name}{${frames.join("")}}`;
}

/** The opposite: visible except during `spans`. */
function hideKeyframes(name: string, spans: Span[]): string {
  const frames = ["0%{opacity:1}"];
  for (const [a, b] of spans) frames.push(`${pct(a)}{opacity:0}`, `${pct(b)}{opacity:1}`);
  frames.push("100%{opacity:1}");
  return `@keyframes ${name}{${frames.join("")}}`;
}

/** Keyframes that apply `pose` during each span, easing in and out over `ramp` seconds. */
function poseKeyframes(name: string, spans: Span[], pose: (i: number) => string, ramp = 0.3): string {
  const frames = ["0%{transform:none}"];
  for (const [a, b] of spans) {
    frames.push(`${pct(a)}{transform:none}`, `${pct(Math.min(a + ramp, b))}{transform:${pose(0)}}`);
    frames.push(`${pct(Math.max(b - ramp, a))}{transform:${pose(1)}}`, `${pct(b)}{transform:none}`);
  }
  frames.push("100%{transform:none}");
  return `@keyframes ${name}{${frames.join("")}}`;
}

/** Keyframes stepping through `values` evenly within each span (for hops, shakes, sniffs). */
function beatKeyframes(name: string, spans: Span[], values: string[]): string {
  const frames = ["0%{transform:none}"];
  for (const [a, b] of spans) {
    const step = (b - a) / values.length;
    frames.push(`${pct(a)}{transform:none}`);
    values.forEach((v, i) => frames.push(`${pct(a + step * (i + 0.5))}{transform:${v}}`));
    frames.push(`${pct(b)}{transform:none}`);
  }
  frames.push("100%{transform:none}");
  return `@keyframes ${name}{${frames.join("")}}`;
}

/** Facing from the walking path: right while moving right, left while moving left, kept when still. */
function faceKeyframes(name: string, path: Script["path"]): string {
  let facing = 1;
  const frames = [`0%{transform:scaleX(1)}`];
  for (let i = 1; i < path.length; i++) {
    const [t0, x0] = path[i - 1]!;
    const [, x1] = path[i]!;
    const next = x1 > x0 ? 1 : x1 < x0 ? -1 : facing;
    if (next !== facing) {
      facing = next;
      frames.push(`${pct(t0)}{transform:scaleX(${facing})}`);
    }
  }
  frames.push(`100%{transform:scaleX(1)}`);
  return `@keyframes ${name}{${frames.join("")}}`;
}

export interface Life {
  css: string;
  /** Wraps shadow + pet: walks the path. */
  pathClass: string;
  /** Wraps the sprite: turns to face the way it walks (side-view pets only). */
  faceClass: string;
  /** Wraps the sprite: sits, hops, jumps, spins, shakes, sniffs, rolls, and the species' move. */
  bodyClasses: string[];
  /** Drawn over the sprite (sprite coordinates): yawns, emotes, particles, dreams. */
  overlay: string;
  /** Classes for the sprite's eyes: the open eyes hide while closed (yawns) or crossed ones show. */
  eyes: EyeSwap | null;
}

const SIGNATURE_MOVE: Record<string, (s: number, w: number, h: number) => { transform: string[]; particles?: string }> = {
  crab: () => ({ transform: ["translateX(-5px)", "translateX(5px)", "translateX(-5px)", "translateX(5px)", "translateX(-5px)", "translateX(5px)"] }),
  gopher: (s, w, h) => ({
    transform: ["scaleY(.6)", "scaleY(0)", "scaleY(0)", "scaleY(0)", "scaleY(1.15)", "scaleY(.95)"],
    particles: dirt(w, h, s),
  }),
  snake: () => ({ transform: ["rotate(-9deg)", "rotate(9deg)", "rotate(-9deg)", "rotate(9deg)", "rotate(-6deg)", "rotate(4deg)"] }),
  elephant: (s, w, h) => ({ transform: ["translateY(-2px)", "none", "translateY(-2px)", "none"], particles: spray(w, h, s) }),
  chick: () => ({ transform: ["translateY(-8px)", "translateY(-18px)", "translateY(-14px)", "translateY(-20px)", "translateY(-10px)", "none"] }),
  turtle: () => ({ transform: ["rotate(90deg) scale(.9)", "rotate(180deg) scale(.9)", "rotate(270deg) scale(.9)", "rotate(360deg) scale(.9)"] }),
};

function particles(color: string, from: { x: number; y: number }, size: number, moves: [number, number][], name: string): string {
  return moves
    .map(
      ([dx, dy], i) =>
        `<rect class="${name}" style="--dx:${dx}px;--dy:${dy}px;animation-delay:calc(var(--pf-t0,0s) + ${(i % 3) * 0.12}s)" x="${from.x}" y="${from.y}" width="${size}" height="${size}" fill="${color}"/>`,
    )
    .join("");
}

const dirt = (w: number, h: number, s: number) =>
  particles("#7a5230", { x: w / 2, y: h - s }, s, [[-26, -14], [-14, -22], [0, -26], [14, -22], [26, -14], [-20, -8], [20, -8]], "pf-life-burst");
const spray = (w: number, h: number, s: number) =>
  particles("#4ea8de", { x: w / 2, y: h - 2 * s }, s, [[-30, -56], [-14, -70], [0, -78], [14, -70], [30, -56], [-8, -62], [8, -62]], "pf-life-burst");

/** What the pet dreams of tonight, picked by date. */
const DREAMS: Grid[] = [
  COMMIT,
  ["..rr.", ".rrrr", "rrrr.", "rrr..", ".w...", "w...."], // a drumstick
  [".rrr.", "rrwrr", "rrrrr", ".rrr."], // the ball
  HEART,
  ["..y..", ".yyy.", "yyyyy", ".yyy.", ".y.y."], // a star
];
const DREAM_COLORS = { ...FX_PALETTE, r: "#e76f51", w: "#fff8e7", y: "#ffd23f" };

/** Builds today's script for this pet, drawn at `scale`, `w`×`h` px. */
export function lifeFor(
  mood: Mood,
  species: Species,
  scale: number,
  w: number,
  h: number,
  date: string,
  login: string,
  { crossed = [] }: { crossed?: Span[] } = {},
): Life {
  const routines = SCRIPTS[mood];
  const s = routines[Math.floor(seeded(`routine:${login}:${date}`)() * routines.length)]!;
  // No yawning while something sits on its nose: the eyes can only do one thing at a time.
  const overlaps = ([a0, a1]: Span) => crossed.some(([b0, b1]) => a0 < b1 && b0 < a1);
  const yawns = s.yawns?.filter((span) => !overlaps(span));
  const id = `${mood}-${species.id}`;
  const css: string[] = [];
  const bodyClasses: string[] = [];
  const overlay: string[] = [];
  const a = anchors(species);
  const top = a.top * scale;

  // Walking path and facing.
  const pathName = `pf-p-${id}`;
  css.push(`@keyframes ${pathName}{${s.path.map(([t, x]) => `${pct(t)}{transform:translateX(${x}px)}`).join("")}}`);
  css.push(`.${pathName}{animation:${pathName} ${CYCLE}s ease-in-out var(--pf-t0,0s) infinite}`);
  const faceName = `pf-f-${id}`;
  css.push(faceKeyframes(faceName, s.path), `.${faceName}{transform-box:fill-box;transform-origin:center;animation:${faceName} ${CYCLE}s steps(1) var(--pf-t0,0s) infinite}`);

  const body = (suffix: string, keyframes: string, timing = "ease-in-out") => {
    const name = `pf-b-${suffix}-${id}`;
    css.push(keyframes.replace("@keyframes X", `@keyframes ${name}`));
    css.push(`.${name}{transform-box:fill-box;transform-origin:50% 100%;animation:${name} ${CYCLE}s ${timing} var(--pf-t0,0s) infinite}`);
    bodyClasses.push(name);
  };
  if (s.sits) body("sit", poseKeyframes("X", s.sits, () => "scale(1.05,.88)"));
  if (s.hops) body("hop", beatKeyframes("X", s.hops, ["translateY(-9px)", "none", "translateY(-9px)", "none"]));
  if (s.bigJumps) body("jump", beatKeyframes("X", s.bigJumps, ["scale(1.06,.9)", "translateY(-26px) scale(.95,1.08)", "translateY(-22px)", "none"]));
  if (s.spins) body("spin", beatKeyframes("X", s.spins, ["translateY(-10px) scaleX(-1)", "translateY(-16px) scaleX(1)", "translateY(-10px) scaleX(-1)", "none"]), "steps(1)");
  if (s.shakes) body("shake", beatKeyframes("X", s.shakes, Array.from({ length: 10 }, (_, i) => `translateX(${i % 2 ? 2 : -2}px)`)), "linear");
  if (s.sniffs) body("sniff", beatKeyframes("X", s.sniffs, ["rotate(10deg)", "none", "rotate(10deg)", "none"]));
  if (s.rolls) body("roll", beatKeyframes("X", s.rolls, ["scale(1.1,.8) scaleX(-1)", "scaleX(-1)"]));

  // The species' own move.
  if (s.act) {
    const move = (SIGNATURE_MOVE[species.id] ?? SIGNATURE_MOVE.crab!)(scale, w, h);
    const origin = species.id === "turtle" ? "center" : "50% 100%";
    const name = `pf-b-act-${id}`;
    css.push(beatKeyframes(name, [s.act], move.transform));
    css.push(`.${name}{transform-box:fill-box;transform-origin:${origin};animation:${name} ${CYCLE}s ease-in-out var(--pf-t0,0s) infinite}`);
    bodyClasses.push(name);
    if (move.particles) {
      css.push(`.pf-life-burst{opacity:0;animation:pf-life-burst ${CYCLE}s ease-out var(--pf-t0,0s) infinite}`);
      css.push(
        `@keyframes pf-life-burst{0%,${pct(s.act[0])}{transform:translate(0,0);opacity:0}${pct(s.act[0] + 0.2)}{opacity:1}${pct(s.act[0] + 1.2)}{transform:translate(var(--dx),var(--dy));opacity:0}100%{opacity:0}}`,
      );
      overlay.push(move.particles);
    }
  }

  // Yawns: an open mouth, with the sprite's open eyes swapped for closed ones.
  const alts: EyeSwap["alts"] = [];
  if (yawns?.length) {
    const name = `pf-y-${id}`;
    alts.push({ cls: name, kind: "closed" });
    css.push(showKeyframes(name, yawns), `.${name}{opacity:0;animation:${name} ${CYCLE}s steps(1) var(--pf-t0,0s) infinite}`);
    const m = { x: a.mouth.x * scale, y: a.mouth.y * scale };
    overlay.push(`<rect class="${name}" x="${m.x - 1.5 * scale}" y="${m.y - scale}" width="${3 * scale}" height="${2.5 * scale}" rx="${scale}" fill="#3b1d1d"/>`);
    css.push(showKeyframes(`pf-yz-${id}`, yawns), `.pf-yz-${id}{opacity:0;animation:pf-yz-${id} ${CYCLE}s steps(1) var(--pf-t0,0s) infinite}`);
    overlay.push(`<g class="pf-yz-${id}">${renderPixels([{ x: 0, y: 0, grid: ZED }], FX_PALETTE, { x: w - scale, y: top - 12, scale: 2 })}</g>`);
  }
  // Cross-eyed while something sits on its nose.
  if (crossed.length) {
    const name = `pf-x-${id}`;
    alts.push({ cls: name, kind: "crossed" });
    css.push(showKeyframes(name, crossed), `.${name}{opacity:0;animation:${name} ${CYCLE}s steps(1) var(--pf-t0,0s) infinite}`);
  }
  let eyes: EyeSwap | null = null;
  if (alts.length) {
    eyes = { hide: `pf-yh-${id}`, alts };
    css.push(hideKeyframes(eyes.hide, [...(yawns ?? []), ...crossed].sort((p, q) => p[0] - q[0])), `.${eyes.hide}{animation:${eyes.hide} ${CYCLE}s steps(1) var(--pf-t0,0s) infinite}`);
  }

  // Emote bubbles on cue.
  // Content pets sometimes say something instead: a different word or two every day.
  const chatter = seeded(`chat:${login}:${date}`);
  const talkative = mood === "idle" || mood === "happy";
  s.emotes?.forEach(({ span, glyph: plain }, i) => {
    const glyph = talkative && chatter() < 0.5 ? pixelText(CHATTER[Math.floor(chatter() * CHATTER.length)]!) : plain;
    const name = `pf-e${i}-${id}`;
    css.push(showKeyframes(name, [span]), `.${name}{opacity:0;animation:${name} ${CYCLE}s steps(1) var(--pf-t0,0s) infinite}`);
    overlay.push(bubble(glyph, w - 6, top - 2, name));
  });

  // Happy pets float hearts; legendary ones sparkle wherever they go.
  if (mood === "happy") {
    for (const [dx, delay] of [[0.15, 0.3], [0.55, 1.2], [0.9, 2.1]] as const) {
      overlay.push(`<g class="pf-rise" style="animation-delay:-${delay}s">${renderPixels([{ x: 0, y: 0, grid: HEART }], FX_PALETTE, { x: w * dx, y: top - 4, scale: 2 })}</g>`);
    }
  }

  // Hungry pets end up sitting by the empty bowl, dreaming of commits.
  if (mood === "hungry") {
    const name = `pf-want-${id}`;
    css.push(showKeyframes(name, [[17.6, 24]]), `.${name}{opacity:0;animation:${name} ${CYCLE}s steps(1) var(--pf-t0,0s) infinite}`);
    const bx = w - 6;
    const by = top - 30;
    overlay.push(
      `<g class="${name}"><rect x="${bx - 6}" y="${by + 26}" width="4" height="4" rx="1" fill="#ffffff" stroke="#8d96a0"/><rect x="${bx}" y="${by + 18}" width="6" height="6" rx="2" fill="#ffffff" stroke="#8d96a0"/><rect x="${bx + 2}" y="${by - 6}" width="28" height="24" rx="8" fill="#ffffff" stroke="#8d96a0" stroke-width="1.2"/>${renderPixels([{ x: 0, y: 0, grid: COMMIT }], FX_PALETTE, { x: bx + 9, y: by - 1, scale: 3.5 })}</g>`,
    );
  }

  // Sleeping pets dream.
  if (mood === "sleeping") {
    const dream = DREAMS[Math.floor(seeded(`dream:${login}:${date}`)() * DREAMS.length)]!;
    const name = `pf-dream-${id}`;
    css.push(showKeyframes(name, [[6, 12]]), `.${name}{opacity:0;animation:${name} ${CYCLE}s steps(1) var(--pf-t0,0s) infinite}`);
    const bx = w - 4;
    const by = top - 34;
    const cloud = new RectBatch().add("#ffffff", bx, by, 28, 22).add("#ffffff", bx + 4, by - 3, 20, 3).add("#ffffff", bx + 4, by + 22, 20, 3);
    overlay.push(
      `<g class="${name}"><rect x="${bx - 8}" y="${by + 26}" width="4" height="4" rx="2" fill="#ffffff" opacity=".9"/><rect x="${bx - 3}" y="${by + 19}" width="6" height="6" rx="3" fill="#ffffff" opacity=".9"/><g opacity=".92">${cloud}</g>${renderPixels([{ x: 0, y: 0, grid: dream }], DREAM_COLORS, { x: bx + 6, y: by + 4, scale: 3 })}</g>`,
    );
  }

  return { css: css.join("\n"), pathClass: pathName, faceClass: species.facing === "right" ? faceName : "", bodyClasses, overlay: overlay.join(""), eyes };
}

/** An empty bowl for a hungry pet to sniff at. */
export const emptyBowl = (x: number, ground: number) => bowl(x, ground, null);
