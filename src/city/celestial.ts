import { RectBatch } from "../svg/batch.js";

const SYNODIC_MONTH = 29.530588853; // days from new moon to new moon
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // 2000-01-06 18:14 UTC

/** 0 = new moon, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter. Evaluated at noon UTC. */
export function moonPhase(date: string): number {
  const t = Date.parse(`${date}T12:00:00Z`);
  const days = (t - KNOWN_NEW_MOON) / 86_400_000;
  return (((days / SYNODIC_MONTH) % 1) + 1) % 1;
}

export function moonPhaseName(phase: number): string {
  const names = [
    "new moon",
    "waxing crescent",
    "first quarter",
    "waxing gibbous",
    "full moon",
    "waning gibbous",
    "last quarter",
    "waning crescent",
  ];
  return names[Math.round(phase * 8) % 8]!;
}

/** A filled pixel circle built from horizontal slices; `px` is the pixel size. */
export function pixelCircle(batch: RectBatch, fill: string, cx: number, cy: number, radius: number, px: number): void {
  const r = Math.round(radius / px);
  for (let dy = -r; dy < r; dy++) {
    const half = Math.round(Math.sqrt(r * r - (dy + 0.5) ** 2));
    batch.add(fill, cx - half * px, cy + dy * px, half * 2 * px, px);
  }
}

/**
 * The moon as it looks on `phase`. From the north, waxing lights up from the right and
 * waning shrinks to the left; the south sees it mirrored. The unlit part stays faintly visible.
 */
export function pixelMoon(cx: number, cy: number, radius: number, px: number, phase: number, south = false): string {
  const lit = new RectBatch();
  const dark = new RectBatch();
  const r = Math.round(radius / px);
  const terminator = Math.cos(2 * Math.PI * phase);

  for (let dy = -r; dy < r; dy++) {
    const yc = (dy + 0.5) / r;
    const half = Math.sqrt(Math.max(0, 1 - yc * yc));
    const cols = Math.round(half * r);
    let runStart = -cols;
    let runLit: boolean | null = null;
    const flush = (end: number) => {
      if (runLit === null || end <= runStart) return;
      (runLit ? lit : dark).add("var(--pf-celestial)", cx + runStart * px, cy + dy * px, (end - runStart) * px, px);
    };
    for (let dx = -cols; dx < cols; dx++) {
      const xc = ((dx + 0.5) / r) * (south ? -1 : 1);
      const isLit = phase < 0.5 ? xc > half * terminator : xc < -half * terminator;
      if (isLit !== runLit) {
        flush(dx);
        runStart = dx;
        runLit = isLit;
      }
    }
    flush(cols);
  }

  return `<g opacity=".13">${dark}</g>${lit}`;
}
