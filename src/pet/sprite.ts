import type { Mood, PetState } from "../types.js";
import { renderPixels, type Grid, type Layer, type Palette } from "../svg/pixel.js";
import { BEHAVIOR_CSS, crossEyes, emoteBubble, glance, playful, TRICK_STARTS, tricksFor, trickLayers, anchors } from "./behavior.js";
import { getSpecies } from "./species/index.js";
import type { EyeKind, MouthKind } from "./species/types.js";
import { CROWN, EGG, EGG_CRACK, EGG_PALETTE, FX_PALETTE } from "./sprites.js";
import { xpForLevel } from "./state.js";

export const FACE: Record<Mood, { eyes: EyeKind; mouth: MouthKind; blush: boolean }> = {
  happy: { eyes: "happy", mouth: "smile", blush: true },
  idle: { eyes: "open", mouth: "smile", blush: false },
  hungry: { eyes: "sad", mouth: "frown", blush: false },
  sleeping: { eyes: "closed", mouth: "neutral", blush: false },
};

/** Seconds per limb frame. */
const FRAME_SPEED: Record<Mood, number> = { happy: 0.3, idle: 0.24, hungry: 1, sleeping: 1 };

/** Frame swapping and blinking, shared by every widget that draws a pet. */
export const SPRITE_CSS = `
.pf-fa{animation:pf-a 1s steps(1) infinite}
.pf-fb{opacity:0;animation:pf-b 1s steps(1) infinite}
@keyframes pf-a{0%{opacity:1}50%{opacity:0}100%{opacity:0}}
@keyframes pf-b{0%{opacity:0}50%{opacity:1}100%{opacity:1}}
${BEHAVIOR_CSS}
.pf-bob{animation:pf-bob 2s ease-in-out infinite}
@keyframes pf-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
`;

export interface Sprite {
  /** Drawn with its top-left corner at the origin. */
  svg: string;
  width: number;
  height: number;
  /** Styles for today's tricks (empty when it isn't performing). */
  css?: string;
}

function frames(a: string, b: string, seconds: number): string {
  if (a === b) return a;
  const style = `style="animation-duration:${seconds * 2}s"`;
  return `<g class="pf-fa" ${style}>${a}</g><g class="pf-fb" ${style}>${b}</g>`;
}

export interface SpriteOptions {
  /** Emote bubbles and today's trick (off for tiny logos). */
  lively?: boolean;
  /** The random emote bubble; off when a scripted day brings its own. */
  emote?: boolean;
  /** Classes that swap the open eyes for others: closed during a yawn, crossed at a butterfly. */
  eyes?: EyeSwap | null;
  /** Worn instead of the crown: a holiday hat. */
  hat?: Hat;
  /** Drawn over the face (sprite units × scale): glasses, a disguise. */
  face?: string;
}

export interface EyeSwap {
  hide: string;
  alts: { cls: string; kind: "closed" | "crossed" }[];
}

export interface Hat {
  grid: Grid;
  palette: Palette;
  /** Hat pixels to sink onto the head (default 1). */
  sink?: number;
  /** The column that sits over the crown anchor (default: the middle). */
  cx?: number;
}

/** The pet itself (no scene, no effects), animated for its mood. */
export function renderPetSprite(state: PetState, scale: number, { lively = true, emote = true, eyes: swap = null, hat, face: faceArt = "" }: SpriteOptions = {}): Sprite {
  if (state.stage === "egg") return eggSprite(state, scale);

  const species = getSpecies(state.species);
  const legendary = state.stage === "legendary";
  const palette = legendary ? { ...species.palette, ...species.legendaryPalette } : species.palette;
  const px = (layers: Layer[]) => renderPixels(layers, palette, { scale });
  const face = FACE[state.mood];

  const [limbA, limbB] = species.limbs[state.mood];
  // Idle pets look around: straight ahead, a sideways glance, then a blink.
  const side = glance(species.eyes.open);
  let eyes =
    state.mood === "idle"
      ? `<g class="pf-eo">${px(species.eyes.open)}</g>${side ? `<g class="pf-eg">${px(side)}</g>` : ""}<g class="pf-es">${px(species.eyes.closed)}</g>`
      : px(species.eyes[face.eyes]);
  if (swap) {
    const alt = (kind: "closed" | "crossed") => px(kind === "closed" ? species.eyes.closed : crossEyes(species.eyes.open, species.width));
    eyes = `<g class="${swap.hide}">${eyes}</g>${swap.alts.map((a) => `<g class="${a.cls}">${alt(a.kind)}</g>`).join("")}`;
  }

  let crown = "";
  const cs = Math.max(1, Math.round((scale * 3) / 4));
  if (hat) {
    // Hats use the pet's own pixel size, so they look part of the sprite.
    const hx = species.crownAnchor.x * scale - (hat.cx ?? hat.grid[0]!.length / 2) * scale;
    const hy = species.crownAnchor.y * scale - (hat.grid.length - (hat.sink ?? 1)) * scale;
    crown = renderPixels([{ x: 0, y: 0, grid: hat.grid }], hat.palette, { x: hx, y: hy, scale });
  } else if (legendary) {
    const cx = species.crownAnchor.x * scale - (CROWN[0]!.length * cs) / 2;
    const cy = species.crownAnchor.y * scale - CROWN.length * cs - 1.5 * scale;
    crown = `<g class="pf-bob">${renderPixels([{ x: 0, y: 0, grid: CROWN }], FX_PALETTE, { x: cx, y: cy, scale: cs })}</g>`;
  }

  let svg = [
    frames(px(limbA), px(limbB), FRAME_SPEED[state.mood]),
    px(species.body),
    px(species.mouths[face.mouth]),
    face.blush ? px(species.blush) : "",
    eyes,
    faceArt,
    crown,
  ].join("");

  let css = "";
  if (lively && playful(state.mood)) {
    // Four tricks take turns; a previewed trick plays in every window.
    const tricks = state.trick ? TRICK_STARTS.map(() => state.trick!) : tricksFor(state.date, state.login);
    let body = svg;
    let beside = "";
    tricks.forEach((trick, slot) => {
      const t = trickLayers(trick, species, scale, slot);
      body = `${t.under}${body}${t.overlay}`;
      if (t.bodyClass) body = `<g class="${t.bodyClass}">${body}</g>`;
      beside += t.beside;
      css += t.css;
    });
    const bubble = emote
      ? emoteBubble(state.mood === "happy" ? "note" : "question", species.width * scale - 4, anchors(species).top * scale - 2, "pf-emote")
      : "";
    svg = `${body}${beside}${bubble}`;
  }

  return { svg, width: species.width * scale, height: species.height * scale, css };
}

function eggSprite(state: PetState, scale: number): Sprite {
  // Cracks appear halfway to hatching.
  const layers: Layer[] = [{ x: 0, y: 0, grid: EGG }];
  if (state.xp / xpForLevel(3) >= 0.5) layers.push({ x: 0, y: 0, grid: EGG_CRACK });
  return {
    svg: renderPixels(layers, EGG_PALETTE, { scale }),
    width: EGG[0]!.length * scale,
    height: EGG.length * scale,
  };
}
