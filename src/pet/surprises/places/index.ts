/** Every weekend-trip destination. */
import { AFRICA } from "./africa.js";
import { AMERICAS } from "./americas.js";
import { ASIA } from "./asia.js";
import { EUROPE } from "./europe.js";
import { OCEANIA } from "./oceania.js";
import { PROGRAMMER_PLACES } from "./programmer.js";
import type { Place } from "./types.js";

export const PLACES: Place[] = [...PROGRAMMER_PLACES, ...ASIA, ...EUROPE, ...AFRICA, ...AMERICAS, ...OCEANIA];
