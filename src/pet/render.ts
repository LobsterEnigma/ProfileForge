import type { Mood, PetState } from "../types.js";
import { seeded, type Rng } from "../random.js";
import { escapeXml } from "../svg/escape.js";
import { RectBatch } from "../svg/batch.js";
import { renderPixels, type Grid } from "../svg/pixel.js";
import { themeCss, themeFilter } from "../themes.js";
import { getSpecies } from "./species/index.js";
import { renderPetSprite, SPRITE_CSS } from "./sprite.js";
import { COMMIT, FX_PALETTE, HEART, SPARKLE, ZED } from "./sprites.js";
import { ambient, groundCover, props, SCENERY_CSS, terrainFor } from "./scenery.js";
import { CARE_CSS, careOverlay, lineFor, visitorLine } from "./care-fx.js";
import { activeVisit, activeVisits, ball, bowl, turnCss, VISIT_CSS, visitScene } from "./visits.js";
import { emptyBowl, lifeFor } from "./life.js";
import { disguiseFor, showSurprise, surpriseFor, type Art, type Shown } from "./surprises/index.js";
import { EGG } from "./sprites.js";
import { HOLIDAYS } from "../world/calendar.js";
import { fallingParticles, fireflies, LOOKS, SEASON_CSS, seasonFor, type Area, type Hemisphere, type Season } from "../world/seasons.js";
import { fog, rain, WEATHER_CSS, weatherFor, type Weather } from "../world/weather.js";

export interface RenderOptions {
  theme?: string;
  hideBorder?: boolean;
  /** Pins a season instead of following the date. */
  season?: Season;
  /** Flips the date-based seasons for the southern hemisphere. */
  hemisphere?: Hemisphere;
}

const W = 480;
const H = 190;
const SCENE = { x: 12, y: 12, w: 200, h: 166 };
const GROUND_Y = SCENE.y + SCENE.h - 34;
const AREA: Area = { x: SCENE.x, y: SCENE.y, w: SCENE.w, ground: GROUND_Y };
const PANEL_X = 230;
const PANEL_RIGHT = W - 16;

const SANS = "'Segoe UI',Ubuntu,'Helvetica Neue',sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

const CSS = `${SPRITE_CSS}
.pf-walk{animation:pf-walk 9s ease-in-out infinite}
.pf-turn{transform-box:fill-box;transform-origin:center;animation:pf-turn 9s steps(1) infinite}
@keyframes pf-turn{0%{transform:scaleX(1)}45%{transform:scaleX(-1)}95%{transform:scaleX(1)}}
@keyframes pf-walk{0%,100%{transform:translateX(-34px)}40%,50%{transform:translateX(34px)}90%{transform:translateX(-34px)}}
.pf-jump{animation:pf-jump .9s ease-in-out infinite}
@keyframes pf-jump{0%,70%,100%{transform:translateY(0)}10%{transform:translateY(2px)}40%{transform:translateY(-16px)}}
.pf-shadow{transform-box:fill-box;transform-origin:center}
.pf-jump-shadow{animation:pf-jump-shadow .9s ease-in-out infinite}
@keyframes pf-jump-shadow{0%,70%,100%{transform:scaleX(1);opacity:.35}40%{transform:scaleX(.55);opacity:.15}}
.pf-breathe{transform-box:fill-box;transform-origin:50% 100%;animation:pf-breathe 3.2s ease-in-out infinite}
@keyframes pf-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.93)}}
.pf-shiver{animation:pf-shiver 2.6s linear infinite}
@keyframes pf-shiver{0%,60%,80%,100%{transform:translateX(0)}64%,72%{transform:translateX(-2px)}68%,76%{transform:translateX(2px)}}
.pf-wobble{transform-box:fill-box;transform-origin:50% 100%;animation:pf-wobble 2.4s ease-in-out infinite}
@keyframes pf-wobble{0%,55%,100%{transform:rotate(0)}65%{transform:rotate(-9deg)}75%{transform:rotate(8deg)}85%{transform:rotate(-4deg)}92%{transform:rotate(2deg)}}
.pf-rise{animation:pf-rise 2.7s ease-out infinite}
@keyframes pf-rise{0%{transform:translate(0,0);opacity:0}15%{opacity:1}100%{transform:translate(8px,-38px);opacity:0}}
.pf-twinkle{transform-box:fill-box;transform-origin:center;animation:pf-twinkle 1.8s ease-in-out infinite}
@keyframes pf-twinkle{0%,100%{opacity:.15;transform:scale(.5)}50%{opacity:1;transform:scale(1)}}
.pf-star{opacity:var(--pf-stars)}
.pf-day{opacity:calc(.85 - var(--pf-stars) * .85)}
.pf-cloud{animation:pf-cloud 80s linear infinite}
@keyframes pf-cloud{from{transform:translateX(var(--from))}to{transform:translateX(var(--to))}}
.pf-shoot{opacity:0;animation:pf-shoot 11s ease-in infinite}
@keyframes pf-shoot{0%,88%{opacity:0;transform:translate(0,0)}90%{opacity:1}97%,100%{opacity:0;transform:translate(-60px,28px)}}
${SEASON_CSS}
${WEATHER_CSS}
${SCENERY_CSS}
${CARE_CSS}
${VISIT_CSS}
@media (prefers-reduced-motion:reduce){.pf *{animation:none!important}}
`;

/** A previewed trick fast-forwards the day so the trick starts right away (0.8s in, not 8.4s). */
const TRICK_PREVIEW_SHIFT = 7.6;

const round = (n: number) => Math.round(n * 100) / 100;

function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${round(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ── Scene ────────────────────────────────────────────────────────────────────

/** The same world the city lives in: season from the date, weather from your activity. */
interface World {
  season: Season;
  weather: Weather;
}

const STARS: [number, number, number][] = [
  [28, 26, 0], [62, 44, 0.7], [96, 22, 1.3], [138, 38, 0.4], [178, 24, 1.1], [196, 56, 0.2], [44, 70, 1.5],
];

/** Clear skies: puffy clouds drifting by day, a shooting star now and then at night. */
function skyLife(): string {
  const { x, y, w } = SCENE;
  const cloud = (cx: number, cy: number, size: number) =>
    new RectBatch()
      .add("#ffffff", cx, cy, 14 * size, 4 * size)
      .add("#ffffff", cx + 3 * size, cy - 3 * size, 7 * size, 3 * size)
      .add("#ffffff", cx + 2 * size, cy + 4 * size, 11 * size, 2 * size)
      .toString();
  return (
    `<g class="pf-day"><g class="pf-cloud" style="--from:${-x - 20}px;--to:${w + 10}px;animation-duration:70s;animation-delay:-20s">${cloud(x, y + 30, 2)}</g>` +
    `<g class="pf-cloud" style="--from:${-x - 20}px;--to:${w + 10}px;animation-duration:95s;animation-delay:-70s">${cloud(x, y + 58, 1.5)}</g></g>` +
    `<g class="pf-star"><g class="pf-shoot"><rect x="${x + w - 40}" y="${y + 14}" width="14" height="1.5" fill="#ffffff" transform="rotate(-25 ${x + w - 33} ${y + 15})"/></g></g>`
  );
}

function scene(state: PetState, world: World): string {
  const { x, y, w, h } = SCENE;
  const beach = terrainFor(state.species) === "beach";
  const stars = STARS.map(
    ([sx, sy, delay]) =>
      `<rect class="pf-twinkle" style="animation-delay:-${delay}s" x="${sx}" y="${sy}" width="3" height="3" fill="#fff"/>`,
  ).join("");
  // A bumpy sand line: alternate 8px steps.
  let bumps = "";
  for (let bx = x; bx < x + w; bx += 16) bumps += `M${bx} ${GROUND_Y}h8v-3h-8z`;
  const pebbles = [
    [x + 22, GROUND_Y + 14],
    [x + 150, GROUND_Y + 20],
    [x + 96, GROUND_Y + 24],
    [x + 176, GROUND_Y + 10],
  ]
    .map(([px, py]) => `<rect x="${px}" y="${py}" width="6" height="4" style="fill:var(--pf-ground-dark)"/>`)
    .join("");
  // Bad weather: a darker sky and a couple of heavy clouds instead of stars.
  const overcast =
    world.weather === "clear"
      ? ""
      : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1b2033" opacity=".28"/>` +
        `<g opacity=".85" fill="#6f7689"><rect x="${x + 6}" y="${y + 22}" width="66" height="12"/><rect x="${x + 20}" y="${y + 14}" width="30" height="10"/>` +
        `<rect x="${x + 110}" y="${y + 34}" width="80" height="12"/><rect x="${x + 128}" y="${y + 26}" width="36" height="10"/></g>`;

  return `
<defs>
  <clipPath id="pf-clip"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/></clipPath>
  <linearGradient id="pf-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" style="stop-color:var(--pf-sky-top)"/>
    <stop offset="1" style="stop-color:var(--pf-sky-bottom)"/>
  </linearGradient>
  <linearGradient id="pf-fog" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#d7deea" stop-opacity="0"/><stop offset=".5" stop-color="#d7deea"/><stop offset="1" stop-color="#d7deea" stop-opacity="0"/>
  </linearGradient>
</defs>
<g clip-path="url(#pf-clip)">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#pf-sky)"/>
  ${world.weather === "clear" ? `<g class="pf-star">${stars}</g>${skyLife()}` : overcast}
  <rect x="${x}" y="${GROUND_Y}" width="${w}" height="${y + h - GROUND_Y}" style="fill:var(--pf-ground)"/>
  <path d="${bumps}" style="fill:var(--pf-ground)"/>
  ${groundCover(state.species, AREA, y + h, LOOKS[world.season].snow)}
  ${beach ? pebbles : ""}
  ${props(state.species, AREA)}
  ${ambient(state.species, AREA).svg}`;
}

/** Weather and seasons drift in front of the pet. */
function foreground(world: World, rng: Rng): string {
  const look = LOOKS[world.season];
  const particles = world.weather === "rain" && world.season !== "winter" ? rain(rng, AREA) : fallingParticles(look, rng, AREA);
  return [
    world.weather === "clear" ? fireflies(look, rng, AREA) : "",
    particles,
    world.weather === "fog" ? fog(AREA) : "",
  ].join("");
}

// ── Pet ──────────────────────────────────────────────────────────────────────

function positionFor(widthPx: number, heightPx: number, scale: number): Box {
  return {
    x: SCENE.x + SCENE.w / 2 - widthPx / 2,
    y: GROUND_Y - heightPx + scale,
    w: widthPx,
    h: heightPx,
  };
}

function shadow(box: Box, mood: Mood): string {
  const cls = mood === "happy" ? "pf-shadow pf-jump-shadow" : "pf-shadow";
  const sw = box.w * 0.8;
  return `<rect class="${cls}" x="${box.x + (box.w - sw) / 2}" y="${box.y + box.h - 2}" width="${sw}" height="6" rx="3" opacity=".35" style="fill:var(--pf-ground-dark)"/>`;
}

function motionClass(mood: Mood): { outer: string; inner: string } {
  switch (mood) {
    case "happy":
      return { outer: "", inner: "pf-jump" };
    case "idle":
      return { outer: "pf-walk", inner: "" };
    case "hungry":
      return { outer: "", inner: "pf-shiver" };
    case "sleeping":
      return { outer: "", inner: "pf-breathe" };
  }
}

/** A note on a stick where the pet used to be, and footprints heading off-screen. */
function goodbye(): { svg: string; box: Box } {
  const cx = SCENE.x + SCENE.w / 2;
  const b = new RectBatch()
    .add("#8a5a33", cx - 2, GROUND_Y - 30, 4, 34) // stake
    .add("#fbf3e4", cx - 16, GROUND_Y - 52, 32, 24) // paper
    .add("#5b4636", cx - 16, GROUND_Y - 52, 32, 2)
    .add("#c9b79a", cx - 12, GROUND_Y - 45, 22, 2) // scribbles
    .add("#c9b79a", cx - 12, GROUND_Y - 40, 18, 2)
    .add("#c9b79a", cx - 12, GROUND_Y - 35, 20, 2)
    .add("#e63946", cx + 8, GROUND_Y - 36, 4, 4); // a little heart-shaped signature
  const steps = new RectBatch();
  for (let i = 0; i < 6; i++) {
    const x = cx + 14 + i * 14;
    const y = GROUND_Y + 10 + (i % 2) * 5;
    steps.add("#3b2a1a", x, y, 4, 3).add("#3b2a1a", x + 5, y - 2, 2, 2);
  }
  return { svg: `${b}<g opacity=".3">${steps}</g>`, box: { x: cx - 16, y: GROUND_Y - 52, w: 32, h: 56 } };
}

function pet(state: PetState, art: Art = {}): { svg: string; box: Box; css?: string } {
  // Away on a trip: the postcard takes its place.
  if (art.replace) return { svg: art.replace, box: { x: SCENE.x, y: SCENE.y, w: 0, h: 0 } };
  if (state.ranAway) return goodbye();
  const scale = state.stage === "baby" ? 3 : 4;

  // Fresh visits take over the scene: eating, bathing or playing fetch, with a happy face.
  // Several kinds of visit take turns, each with its own scene.
  const visits = activeVisits(state);
  if (visits.length) {
    const face = state.mood === "sleeping" ? state : { ...state, mood: "happy" as const };
    const scenes = visits.map(({ action }) => {
      const sprite = renderPetSprite(face, scale, { lively: false, hat: art.hat, face: art.face });
      if (action !== "bath") sprite.svg += careOverlay(state.care, sprite.width, sprite.height, scale);
      return visitScene(action, state, sprite, scale, { cx: SCENE.x + SCENE.w / 2, ground: GROUND_Y });
    });
    if (scenes.length === 1) return scenes[0]!;
    return {
      svg: scenes.map((sc, k) => `<g class="pf-turn${k}">${sc.svg}</g>`).join(""),
      box: scenes[0]!.box,
      css: scenes.map((sc) => sc.css ?? "").join("\n"),
    };
  }

  if (state.stage === "egg") {
    const sprite = renderPetSprite(state, scale);
    const box = positionFor(sprite.width, sprite.height, scale);
    const wobble = state.mood === "happy" || state.mood === "idle" ? "pf-wobble" : "";
    return { svg: `${shadow(box, "idle")}<g transform="translate(${box.x} ${box.y})"><g class="${wobble}">${sprite.svg}</g></g>`, box };
  }

  // A day in its life: a scripted 24s loop of walking, pausing, sitting, hopping and more.
  const species = getSpecies(state.species);
  const w = species.width * scale;
  const h = species.height * scale;
  const life = lifeFor(state.mood, species, scale, w, h, state.date, state.login, { crossed: art.crossed });
  const sprite = renderPetSprite(state, scale, { emote: false, eyes: life.eyes, hat: art.hat, face: art.face });
  let body = sprite.svg + careOverlay(state.care, w, h, scale) + (art.held ?? "");
  if (life.faceClass) body = `<g class="${life.faceClass}">${body}</g>`;
  for (const cls of life.bodyClasses) body = `<g class="${cls}">${body}</g>`;
  if (art.bodyClass) body = `<g class="${art.bodyClass}">${body}</g>`;
  const box = positionFor(w, h, scale);
  const inner = state.mood === "happy" ? "pf-jump" : state.mood === "sleeping" ? "pf-breathe" : "";
  const sparkles = state.stage === "legendary" ? legendarySparkles({ x: 0, y: 0, w, h }) : "";
  const props = state.mood === "hungry" ? emptyBowl(box.x + w + 12, GROUND_Y) : "";
  return {
    svg: `${props}<g class="${life.pathClass}">${art.follow ?? ""}${shadow(box, state.mood)}<g transform="translate(${box.x} ${box.y})"><g class="${inner}">${body}</g>${life.overlay}${art.over ?? ""}${sparkles}</g></g>`,
    box,
    css: life.css + (sprite.css ?? ""),
  };
}

function animated(box: Box, mood: Mood, body: string): string {
  const { outer, inner } = motionClass(mood);
  return `<g class="${outer}">${shadow(box, mood)}<g transform="translate(${box.x} ${box.y})"><g class="${inner}">${body}</g></g></g>`;
}

// ── Effects ──────────────────────────────────────────────────────────────────

function fx(grid: Grid, x: number, y: number, scale: number, cls: string, delay: number): string {
  return `<g class="${cls}" style="animation-delay:-${delay}s">${renderPixels([{ x: 0, y: 0, grid }], FX_PALETTE, { x: round(x), y: round(y), scale })}</g>`;
}

function zzz(box: Box): string {
  return [
    fx(ZED, box.x + box.w * 0.7, box.y - 2, 2, "pf-rise", 0),
    fx(ZED, box.x + box.w * 0.7 + 6, box.y - 8, 2.5, "pf-rise", 0.9),
    fx(ZED, box.x + box.w * 0.7 + 12, box.y - 14, 3, "pf-rise", 1.8),
  ].join("");
}

function legendarySparkles(box: Box): string {
  const spots: [number, number, number][] = [
    [-14, 6, 0], [box.w + 4, 0, 0.6], [-8, box.h - 18, 1.1], [box.w + 2, box.h - 26, 1.5],
  ];
  return spots.map(([dx, dy, delay]) => fx(SPARKLE, box.x + dx, box.y + dy, 2, "pf-twinkle", delay)).join("");
}

function effects(state: PetState, box: Box): string {
  if (state.ranAway) return "";
  const out: string[] = [];
  // A visitor fed or played with a sleeping pet: the bowl or ball waits for it to wake up.
  const left = (state.care?.visitors ?? []).map((v) => v.action);
  if (state.mood === "sleeping" && left.includes("feed")) out.push(bowl(SCENE.x + 14, GROUND_Y));
  if (state.mood === "sleeping" && left.includes("play")) out.push(ball(SCENE.x + SCENE.w - 26, GROUND_Y));
  // During a visit the scene tells the story; only sleep and legendary sparkles stay.
  if (activeVisit(state) && state.mood !== "sleeping") return state.stage === "legendary" ? legendarySparkles(box) : "";
  // Hatched pets follow their daily script, which carries its own hearts, bubbles and sparkles.
  if (state.stage !== "egg") {
    if (state.mood === "sleeping") out.push(zzz(box));
    return out.join("");
  }
  switch (state.mood) {
    case "happy":
      out.push(
        fx(HEART, box.x + box.w * 0.1, box.y, 2, "pf-rise", 0.3),
        fx(HEART, box.x + box.w * 0.5, box.y - 6, 2, "pf-rise", 1.2),
        fx(HEART, box.x + box.w * 0.85, box.y + 4, 2, "pf-rise", 2.1),
      );
      break;
    case "sleeping":
      out.push(zzz(box));
      break;
    case "hungry": {
      const bx = box.x + box.w - 6;
      const by = box.y - 34;
      out.push(
        `<g class="pf-bob">`,
        `<rect x="${bx - 6}" y="${box.y - 8}" width="4" height="4" rx="1" style="fill:var(--pf-bg);stroke:var(--pf-muted)" stroke-width="1"/>`,
        `<rect x="${bx}" y="${box.y - 16}" width="6" height="6" rx="2" style="fill:var(--pf-bg);stroke:var(--pf-muted)" stroke-width="1"/>`,
        `<rect x="${bx + 2}" y="${by}" width="28" height="24" rx="8" style="fill:var(--pf-bg);stroke:var(--pf-muted)" stroke-width="1.2"/>`,
        renderPixels([{ x: 0, y: 0, grid: COMMIT }], FX_PALETTE, { x: bx + 9, y: by + 5, scale: 3.5 }),
        `</g>`,
      );
      break;
    }
    case "idle":
      break;
  }

  return out.join("");
}

// ── Status panel ─────────────────────────────────────────────────────────────

function bar(label: string, ratio: number, value: string, y: number, color: string, charging = false): string {
  const segments = 10;
  const filled = ratio <= 0 ? 0 : Math.max(1, Math.min(segments, Math.round(ratio * segments)));
  const x0 = PANEL_X + 30;
  let segs = "";
  for (let i = 0; i < segments; i++) {
    const fill = i < filled ? color : "var(--pf-bar-empty)";
    segs += `<rect x="${x0 + i * 14}" y="${y - 9}" width="12" height="10" rx="1.5" style="fill:${fill}"/>`;
  }
  // A glint running along the filled part, and the next segment slowly charging up.
  const glint = filled
    ? `<rect class="pf-glint" style="--w:${filled * 14 - 4}px" x="${x0}" y="${y - 9}" width="3" height="10" fill="#ffffff" opacity="0"/>`
    : "";
  const next = charging && filled < segments ? `<rect class="pf-charge" x="${x0 + filled * 14}" y="${y - 9}" width="12" height="10" rx="1.5" style="fill:${color}"/>` : "";
  return `
  <text x="${PANEL_X}" y="${y}" class="pf-label">${label}</text>${segs}${next}${glint}
  <text x="${PANEL_RIGHT}" y="${y}" class="pf-value" text-anchor="end">${escapeXml(value)}</text>`;
}

function moodLine(state: PetState, special?: string): string {
  if (state.ranAway) return "Ran away · a commit will bring it home";
  const visit = visitorLine(state.care);
  if (visit) return visit;
  // A surprise speaks for a content pet; a hungry or sleeping one keeps telling you why.
  if (special && (state.mood === "happy" || state.mood === "idle" || state.stage === "egg")) return special;
  if (state.stage === "egg") return "Egg · hatches at Lv.3";
  const d = state.daysSinceLastContribution;
  switch (state.mood) {
    case "happy":
      return state.streak >= 2 ? `Happy · ${state.streak}-day streak!` : "Happy · on a roll!";
    case "idle":
      return "Idle · just vibing";
    case "hungry":
      return `Hungry · ${d} days without commits`;
    case "sleeping":
      return d >= 365 ? "Zzz · deep hibernation" : `Zzz · asleep for ${d} days`;
  }
}

/** A little pixel icon before the status line, moving with the mood. */
function moodIcon(state: PetState): string {
  const icon = (grid: Grid, color: string, cls: string, w: number) =>
    `<g class="${cls}">${renderPixels([{ x: 0, y: 0, grid }], { x: color }, { x: PANEL_X + (10 - w) / 2, y: 164, scale: 2 })}</g>`;
  if (state.ranAway) return icon(["xx..", "xx..", "....", "..xx", "..xx"], "var(--pf-muted)", "pf-icon-step", 4 * 2);
  if (state.stage === "egg") return icon([".xx.", "xxxx", "xxxx", ".xx."], "#e0cfb1", "pf-icon-wobble", 4 * 2);
  switch (state.mood) {
    case "happy":
      return icon(["xx.xx", "xxxxx", ".xxx.", "..x.."], "#ff5c7a", "pf-icon-beat", 5 * 2);
    case "idle":
      return icon(["..xx", "..x.", "..x.", "xxx.", "xx.."], "var(--pf-accent)", "pf-icon-bob", 4 * 2);
    case "hungry":
      return icon(["x...x", "xxxxx", ".xxx."], "#e05252", "pf-icon-shake", 5 * 2);
    case "sleeping":
      return icon(["xxx", "..x", ".x.", "x..", "xxx"], "var(--pf-muted)", "pf-icon-doze", 3 * 2);
  }
}

/** The status line; with several visitors, their names take turns in step with the scenes. */
function statusLines(state: PetState, special?: string): string {
  const visitors = state.ranAway ? [] : (state.care?.visitors ?? []);
  if (visitors.length < 2) return `<text x="${PANEL_X + 16}" y="174" class="pf-mood">${escapeXml(moodLine(state, special))}</text>`;
  return visitors.map((v, k) => `<text x="${PANEL_X + 16}" y="174" class="pf-mood pf-turn${k}">${escapeXml(lineFor(v))}</text>`).join("");
}

function panel(state: PetState, special?: string): string {
  const levelSpan = Math.max(1, state.xpNextLevel - state.xpLevelStart);
  const xpRatio = state.level >= 99 ? 1 : (state.xp - state.xpLevelStart) / levelSpan;
  const star = state.stage === "legendary" ? "★ " : "";
  const lang = state.topLanguage ? ` · ${state.topLanguage}` : "";
  const stats = (
    [
      ["STR", state.stats.str],
      ["INT", state.stats.int],
      ["CHA", state.stats.cha],
      ["DEX", state.stats.dex],
    ] as const
  )
    .map(
      ([label, value], i) =>
        `<text x="${PANEL_X + i * 60}" y="128" class="pf-label">${label}</text><text x="${PANEL_X + i * 60}" y="147" class="pf-stat">${value}</text>`,
    )
    .join("");

  return `
<g>
  <text x="${PANEL_X}" y="40" class="pf-name">${escapeXml(state.petName)}</text>
  <clipPath id="pf-name-clip"><text x="${PANEL_X}" y="40" class="pf-name">${escapeXml(state.petName)}</text></clipPath>
  <g clip-path="url(#pf-name-clip)"><g class="pf-shine"><rect transform="skewX(-20)" x="${PANEL_X - 8}" y="20" width="10" height="26" style="fill:var(--pf-accent)" opacity=".75"/></g></g>
  <text x="${PANEL_X}" y="61" class="pf-class"><tspan class="pf-accent">Lv.${state.level} ${star}${escapeXml(state.className)}</tspan><tspan class="pf-muted">${escapeXml(lang)}</tspan></text>
  ${bar("HP", state.activeDays14 / 14, `${state.activeDays14}/14d`, 88, "var(--pf-hp)")}
  ${bar("EXP", xpRatio, `${compact(state.xp)}/${compact(state.xpNextLevel)}`, 108, "var(--pf-exp)", state.level < 99)}
  ${stats}
  ${moodIcon(state)}
  ${statusLines(state, special)}
</g>`;
}

// ── Card ─────────────────────────────────────────────────────────────────────

/** Today's surprise, drawn for wherever the pet is right now. */
function surprise(state: PetState, season: Season): { shown: Shown; state: PetState } | null {
  const id = surpriseFor(state, season);
  if (!id) return null;
  const visiting = !!activeVisit(state);
  // A visitor's scene has room for costumes (holidays, birthdays), nothing else.
  if (visiting && !(HOLIDAYS as readonly string[]).includes(id) && id !== "birthday") return null;
  const where = state.ranAway ? "away" : visiting ? "visit" : state.stage === "egg" ? "egg" : "pet";
  const drawn = id === "april-fools" && (where === "pet" || where === "visit") ? { ...state, species: disguiseFor(state) } : state;
  const species = getSpecies(drawn.species);
  const scale = state.stage === "baby" ? 3 : 4;
  const w = (state.stage === "egg" ? EGG[0]!.length : species.width) * scale;
  const h = (state.stage === "egg" ? EGG.length : species.height) * scale;
  const ctx = { state: drawn, species, scale, box: positionFor(w, h, scale), scene: { ...SCENE, ground: GROUND_Y }, season, rng: seeded(`${id}:${state.login}:${state.date}`) };
  return { shown: showSurprise(id, ctx, where), state: drawn };
}

export function renderPetCard(original: PetState, options: RenderOptions = {}): string {
  const world: World = {
    season: options.season ?? seasonFor(original.date, options.hemisphere),
    weather: weatherFor(original.daysSinceLastContribution),
  };
  const today = surprise(original, world.season);
  const state = today?.state ?? original;
  const art = today?.shown.art ?? {};
  const creature = pet(state, art);
  // Several visitors take turns on the card, 6s each.
  const visitors = original.ranAway ? 0 : (original.care?.visitors?.length ?? 0);
  const turns = visitors > 1 ? visitors : 0;
  const filter = themeFilter(options.theme);
  const title = `${original.petName}, ${original.login}'s ProfileForge pet`;
  const desc = `Level ${original.level} ${original.className} ${original.species}, feeling ${original.mood}. ${original.streak}-day streak.`;
  const border = options.hideBorder
    ? ""
    : `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" style="stroke:var(--pf-border)"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" class="pf"${original.trick ? ` style="--pf-t0:-${TRICK_PREVIEW_SHIFT}s"` : ""} width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="pf-title pf-desc">
<title id="pf-title">${escapeXml(title)}</title>
<desc id="pf-desc">${escapeXml(desc)}</desc>
<style>${themeCss(options.theme)}
.pf-name{font:700 20px ${SANS};fill:var(--pf-title)}
.pf-class{font:700 13px ${SANS}}
.pf-accent{fill:var(--pf-accent)}
.pf-muted{fill:var(--pf-muted);font-weight:400}
.pf-label{font:700 11px ${MONO};fill:var(--pf-muted)}
.pf-value{font:400 11px ${MONO};fill:var(--pf-text)}
.pf-stat{font:700 16px ${MONO};fill:var(--pf-text)}
.pf-mood{font:400 12px ${SANS};fill:var(--pf-muted)}
.pf-icon-beat,.pf-icon-wobble,.pf-icon-shake{transform-box:fill-box;transform-origin:center}
.pf-icon-beat{animation:pf-icon-beat 1.2s ease-in-out infinite}
@keyframes pf-icon-beat{0%,45%,100%{transform:scale(1)}15%{transform:scale(1.3)}30%{transform:scale(1.1)}}
.pf-icon-bob{animation:pf-icon-bob 1.6s ease-in-out infinite alternate}
@keyframes pf-icon-bob{to{transform:translateY(-2px)}}
.pf-icon-shake{animation:pf-icon-shake 2.4s linear infinite}
@keyframes pf-icon-shake{0%,70%,100%{transform:none}75%,85%{transform:rotate(-12deg)}80%,90%{transform:rotate(12deg)}}
.pf-icon-doze{animation:pf-icon-doze 3s ease-in-out infinite}
@keyframes pf-icon-doze{0%,100%{opacity:1;transform:none}50%{opacity:.4;transform:translate(1px,-2px)}}
.pf-icon-wobble{animation:pf-icon-shake 3s linear infinite}
.pf-icon-step{animation:pf-icon-doze 2s steps(2) infinite}
.pf-shine{animation:pf-shine 7s ease-in-out infinite}
@keyframes pf-shine{0%,70%{transform:translateX(0)}100%{transform:translateX(210px)}}
.pf-glint{animation:pf-glint 5s ease-in-out infinite}
@keyframes pf-glint{0%,60%{transform:translateX(0);opacity:0}64%{opacity:.6}96%{opacity:.6}100%{transform:translateX(var(--w));opacity:0}}
.pf-charge{animation:pf-charge 2.4s ease-in-out infinite}
@keyframes pf-charge{0%,100%{opacity:.12}50%{opacity:.45}}
${CSS}${turnCss(turns)}${ambient(original.species, AREA).css}${creature.css ?? ""}${today?.shown.css ?? ""}</style>
${filter.defs}
<rect width="${W}" height="${H}" rx="10" style="fill:var(--pf-bg)"/>
${border}
${scene(original, world)}
  ${art.back ?? ""}
  <g${filter.attr}>
  ${creature.svg}
  ${art.replace ? "" : effects(state, creature.box)}
  </g>
  ${art.front ?? ""}
  ${foreground(world, seeded(`pet:${state.login}`))}
  ${today?.shown.banner ?? ""}
</g>
${panel(original, art.line)}
</svg>`;
}
