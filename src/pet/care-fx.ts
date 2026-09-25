/**
 * How visitors' care shows on the pet card: smudges, stink and flies when it needs a bath,
 * soap bubbles right after one, a food bowl and a ball on the ground.
 */
import type { CareView } from "../care/view.js";
import { seeded } from "../random.js";
import { RectBatch } from "../svg/batch.js";

export const CARE_CSS = `
.pf-stink{opacity:0;animation:pf-stink 2.8s ease-out infinite}
@keyframes pf-stink{0%{transform:translateY(0);opacity:0}20%{opacity:.8}100%{transform:translateY(-22px);opacity:0}}
.pf-orbit{animation:pf-orbit 2.2s linear infinite}
@keyframes pf-orbit{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
.pf-buzz{animation:pf-buzz-fly .15s steps(1) infinite}
@keyframes pf-buzz-fly{0%{opacity:1}50%{opacity:.4}100%{opacity:.4}}
.pf-soap{opacity:0;animation:pf-soap 3s ease-out infinite}
@keyframes pf-soap{0%{transform:translateY(0);opacity:0}15%{opacity:.9}100%{transform:translateY(-30px);opacity:0}}
`;

/** Drawn in sprite coordinates, so it moves with the pet. */
export function careOverlay(care: CareView | undefined, w: number, h: number, scale: number): string {
  if (!care) return "";
  const out: string[] = [];

  if (care.dirt > 0) {
    // Smudges in fixed spots on the body; more of them the dirtier it gets.
    const rng = seeded("smudges");
    const spots = new RectBatch();
    for (let i = 0; i < [0, 3, 5, 7][care.dirt]!; i++) {
      const x = Math.round(w * (0.25 + rng() * 0.5));
      const y = Math.round(h * (0.35 + rng() * 0.5));
      spots.add("#6b4b2a", x, y, 2 * scale, Math.max(2, scale));
    }
    out.push(`<g opacity=".7">${spots}</g>`);
  }
  if (care.dirt >= 2) {
    // Wavy stink lines rising from the head.
    for (const [i, dx] of [w * 0.25, w * 0.5, w * 0.75].entries()) {
      const x = Math.round(dx);
      out.push(
        `<path class="pf-stink" style="animation-delay:-${(i * 0.9).toFixed(1)}s" d="M${x} -2q3 -3 0 -6t0 -6" fill="none" stroke="#7aa35a" stroke-width="2"/>`,
      );
    }
  }
  if (care.dirt >= 3) {
    // Flies circling the head.
    const cx = w / 2;
    const cy = h * 0.2;
    for (const [i, r] of [w * 0.45, w * 0.6, w * 0.38].entries()) {
      out.push(
        // Rotating around the group's own origin, which sits on the head.
        `<g transform="translate(${cx} ${cy})"><g class="pf-orbit" style="animation-delay:-${(i * 0.7).toFixed(1)}s;animation-duration:${(1.8 + i * 0.5).toFixed(1)}s"><g class="pf-buzz"><rect x="${Math.round(r)}" y="0" width="3" height="2" fill="#1a1a1a"/><rect x="${Math.round(r)}" y="-2" width="2" height="2" fill="#ffffff" opacity=".8"/></g></g></g>`,
      );
    }
  }
  if (care.bathed) {
    for (const [i, x] of [w * 0.15, w * 0.5, w * 0.85].entries()) {
      out.push(
        `<rect class="pf-soap" style="animation-delay:-${(i * 1).toFixed(1)}s" x="${Math.round(x)}" y="${Math.round(h * 0.3)}" width="${2 * scale}" height="${2 * scale}" rx="${scale}" fill="none" stroke="#9fd0ec" stroke-width="1.5"/>`,
      );
    }
  }
  return out.join("");
}

/** A food bowl and a ball on the ground, in card coordinates. */
export function careProps(care: CareView | undefined, left: number, right: number, ground: number): string {
  if (!care) return "";
  const b = new RectBatch();
  if (care.fed) {
    b.add("#b5543a", left, ground + 2, 20, 6).add("#b5543a", left + 2, ground + 8, 16, 2).add("#e9c46a", left + 3, ground, 14, 3);
  }
  if (care.played) {
    b.add("#e63946", right - 12, ground + 1, 10, 10).add("#ffffff", right - 12, ground + 5, 10, 2);
  }
  return b.toString();
}

/**
 * The status line after a recent visit. The login was validated when the care log was read,
 * and the panel escapes the whole line.
 */
export function visitorLine(care: CareView | undefined): string | null {
  if (!care?.visitor) return null;
  const who = care.visitor.login;
  return { feed: `Fed by ${who} ♥`, bath: `Bathed by ${who} ✧`, play: `Played with ${who} ♪` }[care.visitor.action];
}
