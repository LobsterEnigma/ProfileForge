/**
 * What a visit looks like: for 12 hours after someone feeds, bathes or plays with the pet, the
 * card shows it happening. The pet eats from a bowl, sits in a wooden tub with a rubber duck,
 * or plays fetch. Each is its own little scene, so you can tell them apart at a glance.
 */
import type { CareAction } from "../care/commands.js";
import type { Visitor } from "../care/view.js";
import { outlined, renderPixels, type Grid } from "../svg/pixel.js";
import { pixelText } from "../svg/pixelfont.js";
import type { PetState } from "../types.js";
import { anchors, bubble, emoteBubble } from "./behavior.js";
import { getSpecies, type Species } from "./species/index.js";
import { HEART, FX_PALETTE } from "./sprites.js";

export interface SceneAnchor {
  /** Horizontal center of the scene. */
  cx: number;
  /** The y the pet stands on. */
  ground: number;
}

export interface VisitScene {
  svg: string;
  /** Styles only this scene needs (paths sampled for this species). */
  css?: string;
  /** Where the pet ended up, for effects like floating Zzz. */
  box: { x: number; y: number; w: number; h: number };
}

/**
 * The visits to show, oldest first: every kind of visit from the last 12 hours takes a turn.
 * Sleeping pets only get a bath (they can't eat or play asleep).
 */
export function activeVisits(state: PetState): Visitor[] {
  if (state.ranAway || state.stage === "egg") return [];
  const all = state.care?.visitors ?? (state.care?.visitor ? [state.care.visitor] : []);
  return state.mood === "sleeping" ? all.filter((v) => v.action === "bath") : all;
}

/** The latest visit on show, if any. */
export const activeVisit = (state: PetState): CareAction | null => activeVisits(state).at(-1)?.action ?? null;

/** Seconds each visit plays before the next one takes its turn. */
export const TURN = 6;

/** Shows the `k`th of `n` things for its turn only (steps, so nothing overlaps). */
export function turnCss(n: number): string {
  return Array.from({ length: n }, (_, k) => {
    const a = +((k / n) * 100).toFixed(3);
    const b = +(((k + 1) / n) * 100).toFixed(3);
    const frames = k === 0 ? `0%{opacity:1}${b}%{opacity:0}100%{opacity:0}` : `0%{opacity:0}${a}%{opacity:1}${b}%{opacity:0}100%{opacity:0}`;
    return `.pf-turn${k}{animation:pf-turn${k} ${n * TURN}s steps(1) infinite}@keyframes pf-turn${k}{${frames}}`;
  }).join("\n");
}

export const VISIT_CSS = `
.pf-scrub{transform-box:fill-box;transform-origin:50% 100%;animation:pf-scrub 1.6s ease-in-out infinite}
@keyframes pf-scrub{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg) translateY(-1px)}}
.pf-suds{animation:pf-suds 1.6s ease-in-out infinite}
@keyframes pf-suds{0%,100%{transform:translate(0,0)}50%{transform:translate(1px,-2px)}}
.pf-duck{animation:pf-duck 2.2s ease-in-out infinite}
@keyframes pf-duck{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-2px) rotate(-6deg)}}
.pf-drop{opacity:0;animation:pf-drop .7s linear infinite}
@keyframes pf-drop{0%{transform:translateY(0);opacity:0}10%{opacity:.9}90%{opacity:.9}100%{transform:translateY(var(--fall));opacity:0}}
.pf-bubble{opacity:0;animation:pf-bubble 3s ease-out infinite}
@keyframes pf-bubble{0%{transform:translate(0,0);opacity:0}10%{opacity:1}80%{opacity:1;transform:translate(var(--dx),-34px)}82%,100%{opacity:0;transform:translate(var(--dx),-36px)}}
.pf-steam{opacity:0;animation:pf-steam 4s ease-out infinite}
@keyframes pf-steam{0%{transform:translate(0,0);opacity:0}25%{opacity:.55}100%{transform:translate(4px,-26px);opacity:0}}
.pf-run{animation:pf-run .3s ease-in-out infinite}
@keyframes pf-run{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
.pf-catch{opacity:0;transform-box:fill-box;transform-origin:0 100%;animation:pf-catch 6s steps(1) infinite}
.pf-dust{opacity:0;transform-box:fill-box;transform-origin:center;animation:pf-dust 6s ease-out infinite}
`;

/** A pet bowl with a paw print, and the food heaped in it: full, half, nearly gone. */
const BOWL: Grid = outlined([
  "hhhhhhhhhhhhhh",
  "rrrrrrrrrrrrrr",
  ".rrrrrwrwrrrr.",
  ".rrrrrwwwrrrr.",
  "..rrrrrrrrrr..",
  "...dddddddd...",
]);
const BOWL_COLORS = { h: "#ff8787", r: "#e03131", w: "#ffe3e3", d: "#a61e1e", o: "#5c1010" };
const HEAPS: Grid[] = [
  ["....kkKk....", "..kkKkkkKk..", ".kKkkkkKkkk.", "kkkKkkkkkKkk"],
  ["............", "............", "...kKkkKk...", ".kkkkKkkkkk."],
  ["............", "............", "............", "...kk..Kk..."],
];
const KIBBLE = { k: "#b5651d", K: "#e8a45a" };

/** A bag of food, tipped to pour, with each species' favourite on the label. */
const BAG: Grid = outlined(["..bbbbbb..", ".bbbbbbbb.", "bbbbbbbbbb", "bwwwwwwwwb", "bwwwwwwwwb", "bwwwwwwwwb", "bwwwwwwwwb", "bbbbbbbbbb", "bbbbbbbbbb", ".bbbbbbbb."]);
const BAG_COLORS = { b: "#4c6ef5", w: "#ffffff", o: "#1b2f7a" };
const TREATS: Record<string, { grid: Grid; colors: Record<string, string> }> = {
  crab: { grid: [".xx.x", "xxxxx", ".xx.x"], colors: { x: "#4dabf7" } },
  gopher: { grid: ["..gg", ".oo.", "oo..", "o..."], colors: { g: "#2f9e44", o: "#f76707" } },
  snake: { grid: [".w.", "www", "www", ".w."], colors: { w: "#f1e3c6" } },
  elephant: { grid: [".p.", "ppp", ".p.", "ppp", ".p."], colors: { p: "#c68b59" } },
  chick: { grid: [".y.", "yyy", "yyy", "yyy", ".g."], colors: { y: "#fcc419", g: "#2f9e44" } },
  turtle: { grid: ["..gg", ".ggg", "ggg.", "g..."], colors: { g: "#51cf66" } },
};

/** A white clawfoot tub, seen from the side, with gold feet. */
const TUB: Grid = outlined([
  ".hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh.",
  "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",
  "swwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwws",
  ".wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwws.",
  ".wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwws.",
  ".swwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwss.",
  "..wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwss..",
  "..swwwwwwwwwwwwwwwwwwwwwwwwwwwwsss..",
  "...sswwwwwwwwwwwwwwwwwwwwwwwwwssss..",
  ".....sssssssssssssssssssssssssss....",
  "....ggg......................ggg....",
  "...gg..........................gg...",
]);
const TUB_COLORS = { h: "#ffffff", w: "#eef3f8", s: "#c3cfdb", g: "#e0a800", o: "#51606f" };

/** A cluster of suds: white bubbles with a pale blue underside. */
const SUDS: Grid = outlined(["..ww.ww..", ".wwhwwww.", "wwwwwwhww", "wbwwwwwbw", ".bbwbbbb."]);
const SUDS_COLORS = { w: "#ffffff", h: "#ffffff", b: "#cfe3f5", o: "#9fb6cc" };

const DUCK: Grid = outlined(["..yy...", ".yyyk..", ".yyyyrr", "yyyyy..", "yyyyyyy", ".yyyyy."]);
const DUCK_COLORS = { y: "#ffd23f", k: "#1a1a1a", r: "#f28c28", o: "#8a5a00" };

const SHOWER_HEAD: Grid = outlined(["cccccc", "cCCCCc", ".cccc."]);
const SHOWER_COLORS = { c: "#b8c4d0", C: "#8d9aa8", o: "#51606f" };

/** A tennis ball, in two frames so it looks like it's rolling. */
const BALL_A: Grid = outlined([".yyyy.", "yyyywy", "ywyyyy", "yywyyy", "yyywyy", ".yyyy."]);
const BALL_B: Grid = outlined([".yyyy.", "ywyyyy", "yywyyy", "yyyywy", "yyyyyw", ".yyyy."]);
const BALL_COLORS = { y: "#c6e33a", w: "#ffffff", o: "#5f7a12" };

/** The visitor's hand, reaching in from the right to throw. */
const HAND: Grid = outlined(["..ssss....", ".sssssss..", "sssssssccc", "sssssssccc", ".ssssss.cc", "..sss....."]);
const HAND_COLORS = { s: "#f2c29b", c: "#4c6ef5", o: "#8a5a3c" };

const px = (grid: Grid, colors: Record<string, string>, x: number, y: number, scale: number) =>
  renderPixels([{ x: 0, y: 0, grid }], colors, { x, y, scale });

function shadow(x: number, y: number, w: number): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="6" rx="3" opacity=".3" style="fill:var(--pf-ground-dark)"/>`;
}

/** A food bowl on the ground, for a pet that's asleep (it'll eat later) or in the eating scene. */
export const bowl = (x: number, ground: number, heap: 0 | 1 | 2 | null = 0) =>
  (heap === null ? "" : px(HEAPS[heap]!, KIBBLE, x + 3, ground - 26, 3)) + px(BOWL, BOWL_COLORS, x, ground - 21, 3);
export const ball = (x: number, ground: number) => px(BALL_A, BALL_COLORS, x, ground - 16, 2);

/**
 * 🍖 Dinner time. A bag of food tips in from the corner and pours a heap into the bowl while
 * the pet bounces with excitement; then it trots over and digs in, bite after bite (crumbs
 * flying, the heap going down), licks its lips, and wanders back, happy.
 */
const MEAL = 6;

function feed(sprite: string, w: number, h: number, scale: number, stage: SceneAnchor, species: Species): VisitScene & { css: string } {
  const pct = (t: number) => `${+((t / MEAL) * 100).toFixed(2)}%`;
  const side = species.facing === "right";
  const bowlW = BOWL[0]!.length * 3;
  const bowlX = stage.cx + 44 - bowlW / 2;
  const box = { x: stage.cx - w / 2, y: stage.ground - h + scale, w, h };
  // Waiting spot on the left, eating spot with its face over the bowl.
  const wait = -34;
  const eat = bowlX - (stage.cx + w / 2) + (side ? 10 : 18);

  // The bag slides in, tips over to pour, and leaves.
  const bagX = bowlX + bowlW - 14;
  const bagY = stage.ground - 92;
  const treat = TREATS[species.id] ?? TREATS.crab!;
  const bag =
    `<g class="pf-bag"><g transform="translate(${bagX} ${bagY})">${px(BAG, BAG_COLORS, 0, 0, 3)}` +
    `${px(treat.grid, treat.colors, 18 - (treat.grid[0]!.length * 3) / 2, 18 - (treat.grid.length * 3) / 2 + 3, 3)}</g></g>`;
  const spout = { x: bagX - 2, y: bagY + 20 };
  const kibble = Array.from({ length: 10 }, (_, i) => {
    const t = 0.55 + i * 0.09;
    const dx = bowlX + 12 + (i % 4) * 5 - spout.x;
    const dy = stage.ground - 26 - spout.y;
    return `<rect class="pf-kib" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${t}s" x="${spout.x}" y="${spout.y}" width="3" height="3" fill="${i % 2 ? KIBBLE.K : KIBBLE.k}"/>`;
  }).join("");

  // The heap: growing as it's poured, shrinking as it's eaten.
  const heapShown = (level: number, from: number, to: number) =>
    `.pf-heap${level}{opacity:0;animation:pf-heap${level} ${MEAL}s steps(1) infinite}@keyframes pf-heap${level}{0%{opacity:0}${pct(from)}{opacity:1}${pct(to)}{opacity:0}100%{opacity:0}}`;
  const heaps = HEAPS.map((heap, i) => `<g class="pf-heap${i}">${px(heap, KIBBLE, bowlX + 3, stage.ground - 26, 3)}</g>`).reverse().join("");

  // Bites: five dips of the head into the bowl.
  const bites = [2.1, 2.6, 3.1, 3.6, 4.1];
  const dip = side ? "translateY(4px) rotate(10deg)" : "rotate(14deg) translateY(3px)";
  const chompFrames = ["0%{transform:none}", ...bites.flatMap((b) => [`${pct(b)}{transform:none}`, `${pct(b + 0.2)}{transform:${dip}}`, `${pct(b + 0.4)}{transform:none}`]), "100%{transform:none}"].join("");
  const crumbs = bites
    .flatMap((b, i) =>
      [[-10, -14], [8, -18], [-2, -22]].map(([dx, dy], j) => `<rect class="pf-crumb" style="--dx:${dx! + i}px;--dy:${dy}px;animation-delay:${b + 0.22 + j * 0.03}s" x="${bowlX + bowlW / 2}" y="${stage.ground - 24}" width="3" height="3" fill="${j % 2 ? KIBBLE.K : KIBBLE.k}"/>`),
    )
    .join("");

  const a = anchors(species);
  const mouth = { x: a.mouth.x * scale, y: a.mouth.y * scale };
  const tongue = `<rect class="pf-lick" x="${mouth.x - scale}" y="${mouth.y - scale / 2}" width="${2 * scale}" height="${1.5 * scale}" rx="${scale / 2}" fill="#ff6b8b"/>`;
  const excited = emoteBubble("bang", w - 6, -4, "pf-want-food");
  const nom = bubble(pixelText("NOM"), w - 6, -4, "pf-nom");
  const heart = `<g class="pf-yum">${px(HEART, FX_PALETTE, w / 2 - 5, -10, 2)}</g>`;

  const css = [
    `.pf-bag{transform-box:fill-box;transform-origin:50% 50%;animation:pf-bag ${MEAL}s ease-in-out infinite}@keyframes pf-bag{0%{transform:translate(50px,-40px)}${pct(0.35)}{transform:translate(0,0)}${pct(0.55)},${pct(1.45)}{transform:rotate(-65deg)}${pct(1.6)}{transform:rotate(-10deg)}${pct(1.9)},100%{transform:translate(50px,-40px)}}`,
    `.pf-kib{opacity:0;animation:pf-kib ${MEAL}s cubic-bezier(.4,0,1,1) infinite}@keyframes pf-kib{0%{opacity:1;transform:translate(0,0)}7%{opacity:1;transform:translate(var(--dx),var(--dy))}7.1%,100%{opacity:0}}`,
    heapShown(2, 0.75, 1.0),
    heapShown(1, 1.0, 1.3),
    // Full once poured; eaten down in stages.
    `.pf-heap0{opacity:0;animation:pf-heap0 ${MEAL}s steps(1) infinite}@keyframes pf-heap0{0%{opacity:0}${pct(1.3)}{opacity:1}${pct(2.9)}{opacity:0}100%{opacity:0}}`,
    `.pf-heap1b{opacity:0;animation:pf-heap1b ${MEAL}s steps(1) infinite}@keyframes pf-heap1b{0%{opacity:0}${pct(2.9)}{opacity:1}${pct(3.9)}{opacity:0}100%{opacity:0}}`,
    `.pf-heap2b{opacity:0;animation:pf-heap2b ${MEAL}s steps(1) infinite}@keyframes pf-heap2b{0%{opacity:0}${pct(3.9)}{opacity:1}${pct(4.5)}{opacity:0}100%{opacity:0}}`,
    `.pf-meal-walk{animation:pf-meal-walk ${MEAL}s ease-in-out infinite}@keyframes pf-meal-walk{0%,${pct(1.5)}{transform:translateX(${wait}px)}${pct(1.95)},${pct(4.9)}{transform:translateX(${eat}px)}${pct(5.7)},100%{transform:translateX(${wait}px)}}`,
    `.pf-meal-bounce{animation:pf-meal-bounce ${MEAL}s ease-in-out infinite}@keyframes pf-meal-bounce{0%,${pct(0.2)},${pct(0.5)},${pct(0.8)},${pct(1.1)},${pct(1.4)},${pct(4.55)},${pct(4.95)},100%{transform:none}${pct(0.35)},${pct(0.65)},${pct(0.95)},${pct(1.25)}{transform:translateY(-8px)}${pct(4.75)}{transform:translateY(-10px)}}`,
    `.pf-chomp{transform-box:fill-box;transform-origin:50% 100%;animation:pf-chomp ${MEAL}s ease-in-out infinite}@keyframes pf-chomp{${chompFrames}}`,
    `.pf-crumb{opacity:0;animation:pf-crumb ${MEAL}s ease-out infinite}@keyframes pf-crumb{0%{transform:translate(0,0);opacity:1}6%{transform:translate(var(--dx),var(--dy));opacity:0}100%{opacity:0}}`,
    `.pf-want-food{opacity:0;animation:pf-want-food ${MEAL}s steps(1) infinite}@keyframes pf-want-food{0%{opacity:0}${pct(0.3)}{opacity:1}${pct(1.4)}{opacity:0}100%{opacity:0}}`,
    `.pf-nom{opacity:0;animation:pf-nom ${MEAL}s steps(1) infinite}@keyframes pf-nom{0%{opacity:0}${pct(2.2)}{opacity:1}${pct(4.4)}{opacity:0}100%{opacity:0}}`,
    `.pf-lick{opacity:0;animation:pf-lick ${MEAL}s steps(1) infinite}@keyframes pf-lick{0%{opacity:0}${pct(4.6)}{opacity:1}${pct(4.75)}{opacity:0}${pct(4.9)}{opacity:1}${pct(5.05)}{opacity:0}100%{opacity:0}}`,
    `.pf-yum{opacity:0;animation:pf-yum ${MEAL}s ease-out infinite}@keyframes pf-yum{0%,${pct(4.7)}{opacity:0;transform:translate(0,0)}${pct(4.8)}{opacity:1}${pct(5.8)},100%{opacity:0;transform:translate(4px,-24px)}}`,
  ].join("\n");

  const pet =
    `<g class="pf-meal-walk">${shadow(box.x + w * 0.1, box.y + h - 2, w * 0.8)}<g transform="translate(${box.x} ${box.y})">` +
    `<g class="pf-meal-bounce"><g class="pf-chomp">${sprite}${tongue}</g></g>${excited}${nom}${heart}</g></g>`;
  const eaten = `<g class="pf-heap1b">${px(HEAPS[1]!, KIBBLE, bowlX + 3, stage.ground - 26, 3)}</g><g class="pf-heap2b">${px(HEAPS[2]!, KIBBLE, bowlX + 3, stage.ground - 26, 3)}</g>`;
  return {
    svg: `${pet}${heaps}${eaten}${px(BOWL, BOWL_COLORS, bowlX, stage.ground - 21, 3)}${crumbs}${kibble}${bag}`,
    box,
    css,
  };
}

/**
 * 🛁 A bubble bath: the pet sits in a clawfoot tub up to its chin, under a running shower,
 * with suds on its head and over the rim, a rubber duck, rising bubbles and a little steam.
 */
function bath(sprite: string, w: number, h: number, scale: number, stage: SceneAnchor, species: Species, asleep: boolean): VisitScene {
  const tubW = TUB[0]!.length * 3;
  const tubH = TUB.length * 3;
  const tubX = stage.cx - tubW / 2;
  const tubY = stage.ground - tubH + 3;
  // Sitting in the water, the rim just under its mouth.
  const box = { x: stage.cx - w / 2, y: Math.round(tubY + 4 - h * 0.7), w, h };

  const crown = { x: box.x + species.crownAnchor.x * scale, y: box.y + species.crownAnchor.y * scale };
  // A little crown of suds on top of its head, clear of the eyes.
  const headSuds = `<g class="pf-suds">${px(SUDS, SUDS_COLORS, crown.x - 11, crown.y - 13, 2)}</g>`;
  const rimSuds = [-50, -30, 18, 40]
    .map((dx, i) => `<g class="pf-suds" style="animation-delay:-${i * 0.4}s">${px(SUDS, SUDS_COLORS, stage.cx + dx - 9, tubY - 9 + (i % 2) * 2, 2)}</g>`)
    .join("");

  // A shower head on a gold pipe from the tub's end, raining on the pet's head.
  const pipeX = tubX + tubW - 12;
  const headY = Math.max(stage.ground - 128, box.y - 50);
  const pipe =
    `<rect x="${pipeX}" y="${headY + 2}" width="4" height="${tubY - headY}" fill="#e0a800"/>` +
    `<rect x="${stage.cx + 6}" y="${headY}" width="${pipeX - stage.cx - 2}" height="4" fill="#e0a800"/>` +
    `<rect x="${pipeX + 4}" y="${headY + 2}" width="1" height="${tubY - headY}" fill="#8a6a00"/>`;
  const head = px(SHOWER_HEAD, SHOWER_COLORS, stage.cx - 12, headY + 1, 3);
  const fall = box.y - headY - 26;
  const drops = [-9, -4, 1, 6, 11]
    .map((dx, i) => `<rect class="pf-drop" style="--fall:${fall}px;animation-delay:-${(i * 0.29) % 0.7}s" x="${stage.cx + dx}" y="${headY + 16}" width="2" height="4" fill="#7cc4f2"/>`)
    .join("");

  // Bubbles float up at the sides, away from the pet's face.
  const bubbles = [
    [-46, 4, 0],
    [-36, -6, 0.9],
    [38, 6, 1.7],
    [48, -4, 0.5],
    [-42, 3, 2.3],
  ]
    .map(
      ([x, dx, delay]) =>
        `<g class="pf-bubble" style="--dx:${dx}px;animation-delay:-${delay}s">${px(outlined([".b.", "bhb", ".b."]), { b: "#dff1ff", h: "#ffffff", o: "#8ec5ea" }, stage.cx + x! - 4, tubY - 6, 2)}</g>`,
    )
    .join("");
  const steam = [-40, -24, 32]
    .map((x, i) => `<g class="pf-steam" style="animation-delay:-${i * 1.3}s">${px(["x.", ".x", "x.", ".x"], { x: "#ffffff" }, stage.cx + x, tubY - 16, 2)}</g>`)
    .join("");
  const duck = `<g class="pf-duck">${px(DUCK, DUCK_COLORS, stage.cx + 24, tubY - 12, 2)}</g>`;
  const pet = asleep ? sprite : `<g class="pf-scrub">${sprite}</g>`;

  return {
    svg:
      `${shadow(tubX + 8, stage.ground + 1, tubW - 16)}${pipe}${head}${steam}` +
      `<g transform="translate(${box.x} ${box.y})">${pet}</g>${headSuds}${asleep ? "" : drops}` +
      `${px(TUB, TUB_COLORS, tubX, tubY, 3)}${rimSuds}${duck}${bubbles}`,
    box,
  };
}

/**
 * 🎾 Fetch. The visitor's hand throws a tennis ball; it arcs over, bounces twice and rolls; the
 * pet chases it, pounces, carries it back in its mouth and tosses it home. Positions are sampled
 * from the choreography below, so the ball stays in the pet's mouth while it runs.
 */
const FETCH = 6;

interface Fetch {
  /** Pet centre, relative to the scene's centre, and its height off the ground. */
  pet: (t: number) => { x: number; y: number };
  /** The ball's centre relative to the scene's centre and the ground, or null while held. */
  ball: (t: number) => { x: number; y: number } | null;
}

const lerp = (a: number, b: number, u: number) => a + (b - a) * Math.min(1, Math.max(0, u));
/** A throw from (x0, y0) to (x1, y1), rising `peak` px above the higher end. */
function arc(t: number, t0: number, t1: number, x0: number, y0: number, x1: number, y1: number, peak: number) {
  const u = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
  const top = Math.min(y0, y1) - peak;
  const y = (1 - u) ** 2 * y0 + 2 * u * (1 - u) * (2 * top - (y0 + y1) / 2) + u ** 2 * y1;
  return { x: lerp(x0, x1, u), y };
}

const CHOREOGRAPHY: Fetch = {
  pet: (t) => {
    const hop = (a: number, b: number, height: number) => (t >= a && t <= b ? -Math.sin(((t - a) / (b - a)) * Math.PI) * height : 0);
    // Running bounce while moving.
    const trot = (a: number, b: number) => (t >= a && t <= b ? -Math.abs(Math.sin(((t - a) / 0.3) * Math.PI)) * 3 : 0);
    let x = 0;
    if (t < 0.9) x = 0;
    else if (t < 2.3) x = lerp(0, -44, (t - 0.9) / 1.4);
    else if (t < 2.6) x = lerp(-44, -52, (t - 2.3) / 0.3);
    else if (t < 3.2) x = -52;
    else if (t < 4.4) x = lerp(-52, 8, (t - 3.2) / 1.2);
    else if (t < 5.2) x = 8;
    else x = lerp(8, 0, (t - 5.2) / 0.8);
    const y = trot(0.9, 2.3) + hop(2.3, 2.6, 16) + hop(2.75, 2.95, 5) + hop(3.0, 3.2, 5) + trot(3.2, 4.4) + hop(4.65, 5.05, 18);
    return { x, y };
  },
  ball: (t) => {
    if (t < 0.35) return { x: 84, y: -62 };
    // Kept inside the scene: even a big pet pouncing on it stays in view.
    if (t < 1.5) return arc(t, 0.35, 1.5, 84, -62, -28, 0, 30);
    if (t < 1.9) return arc(t, 1.5, 1.9, -28, 0, -42, 0, 16);
    if (t < 2.15) return arc(t, 1.9, 2.15, -42, 0, -48, 0, 5);
    if (t < 2.5) return { x: lerp(-48, -52, (t - 2.15) / 0.35), y: 0 };
    if (t < 4.75) return null;
    return arc(t, 4.75, 5.55, 8, -40, 84, -62, 46);
  },
};

function play(sprite: string, w: number, h: number, scale: number, stage: SceneAnchor, species: Species): VisitScene & { css: string } {
  const side = species.facing === "right";
  const a = anchors(species);
  // Where the ball sits when it's in the pet's mouth, relative to the pet's centre and feet.
  const mouth = { dx: a.mouth.x * scale - w / 2, dy: -(h - a.mouth.y * scale) - 2 };
  const steps = Array.from({ length: FETCH * 10 + 1 }, (_, i) => i / 10);
  const pct = (t: number) => `${+((t / FETCH) * 100).toFixed(2)}%`;
  const r = (n: number) => Math.round(n * 10) / 10;

  // Which way the pet faces: towards where it's heading (side-view pets only).
  const facing = (t: number) => {
    const now = CHOREOGRAPHY.pet(t).x;
    const next = CHOREOGRAPHY.pet(Math.min(FETCH, t + 0.1)).x;
    if (next < now - 0.01) return -1;
    if (next > now + 0.01) return 1;
    return t < 0.9 || t > 5.2 ? 1 : t < 3.2 ? -1 : 1;
  };
  const held = (t: number) => {
    const p = CHOREOGRAPHY.pet(t);
    const dx = side ? facing(t) * Math.abs(mouth.dx) : mouth.dx;
    return { x: p.x + dx, y: p.y + mouth.dy };
  };

  const petFrames = steps.map((t) => { const p = CHOREOGRAPHY.pet(t); return `${pct(t)}{transform:translate(${r(p.x)}px,${r(p.y)}px)}`; }).join("");
  const ballFrames = steps
    .map((t) => {
      const b = CHOREOGRAPHY.ball(t) ?? held(t);
      return `${pct(t)}{transform:translate(${r(b.x)}px,${r(b.y)}px)}`;
    })
    .join("");
  const shadowFrames = steps
    .map((t) => {
      const b = CHOREOGRAPHY.ball(t) ?? held(t);
      const k = Math.max(0.35, 1 + b.y / 80);
      return `${pct(t)}{transform:translateX(${r(b.x)}px) scale(${r(k)});opacity:${t < 0.35 || t > 5.5 ? 0 : r(0.35 * k)}}`;
    })
    .join("");
  const faceFrames = side ? steps.map((t) => `${pct(t)}{transform:scaleX(${facing(t)})}`).join("") : "";

  const css = [
    `.pf-fetch-pet{animation:pf-fetch-pet ${FETCH}s linear infinite}@keyframes pf-fetch-pet{${petFrames}}`,
    `.pf-fetch-ball{animation:pf-fetch-ball ${FETCH}s linear infinite}@keyframes pf-fetch-ball{${ballFrames}}`,
    `.pf-fetch-shadow{transform-box:fill-box;transform-origin:center;animation:pf-fetch-shadow ${FETCH}s linear infinite}@keyframes pf-fetch-shadow{${shadowFrames}}`,
    side ? `.pf-fetch-face{transform-box:fill-box;transform-origin:center;animation:pf-fetch-face ${FETCH}s steps(1) infinite}@keyframes pf-fetch-face{${faceFrames}}` : "",
    // Crouch before the throw, squash on landing the pounce and the toss.
    `.pf-fetch-squash{transform-box:fill-box;transform-origin:50% 100%;animation:pf-fetch-squash ${FETCH}s ease-in-out infinite}@keyframes pf-fetch-squash{0%,${pct(0.8)},${pct(2.5)},${pct(2.75)},${pct(4.5)},${pct(5.15)},${pct(5.5)},100%{transform:none}${pct(0.3)}{transform:scale(1.08,.88)}${pct(2.62)}{transform:scale(1.14,.82)}${pct(4.62)}{transform:scale(1.1,.86)}${pct(5.1)}{transform:scale(1.06,.9)}${pct(5.8)}{transform:scale(1.06,.9)}}`,
    `.pf-ball-a{animation:pf-ball-a .3s steps(1) infinite}.pf-ball-b{opacity:0;animation:pf-ball-a .3s steps(1) infinite;animation-delay:-.15s}@keyframes pf-ball-a{0%{opacity:1}50%{opacity:0}}`,
    `.pf-hand{animation:pf-hand ${FETCH}s ease-in-out infinite}@keyframes pf-hand{0%{transform:translateX(30px)}${pct(0.15)}{transform:translateX(0)}${pct(0.45)}{transform:translateX(-6px) rotate(-8deg)}${pct(0.8)},${pct(5.1)}{transform:translateX(30px)}${pct(5.45)}{transform:translateX(0)}${pct(5.75)},100%{transform:translateX(30px)}}`,
    `@keyframes pf-catch{0%{opacity:0}${pct(2.6)}{opacity:1}${pct(3.3)}{opacity:0}100%{opacity:0}}`,
    `@keyframes pf-dust{0%{opacity:0;transform:scale(.4)}2%{opacity:.8;transform:scale(1)}8%,100%{opacity:0;transform:scale(1.6) translateY(-4px)}}`,
  ].join("\n");

  const box = { x: stage.cx - w / 2, y: stage.ground - h + scale, w, h };
  const ballSize = BALL_A[0]!.length * 2;
  const ballAt = { x: stage.cx - ballSize / 2, y: stage.ground - ballSize };
  const ballSvg =
    `<g class="pf-fetch-ball"><g class="pf-ball-a">${px(BALL_A, BALL_COLORS, ballAt.x, ballAt.y, 2)}</g><g class="pf-ball-b">${px(BALL_B, BALL_COLORS, ballAt.x, ballAt.y, 2)}</g></g>`;
  const ballShadow = `<g class="pf-fetch-shadow"><rect x="${stage.cx - 6}" y="${stage.ground + 2}" width="12" height="4" rx="2" style="fill:var(--pf-ground-dark)"/></g>`;
  // Holding the ball at (84, -62) from the scene's centre, the arm reaching in from the edge.
  const hand = `<g class="pf-hand">${px(HAND, HAND_COLORS, stage.cx + 86, stage.ground - 72, 2)}</g>`;

  // Dust kicked up behind its feet while it runs (left, then back right).
  const dust = [1.1, 1.5, 1.9, 3.4, 3.8, 4.2]
    .map((t) => {
      const p = CHOREOGRAPHY.pet(t);
      const behind = t < 3 ? w / 2 : -w / 2;
      return `<g class="pf-dust" style="animation-delay:${t - FETCH}s">${px(outlined([".dd.", "dddd", ".dd."]), { d: "#e9e3d5", o: "#b9ad93" }, stage.cx + p.x + behind - 4, stage.ground - 6, 2)}</g>`;
    })
    .join("");

  const catchBubble = emoteBubble("bang", w - 6, -4, "pf-catch");
  const body = side ? `<g class="pf-fetch-face">${sprite}</g>` : sprite;
  const pet = `<g class="pf-fetch-pet"><g transform="translate(${box.x} ${box.y})"><g class="pf-fetch-squash"><g class="pf-run">${body}</g></g>${catchBubble}</g></g>`;
  const petShadow = `<g class="pf-fetch-pet">${shadow(box.x + w * 0.1, stage.ground - 2 + scale, w * 0.8)}</g>`;
  return { svg: `${petShadow}${ballShadow}${dust}${pet}${ballSvg}${hand}`, box, css };
}

/**
 * The scene for `visit`. The sprite is drawn by the caller (happy face, no tricks), so this only
 * places it and adds the props around it.
 */
export function visitScene(visit: CareAction, state: PetState, sprite: { svg: string; width: number; height: number }, scale: number, stage: SceneAnchor): VisitScene {
  const { svg, width: w, height: h } = sprite;
  switch (visit) {
    case "feed":
      return feed(svg, w, h, scale, stage, getSpecies(state.species));
    case "bath":
      return bath(svg, w, h, scale, stage, getSpecies(state.species), state.mood === "sleeping");
    case "play":
      return play(svg, w, h, scale, stage, getSpecies(state.species));
  }
}
