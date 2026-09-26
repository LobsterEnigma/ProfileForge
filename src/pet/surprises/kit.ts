/**
 * Shared pieces for surprises: what a surprise can add to the card, and the small helpers
 * (banners, falling particles) most of them use.
 */
import type { Rng } from "../../random.js";
import { renderPixels, type Grid, type Palette } from "../../svg/pixel.js";
import { pixelText, textWidth } from "../../svg/pixelfont.js";
import type { PetState } from "../../types.js";
import type { Season } from "../../world/seasons.js";
import type { Span } from "../life.js";
import type { Species } from "../species/types.js";
import type { Hat } from "../sprite.js";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The pet card's little world: its top-left corner, size, and the ground line. */
export interface Scene extends Box {
  ground: number;
}

/** Everything a surprise needs to know to dress up the card. */
export interface Ctx {
  state: PetState;
  /** The species drawn today (a different one in disguise on April Fools). */
  species: Species;
  scale: number;
  /** Where the sprite stands (scene coordinates) before it starts walking. */
  box: Box;
  scene: Scene;
  season: Season;
  rng: Rng;
}

/** What a surprise adds. Every part is optional. */
export interface Art {
  css?: string;
  /** Scene coordinates, behind the pet: sky and ground decorations. */
  back?: string;
  /** Scene coordinates, in front of the pet: confetti, snow, hearts. */
  front?: string;
  /** A pixel-text ribbon across the top of the scene. */
  banner?: { text: string; color: string; shade: string; ink?: string };
  /** Worn instead of the crown. */
  hat?: Hat;
  /** Over the eyes, in sprite coordinates × scale: glasses, a disguise. */
  face?: string;
  /** Carried along, in sprite coordinates × scale (inside the body's hops and turns). */
  held?: string;
  /** Over the pet in sprite coordinates, but not turned or hopping with it: labels, bubbles. */
  over?: string;
  /** Scene coordinates, following the pet's walk (a UFO overhead, a light beam). */
  follow?: string;
  /** Wraps the pet's body (being beamed up). */
  bodyClass?: string;
  /** When the pet goes cross-eyed (seconds of the 24s day). */
  crossed?: Span[];
  /** Replaces the pet altogether (it's away, and sent a postcard). */
  replace?: string;
  /** Replaces the status line under the stats. */
  line?: string;
}

export const round = (n: number) => Math.round(n * 100) / 100;

export function px(grid: Grid, palette: Palette, x: number, y: number, scale: number): string {
  return renderPixels([{ x: 0, y: 0, grid }], palette, { x: round(x), y: round(y), scale });
}

/** Pixel text with a one-pixel drop shadow. */
export function text(value: string, x: number, y: number, scale: number, color: string, shadow?: string): string {
  const grid = pixelText(value);
  return (shadow ? px(grid, { x: shadow }, x + scale / 2, y + scale / 2, scale) : "") + px(grid, { x: color }, x, y, scale);
}

export const textSize = (value: string, scale: number) => ({ w: textWidth(value) * scale, h: 5 * scale });

/**
 * A ribbon banner across the top of the scene, with notched tails and a sheen. It is fully
 * visible on the first frame, for viewers that don't animate SVGs.
 */
export function banner({ text: value, color, shade, ink = "#ffffff" }: NonNullable<Art["banner"]>, scene: Scene): string {
  const s = 2;
  const t = textSize(value, s);
  const w = t.w + 16;
  const h = 16;
  const x = round(scene.x + (scene.w - w) / 2);
  const y = scene.y + 7;
  const tail = (tx: number, dir: 1 | -1) => {
    const outer = tx - dir * 10;
    return `<path d="M${tx} ${y + 4}H${outer}L${outer + dir * 4} ${y + 12}L${outer} ${y + 20}H${tx}Z" fill="${shade}"/>`;
  };
  return (
    `<g class="pf-s-banner">` +
    tail(x + 6, 1) +
    tail(x + w - 6, -1) +
    `<path d="M${x} ${y + h}l6 4v-4zM${x + w} ${y + h}l-6 4v-4z" fill="#000" opacity=".35"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="2" fill="#fff" opacity=".35"/>` +
    `<clipPath id="pf-s-ribbon"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>` +
    `<g clip-path="url(#pf-s-ribbon)"><rect class="pf-s-sheen" style="--w:${w + 30}px" x="${x - 20}" y="${y}" width="8" height="${h}" fill="#fff" opacity=".45" transform="skewX(-20)"/></g>` +
    text(value, x + 8, y + 3, s, ink, shade) +
    `</g>`
  );
}

/**
 * Things drifting down (or up, with a negative `fall`) across the scene, each starting at a
 * random spot and time. `draw` gets the item's index and returns it drawn at the origin.
 */
export function drift(
  rng: Rng,
  scene: Scene,
  count: number,
  draw: (i: number) => string,
  { fall = scene.h + 20, sway = 10, seconds = [5, 9] as [number, number], from = scene.y - 10 } = {},
): string {
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = round(scene.x + 4 + rng() * (scene.w - 12));
    const t = round(seconds[0] + rng() * (seconds[1] - seconds[0]));
    const delay = round(rng() * t);
    const sx = Math.round((rng() - 0.5) * 2 * sway);
    out += `<g class="pf-s-fall" style="--t:${t}s;--fy:${fall}px;--sx:${sx}px;animation-delay:-${delay}s"><g transform="translate(${x} ${from})">${draw(i)}</g></g>`;
  }
  return out;
}

/** Keyframes for the shared helpers; every card with a surprise carries them. */
export const KIT_CSS = `
.pf-s-banner{animation:pf-s-banner 3.2s ease-in-out infinite}
@keyframes pf-s-banner{0%,100%{transform:none}50%{transform:translateY(1.5px)}}
.pf-s-sheen{animation:pf-s-sheen 6s ease-in-out infinite}
@keyframes pf-s-sheen{0%,55%{transform:translateX(0) skewX(-20deg)}100%{transform:translateX(var(--w)) skewX(-20deg)}}
.pf-s-fall{animation:pf-s-fall var(--t) linear infinite}
@keyframes pf-s-fall{0%{transform:translate(0,0)}50%{transform:translate(var(--sx),calc(var(--fy)/2))}100%{transform:translate(0,var(--fy))}}
.pf-s-flip{transform-box:fill-box;transform-origin:center;animation:pf-s-flip .9s ease-in-out infinite}
@keyframes pf-s-flip{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.15)}}
.pf-s-blink{animation:pf-s-blink 1.2s steps(1) infinite}
.pf-s-blink2{animation:pf-s-blink 1.2s steps(1) infinite;animation-delay:-.6s}
@keyframes pf-s-blink{0%{opacity:1}50%{opacity:.2}}
.pf-s-swing{transform-box:fill-box;transform-origin:50% 0;animation:pf-s-swing 2.8s ease-in-out infinite alternate}
@keyframes pf-s-swing{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}
.pf-s-float{animation:pf-s-float 2.6s ease-in-out infinite alternate}
@keyframes pf-s-float{to{transform:translateY(-5px)}}
.pf-s-flicker{animation:pf-s-flicker 1.6s steps(1) infinite}
@keyframes pf-s-flicker{0%{opacity:1}20%{opacity:.6}24%{opacity:1}61%{opacity:.75}66%{opacity:1}}
.pf-s-twinkle{transform-box:fill-box;transform-origin:center;animation:pf-s-twinkle 1.8s ease-in-out infinite}
@keyframes pf-s-twinkle{0%,100%{opacity:.2;transform:scale(.5)}50%{opacity:1;transform:scale(1)}}
.pf-s-spark{opacity:0;animation:pf-s-spark 3.6s ease-out infinite}
@keyframes pf-s-spark{0%,8%{transform:translate(0,0);opacity:0}10%{opacity:1}60%{opacity:.9}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
.pf-s-steam{animation:pf-s-steam 2.4s ease-out infinite}
@keyframes pf-s-steam{0%{transform:translate(0,0);opacity:0}20%{opacity:.8}100%{transform:translate(3px,-14px);opacity:0}}
`;

/** Fireworks: a few bursts of sparks over the scene. */
export function fireworks(rng: Rng, scene: Scene, colors: string[], count = 3): string {
  let out = "";
  for (let b = 0; b < count; b++) {
    const cx = Math.round(scene.x + 30 + ((scene.w - 60) * (b + rng() * 0.6)) / count);
    const cy = Math.round(scene.y + 34 + rng() * 26);
    const color = colors[b % colors.length]!;
    const delay = `animation-delay:-${round(b * 1.2 + rng() * 0.4)}s`;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = 14 + rng() * 8;
      const dx = Math.round(Math.cos(angle) * r);
      const dy = Math.round(Math.sin(angle) * r + 6);
      out += `<rect class="pf-s-spark" style="${delay};--dx:${dx}px;--dy:${dy}px" x="${cx}" y="${cy}" width="2" height="2" fill="${i % 3 ? color : "#fff"}"/>`;
    }
  }
  return out;
}

export const CONFETTI = ["#ff5c7a", "#ffd166", "#4cc9f0", "#7dff9b", "#c3a6ff", "#ff9f43"];

/** Confetti pieces fluttering down. */
export function confetti(rng: Rng, scene: Scene, count: number, colors = CONFETTI): string {
  return drift(rng, scene, count, (i) => `<rect class="pf-s-flip" style="animation-delay:-${round(rng())}s" width="3" height="4" fill="${colors[i % colors.length]}"/>`, {
    seconds: [4, 7],
    sway: 14,
  });
}
