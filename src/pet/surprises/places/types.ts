/** What a weekend-trip destination brings: a photo, a stamp and a souvenir. */
import type { Grid } from "../../../svg/pixel.js";

/** The photo on the postcard, in pixels. */
export const PW = 96;
export const PH = 60;

export interface Icon {
  grid: Grid;
  colors: Record<string, string>;
}

export interface Point {
  x: number;
  y: number;
}

export interface Place {
  name: string;
  ink: string;
  stamp: Icon & { bg: string };
  souvenir: Icon & { name: string };
  /** Paints the photo from its top-left corner; `feet` is where the pet stands (its centre-bottom). */
  draw: (x: number, y: number) => { bg: string; feet: Point; fg?: string; friend?: Point };
}
