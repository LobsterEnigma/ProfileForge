/**
 * Rare days: a UFO, a friend from another language dropping by, a butterfly landing on the
 * pet's nose, or a pair of shades in the summer sun.
 */
import { pick } from "../../random.js";
import type { Grid } from "../../svg/pixel.js";
import { pixelText } from "../../svg/pixelfont.js";
import { anchors, bubble } from "../behavior.js";
import { SPECIES, getSpecies } from "../species/index.js";
import { renderPetSprite } from "../sprite.js";
import { HEART } from "../sprites.js";
import { px, round, type Art, type Ctx } from "./kit.js";
import { glasses } from "./wear.js";

const CYCLE = 24;
const pct = (t: number) => `${+((t / CYCLE) * 100).toFixed(2)}%`;

/** Keyframes showing something (steps) only between `from` and `to` seconds of the day. */
const shown = (name: string, from: number, to: number) =>
  `.${name}{opacity:0;animation:${name} ${CYCLE}s steps(1) infinite}@keyframes ${name}{0%{opacity:0}${pct(from)}{opacity:1}${pct(to)}{opacity:0}100%{opacity:0}}`;

// ── UFO ──────────────────────────────────────────────────────────────────────

const SAUCER: Grid = [
  "......cccccc......",
  ".....cwCCCCCc.....",
  "....cCCCCCCCCc....",
  ".ssssssssssssssss.",
  "sSSSSSSSSSSSSSSSSs",
  ".ssssssssssssssss.",
  "....dddddddddd....",
];
const SAUCER_LIGHTS: Grid = ["..................", "..................", "..................", "..................", ".y..r..g..y..r..g.", "..................", ".................."];

function ufo(c: Ctx): Art {
  const { scene: sc, box } = c;
  const s = 3;
  const uw = SAUCER[0]!.length * s;
  const ux = round(box.x + box.w / 2 - uw / 2);
  const uy = sc.y + 16;
  const under = uy + SAUCER.length * s;
  const rise = Math.round(box.y + box.h / 2 - under - 4);
  const beam = `<path class="pf-s-beam" d="M${ux + uw / 2 - 8} ${under}h16L${round(box.x + box.w + 6)} ${box.y + box.h}H${round(box.x - 6)}Z" fill="#b2f2bb" opacity="0"/>`;
  const saucer =
    `<g class="pf-s-ufo">${px(SAUCER, { c: "#99e9f2", C: "#66d9e8", w: "#ffffff", s: "#adb5bd", S: "#868e96", d: "#495057" }, ux, uy, s)}` +
    `<g class="pf-s-blink">${px(SAUCER_LIGHTS, { y: "#ffe066", r: "#ff6b6b", g: "#69db7c" }, ux, uy, s)}</g></g>`;
  const top = anchors(c.species).top * c.scale;
  const huh = bubble(pixelText("?!"), box.w - 6, top - 2, "pf-s-huh");
  return {
    css: `.pf-s-ufo{animation:pf-s-ufo ${CYCLE}s ease-in-out infinite}
@keyframes pf-s-ufo{0%{transform:translate(-160px,-50px)}12%{transform:translate(0,0)}20%{transform:translate(0,-3px)}30%{transform:translate(0,0)}50%{transform:translate(0,-3px)}72%{transform:translate(0,0)}86%,100%{transform:translate(180px,-60px)}}
.pf-s-beam{animation:pf-s-beam ${CYCLE}s steps(1) infinite}
@keyframes pf-s-beam{0%{opacity:0}${pct(4.3)}{opacity:.5}${pct(4.6)}{opacity:.15}${pct(4.9)}{opacity:.5}${pct(16.4)}{opacity:0}100%{opacity:0}}
.pf-s-abduct{transform-box:fill-box;transform-origin:center;animation:pf-s-abduct ${CYCLE}s ease-in-out infinite}
@keyframes pf-s-abduct{0%,${pct(5.2)}{transform:none;opacity:1}${pct(10)}{transform:translateY(-${rise}px) scale(.35) rotate(-24deg);opacity:1}${pct(10.4)},${pct(13)}{transform:translateY(-${rise}px) scale(.35);opacity:0}${pct(13.4)}{transform:translateY(-${rise}px) scale(.35) rotate(20deg);opacity:1}${pct(15.6)}{transform:none;opacity:1}100%{transform:none;opacity:1}}
${shown("pf-s-huh", 15.8, 19.4)}`,
    follow: beam + saucer,
    bodyClass: "pf-s-abduct",
    over: huh,
    line: "Close encounter of the pet kind",
  };
}

// ── A friend drops by ────────────────────────────────────────────────────────

function friend(c: Ctx): Art {
  const { scene: sc, state } = c;
  const id = pick(c.rng, Object.keys(SPECIES).filter((k) => k !== state.species && k !== c.species.id));
  const buddy = getSpecies(id);
  const s = 3;
  const sprite = renderPetSprite({ ...state, species: id, stage: "baby", mood: "idle", trick: undefined, care: undefined }, s, { lively: false });
  const fw = sprite.width;
  const fh = sprite.height;
  const meet = sc.x + sc.w - fw - 18;
  const y = sc.ground - fh - 4 + s;
  // Walking in from the right, stopping to say hi, then heading off to the left.
  const flip = buddy.facing === "right" ? ` transform="translate(${fw} 0) scale(-1 1)"` : "";
  const hello = bubble(pixelText("HI!"), fw - 4, 0, "pf-s-hi");
  const love = `<g class="pf-s-love">${px(HEART, { p: "#ff5c7a" }, fw / 2 - 5, -12, 2)}</g>`;
  return {
    css: `.pf-s-friend{animation:pf-s-friend ${CYCLE}s linear infinite}
@keyframes pf-s-friend{0%{transform:translateX(${sc.x + sc.w + 4}px)}${pct(4.6)}{transform:translateX(${meet}px)}${pct(11)}{transform:translateX(${meet}px)}${pct(20.5)},100%{transform:translateX(${sc.x - fw - 8}px)}}
.pf-s-wave{animation:pf-s-wave ${CYCLE}s ease-in-out infinite}
@keyframes pf-s-wave{0%,${pct(5)}{transform:none}${pct(5.4)}{transform:translateY(-6px)}${pct(5.8)}{transform:none}${pct(6.2)}{transform:translateY(-6px)}${pct(6.6)},100%{transform:none}}
${shown("pf-s-hi", 5, 8)}
${shown("pf-s-love", 8.2, 10.8)}`,
    back: `<g class="pf-s-friend"><g transform="translate(0 ${y})"><g class="pf-s-wave"><g${flip}>${sprite.svg}</g>${hello}${love}</g></g></g>`,
    line: `${buddy.defaultName} the ${id} dropped by`,
  };
}

// ── A butterfly on the nose ──────────────────────────────────────────────────

const WINGS_OPEN: Grid = ["pp...pp", "pPp.pPp", ".ppkpp.", "..pkp..", ".pp.pp."];
const WINGS_SHUT: Grid = [".......", "..p.p..", "..pkp..", "..pkp..", "...k..."];

function butterfly(c: Ctx): Art {
  const { species, scale } = c;
  const a = anchors(species);
  const side = species.facing === "right";
  const eye = a.eyes[0]!;
  // Between the eyes (or just ahead of a side-view pet's eye), a little below them.
  const nose = side ? { x: Math.min(species.width - 1, eye.x + 2), y: eye.y } : { x: a.eyes.reduce((sum, e) => sum + e.x, 0) / a.eyes.length, y: Math.max(...a.eyes.map((e) => e.y)) + 1 };
  const bx = round(nose.x * scale - 7);
  const by = round(nose.y * scale - 9);
  const palette = { p: "#ffa94d", P: "#fff3bf", k: "#343a40" };
  const wings = `<g class="pf-fa" style="animation-duration:.3s">${px(WINGS_OPEN, palette, 0, 0, 2)}</g><g class="pf-fb" style="animation-duration:.3s">${px(WINGS_SHUT, palette, 0, 0, 2)}</g>`;
  return {
    css: `.pf-s-fly{animation:pf-s-fly ${CYCLE}s ease-in-out infinite}
@keyframes pf-s-fly{0%{transform:translate(-60px,-70px);opacity:0}3%{opacity:1}14%{transform:translate(50px,-50px)}26%{transform:translate(-24px,-44px)}38%{transform:translate(18px,-30px)}${pct(10.8)}{transform:translate(0,-8px)}${pct(11.3)},${pct(16.3)}{transform:translate(0,0);opacity:1}${pct(17.4)}{transform:translate(26px,-26px)}${pct(19.4)}{transform:translate(80px,-80px);opacity:1}${pct(19.5)},100%{transform:translate(-60px,-70px);opacity:0}}`,
    held: `<g transform="translate(${bx} ${by})"><g class="pf-s-fly">${wings}</g></g>`,
    crossed: [[11.4, 16.3]],
    line: "A butterfly landed on its nose",
  };
}

// ── Shades ───────────────────────────────────────────────────────────────────

function sunglasses(c: Ctx): Art {
  const { scene: sc } = c;
  const sx = sc.x + sc.w - 30;
  const sy = sc.y + 28;
  let rays = "";
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    rays += `<rect x="${round(sx + Math.cos(angle) * 16 - 2)}" y="${round(sy + Math.sin(angle) * 16 - 2)}" width="4" height="4" fill="#ffd43b"/>`;
  }
  return {
    css: `.pf-s-glint{animation:pf-s-glint 4s steps(1) infinite}@keyframes pf-s-glint{0%,78%{opacity:0}80%,90%{opacity:.9}92%,100%{opacity:0}}
.pf-s-sun{transform-box:fill-box;transform-origin:center;animation:pf-s-sun 16s linear infinite}@keyframes pf-s-sun{to{transform:rotate(360deg)}}`,
    back: `<g class="pf-s-sun">${rays}</g><circle cx="${sx}" cy="${sy}" r="10" fill="#ffd43b"/><circle cx="${sx - 3}" cy="${sy - 3}" r="3" fill="#fff3bf"/>`,
    face: glasses(c.species, c.scale, "shades"),
    line: "Summer mode · too cool for school",
  };
}

export const RARE_ART = { ufo, friend, butterfly, sunglasses } as const;
