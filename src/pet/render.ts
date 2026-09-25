import type { Mood, PetState } from "../types.js";
import { escapeXml } from "../svg/escape.js";
import { renderPixels, type Grid } from "../svg/pixel.js";
import { themeCss, themeFilter } from "../themes.js";
import { renderPetSprite, SPRITE_CSS } from "./sprite.js";
import { COMMIT, FX_PALETTE, HEART, SPARKLE, ZED } from "./sprites.js";

export interface RenderOptions {
  theme?: string;
  hideBorder?: boolean;
}

const W = 480;
const H = 190;
const SCENE = { x: 12, y: 12, w: 200, h: 166 };
const GROUND_Y = SCENE.y + SCENE.h - 34;
const PANEL_X = 230;
const PANEL_RIGHT = W - 16;

const SANS = "'Segoe UI',Ubuntu,'Helvetica Neue',sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

const CSS = `${SPRITE_CSS}
.pf-walk{animation:pf-walk 9s ease-in-out infinite}
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
@media (prefers-reduced-motion:reduce){.pf *{animation:none!important}}
`;

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

const STARS: [number, number, number][] = [
  [28, 26, 0], [62, 44, 0.7], [96, 22, 1.3], [138, 38, 0.4], [178, 24, 1.1], [196, 56, 0.2], [44, 70, 1.5],
];

function scene(): string {
  const { x, y, w, h } = SCENE;
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

  return `
<defs>
  <clipPath id="pf-clip"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/></clipPath>
  <linearGradient id="pf-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" style="stop-color:var(--pf-sky-top)"/>
    <stop offset="1" style="stop-color:var(--pf-sky-bottom)"/>
  </linearGradient>
</defs>
<g clip-path="url(#pf-clip)">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#pf-sky)"/>
  <g class="pf-star">${stars}</g>
  <rect x="${x}" y="${GROUND_Y}" width="${w}" height="${y + h - GROUND_Y}" style="fill:var(--pf-ground)"/>
  <path d="${bumps}" style="fill:var(--pf-ground)"/>
  ${pebbles}`;
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

function pet(state: PetState): { svg: string; box: Box } {
  const scale = state.stage === "baby" ? 3 : 4;
  const sprite = renderPetSprite(state, scale);
  const box = positionFor(sprite.width, sprite.height, scale);
  if (state.stage === "egg") {
    const wobble = state.mood === "happy" || state.mood === "idle" ? "pf-wobble" : "";
    return { svg: `${shadow(box, "idle")}<g transform="translate(${box.x} ${box.y})"><g class="${wobble}">${sprite.svg}</g></g>`, box };
  }
  return { svg: animated(box, state.mood, sprite.svg), box };
}

function animated(box: Box, mood: Mood, body: string): string {
  const { outer, inner } = motionClass(mood);
  return `<g class="${outer}">${shadow(box, mood)}<g transform="translate(${box.x} ${box.y})"><g class="${inner}">${body}</g></g></g>`;
}

// ── Effects ──────────────────────────────────────────────────────────────────

function fx(grid: Grid, x: number, y: number, scale: number, cls: string, delay: number): string {
  return `<g class="${cls}" style="animation-delay:-${delay}s">${renderPixels([{ x: 0, y: 0, grid }], FX_PALETTE, { x: round(x), y: round(y), scale })}</g>`;
}

function effects(state: PetState, box: Box): string {
  const out: string[] = [];
  switch (state.mood) {
    case "happy":
      out.push(
        fx(HEART, box.x + box.w * 0.1, box.y, 2, "pf-rise", 0.3),
        fx(HEART, box.x + box.w * 0.5, box.y - 6, 2, "pf-rise", 1.2),
        fx(HEART, box.x + box.w * 0.85, box.y + 4, 2, "pf-rise", 2.1),
      );
      break;
    case "sleeping":
      out.push(
        fx(ZED, box.x + box.w * 0.7, box.y - 2, 2, "pf-rise", 0),
        fx(ZED, box.x + box.w * 0.7 + 6, box.y - 8, 2.5, "pf-rise", 0.9),
        fx(ZED, box.x + box.w * 0.7 + 12, box.y - 14, 3, "pf-rise", 1.8),
      );
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

  if (state.stage === "legendary") {
    const spots: [number, number, number][] = [
      [-14, 6, 0], [box.w + 4, 0, 0.6], [-8, box.h - 18, 1.1], [box.w + 2, box.h - 26, 1.5],
    ];
    for (const [dx, dy, delay] of spots) out.push(fx(SPARKLE, box.x + dx, box.y + dy, 2, "pf-twinkle", delay));
  }
  return out.join("");
}

// ── Status panel ─────────────────────────────────────────────────────────────

function bar(label: string, ratio: number, value: string, y: number, color: string): string {
  const segments = 10;
  const filled = ratio <= 0 ? 0 : Math.max(1, Math.min(segments, Math.round(ratio * segments)));
  const x0 = PANEL_X + 30;
  let segs = "";
  for (let i = 0; i < segments; i++) {
    const fill = i < filled ? color : "var(--pf-bar-empty)";
    segs += `<rect x="${x0 + i * 14}" y="${y - 9}" width="12" height="10" rx="1.5" style="fill:${fill}"/>`;
  }
  return `
  <text x="${PANEL_X}" y="${y}" class="pf-label">${label}</text>${segs}
  <text x="${PANEL_RIGHT}" y="${y}" class="pf-value" text-anchor="end">${escapeXml(value)}</text>`;
}

function moodLine(state: PetState): string {
  if (state.stage === "egg") return "Egg · hatches at Lv.3";
  const d = state.daysSinceLastContribution;
  switch (state.mood) {
    case "happy":
      return state.streak >= 2 ? `♥ Happy · ${state.streak}-day streak!` : "♥ Happy · on a roll!";
    case "idle":
      return "Idle · just vibing";
    case "hungry":
      return `Hungry · ${d} days without commits`;
    case "sleeping":
      return d >= 365 ? "Zzz · deep hibernation" : `Zzz · asleep for ${d} days`;
  }
}

function panel(state: PetState): string {
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
  <text x="${PANEL_X}" y="61" class="pf-class"><tspan class="pf-accent">Lv.${state.level} ${star}${escapeXml(state.className)}</tspan><tspan class="pf-muted">${escapeXml(lang)}</tspan></text>
  ${bar("HP", state.activeDays14 / 14, `${state.activeDays14}/14d`, 88, "var(--pf-hp)")}
  ${bar("EXP", xpRatio, `${compact(state.xp)}/${compact(state.xpNextLevel)}`, 108, "var(--pf-exp)")}
  ${stats}
  <text x="${PANEL_X}" y="174" class="pf-mood">${escapeXml(moodLine(state))}</text>
</g>`;
}

// ── Card ─────────────────────────────────────────────────────────────────────

export function renderPetCard(state: PetState, options: RenderOptions = {}): string {
  const creature = pet(state);
  const filter = themeFilter(options.theme);
  const title = `${state.petName}, ${state.login}'s ProfileForge pet`;
  const desc = `Level ${state.level} ${state.className} ${state.species}, feeling ${state.mood}. ${state.streak}-day streak.`;
  const border = options.hideBorder
    ? ""
    : `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" style="stroke:var(--pf-border)"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" class="pf" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="pf-title pf-desc">
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
${CSS}</style>
${filter.defs}
<rect width="${W}" height="${H}" rx="10" style="fill:var(--pf-bg)"/>
${border}
${scene()}
  <g${filter.attr}>
  ${creature.svg}
  ${effects(state, creature.box)}
  </g>
</g>
${panel(state)}
</svg>`;
}
