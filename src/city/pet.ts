import { renderPetSprite } from "../pet/sprite.js";
import { COMMIT, FX_PALETTE, ZED } from "../pet/sprites.js";
import { renderPixels } from "../svg/pixel.js";
import type { PetState } from "../types.js";
import { ROAD_Y } from "./layout.js";

export const CITY_PET_CSS = `
.pf-stroll{animation:pf-stroll 80s linear infinite}
@keyframes pf-stroll{0%,100%{transform:translateX(40px)}46%,50%{transform:translateX(720px)}96%{transform:translateX(40px)}}
.pf-face{transform-box:fill-box;transform-origin:center;animation:pf-face 80s steps(1) infinite}
@keyframes pf-face{0%{transform:scaleX(1)}48%{transform:scaleX(-1)}98%{transform:scaleX(1)}}
.pf-hop{animation:pf-hop .5s ease-in-out infinite}
@keyframes pf-hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.pf-zz{animation:pf-zz 2.6s ease-out infinite}
@keyframes pf-zz{0%{transform:translate(0,0);opacity:0}20%{opacity:1}100%{transform:translate(6px,-18px);opacity:0}}
`;

/** Where the pet rests when it's too hungry or sleepy to walk. */
const REST_X = 214;

/** Your pet out on the sidewalk: strolling when content, resting when not. */
export function strollingPet(pet: PetState | null): string {
  if (!pet || pet.ranAway) return "";
  // Too small for emote bubbles; the tricks stay on the pet card.
  const sprite = renderPetSprite(pet, 1, { lively: false });
  const y = ROAD_Y + 1 - sprite.height;
  const walking = pet.stage !== "egg" && (pet.mood === "happy" || pet.mood === "idle");

  if (walking) {
    const hop = pet.mood === "happy" ? ` class="pf-hop"` : "";
    return `<g class="pf-stroll" style="animation-delay:-12s"><g transform="translate(0 ${y})"><g class="pf-face" style="animation-delay:-12s"><g${hop}>${sprite.svg}</g></g></g></g>`;
  }

  const top = y;
  const right = REST_X + sprite.width;
  let thought = "";
  if (pet.mood === "sleeping") {
    thought = [0, 0.9, 1.8]
      .map(
        (delay) =>
          `<g class="pf-zz" style="animation-delay:-${delay}s">${renderPixels([{ x: 0, y: 0, grid: ZED }], FX_PALETTE, { x: right - 4, y: top - 6, scale: 1 })}</g>`,
      )
      .join("");
  } else if (pet.mood === "hungry") {
    thought = `<g class="pf-bob"><rect x="${right - 2}" y="${top - 14}" width="12" height="11" rx="4" fill="#ffffff" opacity=".9"/>${renderPixels([{ x: 0, y: 0, grid: COMMIT }], FX_PALETTE, { x: right + 1, y: top - 11, scale: 1.5 })}</g>`;
  }
  return `<g transform="translate(${REST_X} ${y})">${sprite.svg}</g>${thought}`;
}
