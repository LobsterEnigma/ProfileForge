/**
 * Milestones from the contribution data: the account's birthday, a fresh level-up, and
 * coming back after a long silence.
 */
import { RectBatch } from "../../svg/batch.js";
import type { Grid } from "../../svg/pixel.js";
import { anchors } from "../behavior.js";
import { SPARKLE } from "../sprites.js";
import { CONFETTI, confetti, px, round, text, textSize, type Art, type Ctx } from "./kit.js";
import { PARTY_HAT } from "./wear.js";

// ── GitHub birthday ──────────────────────────────────────────────────────────

/** A cake with one candle per year (up to five). */
function cake(years: number): { cake: Grid; flames: Grid } {
  const n = Math.max(1, Math.min(5, years));
  const cols = Array.from({ length: n }, (_, i) => 7 - (n - 1) + 2 * i);
  const row = (ch: string) => Array.from({ length: 14 }, (_, x) => (cols.includes(x) ? ch : ".")).join("");
  return {
    flames: [row("f"), ...Array(10).fill("..............")],
    cake: [
      "..............",
      row("c"),
      row("c"),
      "..pppppppppp..",
      ".pppppppppppp.",
      ".pbpbppbpppbp.",
      ".bbbbbbbbbbbb.",
      ".bsbbbsbbbsbb.",
      ".bbbbbbbbbbbb.",
      "dddddddddddddd",
    ],
  };
}

const BALLOON: Grid = [".bbb.", "bhbbb", "bhbbb", "bbbbb", ".bbb.", "..b.."];

function birthday(c: Ctx): Art {
  const { scene: sc } = c;
  const years = c.state.moments?.birthday ?? 1;
  const { cake: body, flames } = cake(years);
  const cx = sc.x + 6;
  const cy = sc.ground - body.length * 3 + 3;
  const cakeSvg =
    px(body, { c: "#74c0fc", p: "#ffc9de", b: "#c68b59", s: "#ff6b6b", d: "#dee2e6" }, cx, cy, 3) +
    `<g class="pf-s-flicker">${px(flames, { f: "#ffd43b" }, cx, cy, 3)}</g>`;

  // Bunting sagging across the sky.
  let bunting = `<path d="M${sc.x} ${sc.y + 44}Q${sc.x + sc.w / 2} ${sc.y + 60} ${sc.x + sc.w} ${sc.y + 44}" fill="none" stroke="#8d96a0" stroke-width="1"/>`;
  for (let i = 0; i < 11; i++) {
    const x = sc.x + 6 + i * 18;
    const t = (x - sc.x) / sc.w;
    const y = sc.y + 44 + 16 * 2 * t * (1 - t);
    const color = CONFETTI[i % CONFETTI.length]!;
    bunting += `<path d="M${round(x)} ${round(y)}h8l-4 8z" fill="${color}"/>`;
  }
  const balloons = [
    [sc.x + sc.w - 40, sc.y + 66, "#ff6b6b", "#ffa8a8", 0],
    [sc.x + sc.w - 26, sc.y + 58, "#4dabf7", "#a5d8ff", 0.9],
  ] as const;
  let air = "";
  for (const [x, y, b, h, d] of balloons) {
    air += `<g class="pf-s-float" style="animation-delay:-${d}s"><path d="M${x + 5} ${y + 12}q-3 12 1 ${sc.ground - y - 12}" fill="none" stroke="#8d96a0" stroke-width="1"/>${px(BALLOON, { b, h }, x, y, 2)}</g>`;
  }
  return {
    back: bunting + air + cakeSvg,
    front: confetti(c.rng, sc, 10),
    hat: PARTY_HAT,
    banner: { text: `${years} YEAR${years === 1 ? "" : "S"} ON GITHUB`, color: "#e64980", shade: "#5c0f30" },
    line: `GitHub birthday · ${years} year${years === 1 ? "" : "s"} today`,
  };
}

// ── Level up ─────────────────────────────────────────────────────────────────

function levelUpTitle(from: number, to: number): string {
  if (from < 3 && to >= 3) return "IT HATCHED!";
  if (from < 15 && to >= 15) return "ALL GROWN UP!";
  if (from < 50 && to >= 50) return "LEGENDARY!";
  return "LEVEL UP!";
}

function levelUp(c: Ctx): Art {
  const { scene: sc, box, state } = c;
  const from = state.moments?.levelUp ?? state.level - 1;
  const pw = Math.round(box.w * 0.9);
  const px0 = round(box.x + (box.w - pw) / 2);
  const bottom = box.y + box.h;
  const pillar =
    `<defs><linearGradient id="pf-s-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066" stop-opacity="0"/><stop offset=".7" stop-color="#ffe066" stop-opacity=".55"/><stop offset="1" stop-color="#fff9db" stop-opacity=".9"/></linearGradient></defs>` +
    `<rect class="pf-s-pulse" x="${px0}" y="${sc.y}" width="${pw}" height="${bottom - sc.y}" fill="url(#pf-s-beam)"/>`;
  let sparkles = "";
  for (let i = 0; i < 6; i++) {
    const x = round(px0 + 4 + c.rng() * (pw - 12));
    const t = round(2.2 + c.rng() * 1.6);
    sparkles += `<g class="pf-s-fall" style="--t:${t}s;--fy:-${bottom - sc.y - 20}px;--sx:0px;animation-delay:-${round(c.rng() * t)}s">${px(SPARKLE, { s: "#fff3a0" }, x, bottom - 12, 1.5)}</g>`;
  }
  const label = `LV ${state.level}`;
  const t = textSize(label, 2);
  const top = anchors(c.species).top * c.scale;
  const pop = `<g class="pf-s-pop">${text(label, round(box.w / 2 - t.w / 2), top - 26, 2, "#ffd43b", "#7a4f00")}</g>`;
  return {
    css: `.pf-s-pulse{animation:pf-s-pulse 1.6s ease-in-out infinite}@keyframes pf-s-pulse{0%,100%{opacity:.65}50%{opacity:1}}
.pf-s-pop{animation:pf-s-pop 3s ease-out infinite}@keyframes pf-s-pop{0%{transform:translateY(8px);opacity:0}15%{transform:translateY(0);opacity:1}75%{opacity:1}100%{transform:translateY(-8px);opacity:0}}`,
    follow: pillar + sparkles,
    over: pop,
    banner: { text: levelUpTitle(from, state.level), color: "#f59f00", shade: "#5c3a00" },
    line: `Level up! · Lv.${from} → Lv.${state.level}`,
  };
}

// ── Welcome back ─────────────────────────────────────────────────────────────

const RAINBOW = ["#ff6b6b", "#ffa94d", "#ffd43b", "#69db7c", "#4dabf7", "#9775fa"];

function welcomeBack(c: Ctx): Art {
  const { scene: sc } = c;
  const days = c.state.moments?.welcomeBack ?? 7;
  const cx = sc.x + sc.w / 2;
  const cy = sc.ground;
  const arcs = RAINBOW.map((color, i) => {
    const r = 90 - i * 3.5;
    return `<path d="M${round(cx - r)} ${cy}A${r} ${r} 0 0 1 ${round(cx + r)} ${cy}" fill="none" stroke="${color}" stroke-width="3.6"/>`;
  }).join("");
  const cloud = (x: number) => new RectBatch().add("#ffffff", x - 14, cy - 10, 28, 10).add("#ffffff", x - 8, cy - 16, 16, 6).add("#ffffff", x - 18, cy - 5, 36, 5).toString();
  return {
    css: `.pf-s-shimmer{animation:pf-s-shimmer 3s ease-in-out infinite}@keyframes pf-s-shimmer{0%,100%{opacity:.75}50%{opacity:.95}}`,
    back: `<g class="pf-s-shimmer" opacity=".75">${arcs}</g>${cloud(cx - 80)}${cloud(cx + 80)}`,
    front: confetti(c.rng, sc, 10),
    banner: { text: "WELCOME BACK!", color: "#1c7ed6", shade: "#082c52" },
    line: `Welcome back! · missed you ${days} days`,
  };
}

export const MOMENT_ART = { birthday, "level-up": levelUp, "welcome-back": welcomeBack } as const;
