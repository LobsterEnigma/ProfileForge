/**
 * Shared dimensions of the city card, in SVG units. Top to bottom: the sky, the skyline on the
 * waterfront, a sidewalk and a road along the quay, then the bay that reflects it all.
 */
export const W = 800;
export const H = 260;
/** One "pixel" of pixel art. */
export const U = 2;
/** Where buildings stand. */
export const BASE_Y = 182;
/** The road along the quay, below a strip of sidewalk. */
export const ROAD_Y = 185;
/** Two lanes of 10px, so cars going opposite ways pass without overlapping. */
export const LANE_H = 10;
/** The coping on top of the seawall; its stone face drops from here to the water. */
export const QUAY_Y = ROAD_Y + 2 * LANE_H;
/** The waterline, at the foot of the seawall. */
export const WATER_Y = QUAY_Y + 10;
/** The quay's reflection hugs the wall; the city's starts just below it. */
export const MIRROR_Y = WATER_Y + 4;
/** A regular week's building width; busy weeks are wider, see `widthFor`. */
export const BUILDING_W = 7 * U;
export const FLOOR_H = 3 * U;
/** Leaves headroom for the landmark's sign and antenna under the title. */
export const MAX_FLOORS = 17;
export const RIGHT_EDGE = W - 24;
