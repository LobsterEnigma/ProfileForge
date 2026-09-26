/**
 * Grime on the pet card: smudges, stink and flies when it needs a bath. (Fresh visits are
 * scenes of their own, in visits.ts.)
 */
import type { CareView, Visitor } from "../care/view.js";
import { seeded } from "../random.js";
import { RectBatch } from "../svg/batch.js";

export const CARE_CSS = `
.pf-stink{opacity:0;animation:pf-stink 2.8s ease-out infinite}
@keyframes pf-stink{0%{transform:translateY(0);opacity:0}20%{opacity:.8}100%{transform:translateY(-22px);opacity:0}}
.pf-orbit{animation:pf-orbit 2.2s linear infinite}
@keyframes pf-orbit{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
.pf-buzz{animation:pf-buzz-fly .15s steps(1) infinite}
@keyframes pf-buzz-fly{0%{opacity:1}50%{opacity:.4}100%{opacity:.4}}
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
  return out.join("");
}

/**
 * The status line after a recent visit. The login was validated when the care log was read,
 * and the panel escapes the whole line.
 */
export function visitorLine(care: CareView | undefined): string | null {
  return care?.visitor ? lineFor(care.visitor) : null;
}

/** "Fed by …", "Bathed by …" or "Played with …". */
export function lineFor(v: Visitor): string {
  return { feed: `Fed by ${v.login} ♥`, bath: `Bathed by ${v.login} ✧`, play: `Played with ${v.login} ♪` }[v.action];
}
