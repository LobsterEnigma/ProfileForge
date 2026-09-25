import type { Mood, PetState } from "../types.js";
import { renderPixels, type Layer } from "../svg/pixel.js";
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
.pf-blink-open{animation:pf-blink-open 4.2s steps(1) infinite}
.pf-blink-shut{opacity:0;animation:pf-blink-shut 4.2s steps(1) infinite}
@keyframes pf-blink-open{0%{opacity:1}94%{opacity:0}98%{opacity:1}100%{opacity:1}}
@keyframes pf-blink-shut{0%{opacity:0}94%{opacity:1}98%{opacity:0}100%{opacity:0}}
.pf-bob{animation:pf-bob 2s ease-in-out infinite}
@keyframes pf-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
`;

export interface Sprite {
  /** Drawn with its top-left corner at the origin. */
  svg: string;
  width: number;
  height: number;
}

function frames(a: string, b: string, seconds: number): string {
  if (a === b) return a;
  const style = `style="animation-duration:${seconds * 2}s"`;
  return `<g class="pf-fa" ${style}>${a}</g><g class="pf-fb" ${style}>${b}</g>`;
}

/** The pet itself (no scene, no effects), animated for its mood. */
export function renderPetSprite(state: PetState, scale: number): Sprite {
  if (state.stage === "egg") return eggSprite(state, scale);

  const species = getSpecies(state.species);
  const legendary = state.stage === "legendary";
  const palette = legendary ? { ...species.palette, ...species.legendaryPalette } : species.palette;
  const px = (layers: Layer[]) => renderPixels(layers, palette, { scale });
  const face = FACE[state.mood];

  const [limbA, limbB] = species.limbs[state.mood];
  const eyes =
    state.mood === "idle"
      ? `<g class="pf-blink-open">${px(species.eyes.open)}</g><g class="pf-blink-shut">${px(species.eyes.closed)}</g>`
      : px(species.eyes[face.eyes]);

  let crown = "";
  if (legendary) {
    const cs = Math.max(1, Math.round((scale * 3) / 4));
    const cx = species.crownAnchor.x * scale - (CROWN[0]!.length * cs) / 2;
    const cy = species.crownAnchor.y * scale - CROWN.length * cs - 1.5 * scale;
    crown = `<g class="pf-bob">${renderPixels([{ x: 0, y: 0, grid: CROWN }], FX_PALETTE, { x: cx, y: cy, scale: cs })}</g>`;
  }

  const svg = [
    frames(px(limbA), px(limbB), FRAME_SPEED[state.mood]),
    px(species.body),
    px(species.mouths[face.mouth]),
    face.blush ? px(species.blush) : "",
    eyes,
    crown,
  ].join("");

  return { svg, width: species.width * scale, height: species.height * scale };
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
