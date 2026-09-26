import type { Rng } from "../random.js";
import type { Canvas } from "./buildings.js";
import { BASE_Y, W } from "./layout.js";

export { holidayFor, type Holiday } from "../world/calendar.js";
import type { Holiday } from "../world/calendar.js";

export const EVENTS_CSS = `
.pf-xmas-a{animation:pf-xmas 1.4s steps(1) infinite}
.pf-xmas-b{animation:pf-xmas 1.4s steps(1) infinite;animation-delay:-.7s}
@keyframes pf-xmas{0%{opacity:1}50%{opacity:.25}100%{opacity:.25}}
.pf-swing{transform-box:fill-box;transform-origin:50% 0;animation:pf-swing 2.6s ease-in-out infinite alternate}
@keyframes pf-swing{0%{transform:rotate(-8deg)}100%{transform:rotate(8deg)}}
.pf-bats{animation:pf-bats 30s linear infinite}
@keyframes pf-bats{0%{transform:translateX(${W + 40}px)}100%{transform:translateX(-80px)}}
.pf-launch{animation:pf-launch 4.2s ease-out infinite}
@keyframes pf-launch{0%{transform:translateY(90px);opacity:0}5%{opacity:1}30%{transform:translateY(0);opacity:1}33%,100%{transform:translateY(0);opacity:0}}
.pf-spark{animation:pf-spark 4.2s ease-out infinite}
@keyframes pf-spark{0%,30%{transform:translate(0,0);opacity:0}32%{opacity:1}70%{opacity:.9}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
`;

const XMAS = ["#ff4d4d", "#ffd166", "#7dd3fc", "#7dff9b"];

/** Rooftop decorations for the holiday, on a building whose roof is at `top`. */
export function roofDecor(c: Canvas, rng: Rng, x: number, top: number, holiday: Holiday | null): void {
  if (holiday === "halloween" && rng() < 0.22) {
    pumpkin(c, x + 4, top - 4);
  } else if (holiday === "christmas") {
    // A string of lights along the roofline, blinking in two alternating sets.
    for (let i = 0; i < 5; i++) {
      const cls = i % 2 ? "pf-xmas-b" : "pf-xmas-a";
      c.extras.push(`<rect class="${cls}" x="${x + 1 + i * 3}" y="${top - 1}" width="2" height="2" fill="${XMAS[(i + Math.floor(rng() * 4)) % 4]}"/>`);
    }
  } else if (holiday === "lunar-new-year" && rng() < 0.3) {
    lantern(c, x + 1, top + 2);
  }
}

/** Park decorations: pumpkins on the grass, lanterns on a string. */
export function parkDecor(c: Canvas, rng: Rng, x: number, holiday: Holiday | null): void {
  if (holiday === "halloween" && rng() < 0.6) pumpkin(c, x + 1, BASE_Y - 6);
  if (holiday === "lunar-new-year" && rng() < 0.5) lantern(c, x + 8, BASE_Y - 24);
}

function pumpkin(c: Canvas, x: number, y: number): void {
  c.extras.push(
    `<rect x="${x}" y="${y}" width="6" height="4" rx="1" fill="#f28c28"/>`,
    `<rect x="${x + 2}" y="${y - 1}" width="2" height="1" fill="#3f7d3a"/>`,
    `<rect x="${x + 1}" y="${y + 1}" width="1" height="1" fill="#3b1d00"/>`,
    `<rect x="${x + 4}" y="${y + 1}" width="1" height="1" fill="#3b1d00"/>`,
  );
}

function lantern(c: Canvas, x: number, y: number): void {
  c.extras.push(
    `<g class="pf-swing"><rect x="${x + 1}" y="${y}" width="2" height="1" fill="#ffd166"/>`,
    `<rect x="${x}" y="${y + 1}" width="4" height="5" rx="1" fill="#e63946"/>`,
    `<rect x="${x + 1}" y="${y + 6}" width="2" height="2" fill="#ffd166"/></g>`,
  );
}

/** Halloween bats flapping across the sky. */
export function bats(holiday: Holiday | null): string {
  if (holiday !== "halloween") return "";
  const bat = (dx: number, dy: number) =>
    `<g transform="translate(${dx} ${dy})"><path class="pf-flap-a" d="M0 1L2 0L3 2L4 0L6 1"/><path class="pf-flap-b" d="M0 0L2 2L3 1L4 2L6 0"/></g>`;
  // Flying at the moon's height, so their silhouettes cross it.
  return `<g class="pf-bats" style="animation-delay:-4s"><g transform="translate(0 72)" fill="none" stroke="#140c1c" stroke-width="1.6">${bat(0, 0)}${bat(12, 7)}${bat(24, -4)}${bat(36, 5)}${bat(48, -1)}</g></g>`;
}

const SPARK_COLORS = ["#ff5c7a", "#ffd166", "#7dd3fc", "#c3a6ff", "#7dff9b"];

/** Fireworks over the skyline, for records, long streaks and New Year. */
export function fireworks(rng: Rng): string {
  const out: string[] = [];
  for (let b = 0; b < 3; b++) {
    const cx = Math.round(140 + b * 220 + rng() * 80);
    const cy = Math.round(72 + rng() * 40);
    const color = SPARK_COLORS[Math.floor(rng() * SPARK_COLORS.length)]!;
    const delay = `animation-delay:-${(b * 1.4).toFixed(1)}s`;
    out.push(`<rect class="pf-launch" style="${delay}" x="${cx}" y="${cy}" width="2" height="5" fill="${color}"/>`);
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const r = 20 + rng() * 10;
      const dx = Math.round(Math.cos(angle) * r);
      const dy = Math.round(Math.sin(angle) * r + 8);
      out.push(
        `<rect class="pf-spark" style="${delay};--dx:${dx}px;--dy:${dy}px" x="${cx}" y="${cy}" width="2" height="2" fill="${color}"/>`,
      );
    }
  }
  return `<g>${out.join("")}</g>`;
}
