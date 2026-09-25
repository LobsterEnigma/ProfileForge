import type { Mood } from "../../types.js";
import type { Layer, Palette } from "../../svg/pixel.js";

export type EyeKind = "open" | "closed" | "happy" | "sad";
export type MouthKind = "smile" | "neutral" | "frown";

/**
 * A pet species. All coordinates are in sprite pixels on a `width × height` canvas.
 * Moods pick eyes, mouth and a pair of limb frames that alternate while animating.
 *
 * Want to add your language's mascot? Copy crab.ts, redraw the grids, register it in index.ts.
 */
export interface Species {
  id: string;
  defaultName: string;
  width: number;
  height: number;
  palette: Palette;
  /** Overrides applied to `palette` once the pet turns legendary. */
  legendaryPalette: Palette;
  body: Layer[];
  eyes: Record<EyeKind, Layer[]>;
  mouths: Record<MouthKind, Layer[]>;
  blush: Layer[];
  limbs: Record<Mood, [Layer[], Layer[]]>;
  /** Pixel the legendary crown is centered above. */
  crownAnchor: { x: number; y: number };
}
